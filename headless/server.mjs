// ojjyProxy headless engine service.
//
// Remote browser isolation: each WebSocket session drives one page in a
// server-side headless Chromium and receives a live JPEG pixel stream. The
// client never contacts destinations — this service does — and page content
// crosses the network as images, which URL- and content-keyword filters
// cannot read the way they read rewritten HTML.
//
// Protocol (JSON text frames, except pixel data):
//   client → {type:"hello", width, height, blocked:[...]}   first message
//           {type:"navigate", url} | back | forward | reload
//           {type:"mouse", action:"move|down|up", x, y, button, clickCount}
//           {type:"wheel", x, y, deltaX, deltaY}
//           {type:"key", action:"down|up", key}
//           {type:"resize", width, height} | {type:"inspect"} | {type:"ping"}
//   server → binary frames: 0x01 byte + JPEG bytes
//           {type:"hello-ok"} | {type:"navigating", url}
//           {type:"loaded", url, title} | {type:"popup", url}
//           {type:"links", links:[{text,x,y,w,h}]} | {type:"error", message}
//           {type:"cache-cleared"} | {type:"pong"} | {type:"closed", reason}
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { WebSocket, WebSocketServer } from "ws";
import { chromium } from "playwright-core";
import { assertNavigatable, isPrivateHost } from "./guards.mjs";
import {
  bounded,
  captureSize,
  jpegSize,
  MAX_BUFFER,
  MAX_DIMENSION,
  MAX_PIXELS,
  MAX_QUEUE,
} from "./helpers.mjs";

const PORT = Number(process.env.HEADLESS_PORT || 9100);
const ORIGINS =
  (process.env.HEADLESS_ORIGINS || process.env.HEADLESS_SELF || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
// The origin of the ojjyProxy shell allowed to embed this runtime page.
const PARENT = process.env.HEADLESS_PARENT || "";
// This service's own public origin (used for the WebSocket allowlist).
const SELF = process.env.HEADLESS_SELF || "";
const TOKEN = process.env.HEADLESS_TOKEN || "";
const MAX_SESSIONS = Number(process.env.HEADLESS_MAX_SESSIONS || 2);
const IDLE_MS = Number(process.env.HEADLESS_IDLE_MS || 120000);
const MAX_AGE_MS = Number(process.env.HEADLESS_MAX_AGE_MS || 30 * 60 * 1000);
const QUALITY = Math.round(
  bounded(Number(process.env.HEADLESS_QUALITY ?? 78), 78, 0, 100),
);
const NAV_TIMEOUT_MS = 45000;
// Dev/test escape hatch: permits navigating to localhost fixtures. Never set
// this on a cloud deployment — the private-network block is what stops the
// browser from being used to probe the host's internal network.
const ALLOW_PRIVATE = process.env.HEADLESS_ALLOW_PRIVATE === "1";

const sessions = new Set();
let browser = null;
async function getBrowser() {
  if (browser?.isConnected()) return browser;
  const args = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"];
  try {
    // Prefer the smaller headless-shell build when it is installed.
    browser = await chromium.launch({
      headless: true,
      channel: "chromium-headless-shell",
      args,
    });
  } catch {
    browser = await chromium.launch({ headless: true, args });
  }
  browser.on("disconnected", () => {
    browser = null;
  });
  return browser;
}

function attachSession(ws, hello) {
  const initialSize = captureSize(hello);
  const { width, height } = initialSize;
  const blocked = Array.isArray(hello.blocked)
    ? hello.blocked.filter((item) =>
      typeof item === "string" && item.length < 200
    ).slice(0, 256)
    : [];
  const session = {
    ws,
    blocked,
    lastUrl: "",
    typed: new Set(),
    modifiers: new Set(),
    closed: false,
    ready: false,
    queue: [],
    size: initialSize,
    held: new Set(),
    startedAt: Date.now(),
    popupReported: new WeakSet(),
  };
  sessions.add(session);
  const send = (message) => {
    if (!session.closed && ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(message);
      if (ws.bufferedAmount + Buffer.byteLength(payload) > MAX_BUFFER) {
        void session.end?.("output backpressure");
        return;
      }
      ws.send(payload);
    }
  };
  const fail = (message) => send({ type: "error", message });

  const end = async (reason) => {
    if (session.closed) return;
    session.closed = true;
    clearTimeout(session.idleTimer);
    clearInterval(session.ageTimer);
    clearTimeout(session.captureTimer);
    sessions.delete(session);
    try {
      for (const key of session.held) {
        await session.page?.keyboard.up(key).catch(() => {});
      }
      session.held.clear();
      session.cdp?.detach?.().catch(() => {});
    } catch { /* already detached */ }
    try {
      await session.context?.close();
    } catch { /* already closed */ }
    console.log(
      `[headless] session ended (${reason}); active=${sessions.size}`,
    );
    if (!session.closed || true) {
      try {
        ws.close(1000, reason);
      } catch { /* already closed */ }
    }
  };
  session.end = end;

  session.idleTimer = setTimeout(() => end("idle timeout"), IDLE_MS);
  session.ageTimer = setInterval(() => {
    if (Date.now() - session.startedAt > MAX_AGE_MS) end("session age limit");
  }, 15000);

  const resetIdle = () => {
    clearTimeout(session.idleTimer);
    session.idleTimer = setTimeout(() => end("idle timeout"), IDLE_MS);
  };
  function sendFrame(bytes, mode) {
    const dimensions = jpegSize(bytes);
    if (
      !dimensions || dimensions.width > MAX_DIMENSION ||
      dimensions.height > MAX_DIMENSION ||
      dimensions.width * dimensions.height > MAX_PIXELS ||
      bytes.length > MAX_BUFFER
    ) return;
    const signature = `${mode}:${dimensions.width}:${dimensions.height}`;
    if (signature !== session.frameSignature) {
      session.frameSignature = signature;
      send({
        type: "capture",
        ...dimensions,
        scale: dimensions.width / session.size.width,
        scaleY: dimensions.height / session.size.height,
        mode,
      });
    }
    if (
      !session.closed && ws.readyState === WebSocket.OPEN &&
      ws.bufferedAmount < MAX_BUFFER - bytes.length
    ) {
      ws.send(Buffer.concat([Buffer.from([1]), bytes]));
    }
  }
  async function screenshotLoop() {
    if (session.closed || !session.fallback) return;
    try {
      if (!session.resizing && ws.bufferedAmount < MAX_BUFFER / 2) {
        const size = session.size;
        const bytes = await session.page.screenshot({
          type: "jpeg",
          quality: QUALITY,
          scale: "device",
          timeout: 5000,
        });
        if (session.fallback && !session.resizing && size === session.size) {
          sendFrame(bytes, "screenshot");
        }
      }
    } catch { /* navigation can interrupt a capture */ }
    if (!session.closed && session.fallback) {
      session.captureTimer = setTimeout(screenshotLoop, 150);
    }
  }
  const startScreencast = () =>
    session.cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: QUALITY,
      maxWidth: session.size.pixelWidth,
      maxHeight: session.size.pixelHeight,
      everyNthFrame: 1,
    });

  (async () => {
    const context = await (await getBrowser()).newContext({
      viewport: { width, height },
      deviceScaleFactor: initialSize.scale,
    });
    session.context = context;
    if (session.closed) {
      await context.close();
      return;
    }
    // Request-level guard: anything the page itself tries to fetch toward a
    // private or blocked host is aborted before it leaves the browser.
    await context.route("**/*", (route) => {
      try {
        const host = new URL(route.request().url()).hostname;
        if (
          !ALLOW_PRIVATE && isPrivateHost(host) ||
          blocked.some((entry) => host === entry || host.endsWith("." + entry))
        ) return route.abort();
      } catch {
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    session.page = page;
    const cdp = await context.newCDPSession(page);
    session.cdp = cdp;
    cdp.on("Page.screencastFrame", (event) => {
      // Ack even dropped frames; never queue images behind a slow socket.
      cdp.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(
        () => {},
      );
      if (
        session.closed || session.resizing || session.fallback ||
        ws.readyState !== WebSocket.OPEN
      ) return;
      const bytes = Buffer.from(event.data, "base64");
      const actual = jpegSize(bytes);
      if (
        actual &&
        (actual.width < session.size.pixelWidth - 2 ||
          actual.height < session.size.pixelHeight - 2)
      ) {
        session.fallback = true;
        cdp.send("Page.stopScreencast").catch(() => {});
        void screenshotLoop();
        return;
      }
      sendFrame(bytes, "screencast");
    });
    await startScreencast();
    page.on("framenavigated", (frame) => {
      if (frame !== page.mainFrame()) return;
      const url = frame.url();
      if (/^https?:/.test(url)) {
        session.lastUrl = url;
        send({ type: "navigating", url });
      }
    });
    page.on("load", async () => {
      if (session.closed) return;
      const url = page.url();
      if (!/^https?:/.test(url)) return;
      session.lastUrl = url;
      console.log(`[headless] loaded: ${url}`);
      let title = "";
      try {
        title = (await page.title()).slice(0, 200);
      } catch { /* detached during load */ }
      send({ type: "loaded", url, title, canBack: true });
    });
    page.on(
      "crash",
      () => fail("The remote browser page crashed. Reopen the tab to retry."),
    );
    context.on("page", (popup) => {
      if (popup === page || session.popupReported.has(popup)) return;
      const report = () => {
        const url = popup.url();
        if (!/^https?:/.test(url) || session.popupReported.has(popup)) return;
        session.popupReported.add(popup);
        send({ type: "popup", url });
      };
      popup.on("framenavigated", report);
      popup.on("load", report);
    });
    console.log(`[headless] session started; active=${sessions.size}`);
    session.ready = true;
    send({ type: "hello-ok", ...initialSize, maxAgeMs: MAX_AGE_MS });
    // Replay anything the client sent during setup (in hello order).
    void drain();
  })().catch((error) => {
    fail(`The remote browser could not start: ${error.message || error}`);
    end("browser launch failed");
  });

  const handlers = {
    async navigate(message) {
      const navigation = session.navigation;
      console.log(`[headless] navigate: ${message.url}`);
      const url = assertNavigatable(message.url, session.blocked, {
        allowPrivate: ALLOW_PRIVATE,
      });
      session.lastUrl = url.href;
      send({ type: "navigating", url: url.href });
      await session.page.goto(url.href, {
        waitUntil: "commit",
        timeout: NAV_TIMEOUT_MS,
      })
        .catch((error) => {
          console.log(
            `[headless] goto failed: ${error.message?.split("\n")[0]}`,
          );
          if (!session.closed && navigation === session.navigation) {
            fail(
              `Could not open that page: ${
                error.message?.split("\n")[0] || error
              }`,
            );
          }
        });
    },
    async back() {
      await session.page.goBack({
        waitUntil: "commit",
        timeout: NAV_TIMEOUT_MS,
      }).catch(() => {});
    },
    async forward() {
      await session.page.goForward({
        waitUntil: "commit",
        timeout: NAV_TIMEOUT_MS,
      }).catch(() => {});
    },
    async reload() {
      await session.page.reload({
        waitUntil: "commit",
        timeout: NAV_TIMEOUT_MS,
      }).catch(() => {});
    },
    async "clear-cache"() {
      await session.cdp.send("Network.clearBrowserCache").catch(() => {});
      send({ type: "cache-cleared" });
    },
    async resize(message) {
      session.resizing = true;
      try {
        const size = captureSize(message);
        await session.page.setViewportSize({
          width: size.width,
          height: size.height,
        });
        await session.cdp.send("Emulation.setDeviceMetricsOverride", {
          width: size.width,
          height: size.height,
          deviceScaleFactor: size.scale,
          mobile: false,
        });
        session.size = size;
        send({ type: "viewport", ...size });
        if (!session.fallback) {
          await session.cdp.send("Page.stopScreencast");
          await startScreencast();
        }
      } finally {
        session.resizing = false;
      }
    },
    async mouse(message) {
      const { action, x, y, button = "left", clickCount = 1 } = message;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (
        x < 0 || y < 0 || x > session.size.width || y > session.size.height ||
        !["left", "middle", "right"].includes(button) ||
        !Number.isInteger(clickCount) ||
        clickCount < 1 || clickCount > 3
      ) return;
      // Playwright's mouse has no coordinates on down/up: the pointer must be
      // moved to the target first, or clicks land at (0, 0).
      if (action === "move") await session.page.mouse.move(x, y);
      else if (action === "down") {
        await session.page.mouse.move(x, y);
        await session.page.mouse.down({ button, clickCount });
      } else if (action === "up") {
        await session.page.mouse.move(x, y);
        await session.page.mouse.up({ button, clickCount });
      }
    },
    async wheel(message) {
      const { x = 0, y = 0, deltaX = 0, deltaY = 0 } = message;
      if (
        ![x, y, deltaX, deltaY].every(Number.isFinite) || x < 0 || y < 0 ||
        x > session.size.width || y > session.size.height ||
        Math.abs(deltaX) > 10000 ||
        Math.abs(deltaY) > 10000
      ) return;
      await session.page.mouse.move(x, y).catch(() => {});
      await session.page.mouse.wheel(deltaX, deltaY);
    },
    async key(message) {
      if (
        !["down", "up"].includes(message.action) ||
        typeof message.key !== "string"
      ) return;
      const accelerator = process.platform === "darwin" ? "Meta" : "Control";
      const mapKey = (source) =>
        ["Meta", "Control"].includes(source) ? accelerator : source;
      const key = mapKey(message.key);
      if (!key || key.length > 24) return;
      if (["Control", "Alt", "Shift", "Meta"].includes(message.key)) {
        const effectiveHeld = () =>
          [...session.modifiers].some((source) => mapKey(source) === key);
        const before = effectiveHeld();
        if (message.action === "down") session.modifiers.add(message.key);
        else session.modifiers.delete(message.key);
        const after = effectiveHeld();
        if (before === after) return;
        if (after) {
          await session.page.keyboard.down(key);
          session.held.add(key);
        } else {
          await session.page.keyboard.up(key);
          session.held.delete(key);
        }
        return;
      }
      if (message.action === "down") {
        if (session.held.size >= 64 && !session.held.has(key)) return;
        await session.page.keyboard.down(key);
        session.held.add(key);
      } else if (message.action === "up") {
        session.held.delete(key);
        await session.page.keyboard.up(key).catch(() => {});
      }
    },
    async "release-input"() {
      for (const key of session.held) {
        await session.page.keyboard.up(key).catch(() => {});
      }
      for (const button of ["left", "middle", "right"]) {
        await session.page.mouse.up({ button }).catch(() => {});
      }
      session.held.clear();
      session.modifiers.clear();
      session.typed.clear();
    },
    async "insert-text"(message) {
      if (typeof message.text === "string" && message.text.length <= 65536) {
        await session.page.keyboard.insertText(message.text);
      }
    },
    async "copy-selection"(message) {
      if (!Number.isSafeInteger(message.id) || message.id < 1) return;
      const text = await session.page.evaluate(() => {
        const element = document.activeElement;
        if (element?.tagName === "INPUT" && element.type === "password") {
          return "";
        }
        if (
          typeof element?.selectionStart === "number" &&
          typeof element.value === "string"
        ) {
          return element.value.slice(
            element.selectionStart,
            element.selectionEnd,
          ).slice(0, 65536);
        }
        return String(window.getSelection() || "").slice(0, 65536);
      });
      send({ type: "selection", id: message.id, text });
    },
    async inspect() {
      const links = await session.page.evaluate(() => {
        const found = [];
        for (const anchor of document.querySelectorAll("a[href]")) {
          const rect = anchor.getBoundingClientRect();
          const text =
            (anchor.innerText || anchor.getAttribute("aria-label") || "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 80);
          if (!text || rect.width < 4 || rect.height < 4) continue;
          if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
          found.push({
            text,
            x: rect.x,
            y: rect.y,
            w: rect.width,
            h: rect.height,
          });
          if (found.length >= 60) break;
        }
        return found;
      }).catch(() => []);
      send({ type: "links", links });
    },
  };

  let draining = false;
  const navigationCommands = new Set(["navigate", "back", "forward", "reload"]);
  session.navigation = 0;
  async function drain() {
    if (draining || !session.ready) return;
    draining = true;
    try {
      while (session.queue.length && !session.closed) {
        const message = session.queue.shift();
        try {
          if (navigationCommands.has(message.type)) {
            // Navigation may not commit for 45 seconds. Start it in receive
            // order, but do not block input release or a replacement navigation.
            const navigation = ++session.navigation;
            void handlers[message.type](message).catch((error) => {
              if (!session.closed && navigation === session.navigation) {
                fail(error.message || String(error));
              }
            });
          } else await handlers[message.type](message);
        } catch (error) {
          fail(error.message || String(error));
        }
      }
    } finally {
      draining = false;
    }
  }

  ws.on("message", (data, isBinary) => {
    if (session.closed || isBinary) return;
    resetIdle();
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (
      !message || typeof message !== "object" ||
      typeof message.type !== "string" ||
      !Object.hasOwn(handlers, message.type)
    ) {
      if (message?.type === "ping") send({ type: "pong" });
      return;
    }
    // Messages that arrive while the browser context is still being allocated
    // (a resize can beat page creation) are queued, not dropped.
    const previous = session.queue.at(-1);
    if (
      previous?.type === message.type && (message.type === "resize" ||
        (message.type === "mouse" && message.action === "move" &&
          previous.action === "move"))
    ) session.queue.pop();
    if (session.queue.length >= MAX_QUEUE) return void end("input queue limit");
    session.queue.push(message);
    void drain();
  });
  ws.on("close", () => end("client disconnected"));
  ws.on("error", () => end("connection error"));
}

// Runtime pages this service hosts itself: the headless engine's "runtime
// origin" is this service, so the shell embeds these files directly. Files
// resolve in the repo layout (public/…) and in the flat container layout.
const RUNTIME_FILES = new Map([
  ["/runtime/index.html", ["runtime/index.html", "text/html; charset=utf-8"]],
  ["/runtime/adapter.js", [
    "runtime/adapter.js",
    "text/javascript; charset=utf-8",
  ]],
  [
    "/runtime/headless-client.js",
    ["runtime/headless-client.js", "text/javascript; charset=utf-8"],
  ],
  ["/runtime/websocket.js", [
    "runtime/websocket.js",
    "text/javascript; charset=utf-8",
  ]],
  ["/shared.js", ["shared.js", "text/javascript; charset=utf-8"]],
  ["/runtime/menus.js", ["menus.js", "text/javascript; charset=utf-8"]],
  ["/workspace.css", ["workspace.css", "text/css; charset=utf-8"]],
  ["/runtime/headless-helpers.mjs", [
    "../headless/helpers.mjs",
    "text/javascript; charset=utf-8",
  ]],
]);
async function readRuntimeFile(relative) {
  const candidates = [
    new URL(`../public/${relative}`, import.meta.url),
    new URL(`./${relative}`, import.meta.url),
  ];
  if (relative === "../headless/helpers.mjs") {
    candidates.push(new URL("./helpers.mjs", import.meta.url));
  }
  for (const candidate of candidates) {
    try {
      return { data: await readFile(candidate), path: candidate };
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return null;
}

const server = createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  if (url.pathname === "/health" && request.method === "GET") {
    response.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify({
      ok: true,
      service: "ojjy remote",
      sessions: sessions.size,
      max: MAX_SESSIONS,
    }));
    return;
  }
  if (url.pathname === "/runtime/config.js" && request.method === "GET") {
    response.writeHead(200, {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "no-store",
      "cross-origin-resource-policy": "cross-origin",
    });
    response.end(`self.PROXY_CONFIG=${
      JSON.stringify({
        engine: "headless",
        prefix: "/runtime/content/",
        wisp: "",
        parentOrigin: PARENT,
        remote: "",
      })
    };`);
    return;
  }
  const file = RUNTIME_FILES.get(url.pathname);
  if (file && request.method === "GET") {
    readRuntimeFile(file[0])
      .then((found) => {
        if (!found) {
          response.writeHead(404, { "content-type": "text/plain" });
          response.end("Not found");
          return;
        }
        response.writeHead(200, {
          "content-type": file[1],
          "cache-control": "no-store",
          "cross-origin-resource-policy": "cross-origin",
        });
        response.end(request.method === "HEAD" ? undefined : found.data);
      });
    return;
  }
  response.writeHead(404, { "content-type": "text/plain" });
  response.end("Not found");
});

const wss = new WebSocketServer({
  server,
  path: "/session/",
  maxPayload: 128 * 1024,
});
wss.on("connection", (ws, request) => {
  const origin = String(request.headers.origin || "");
  if (ORIGINS.length && !ORIGINS.includes(origin)) {
    console.warn(`[headless] rejected origin ${origin || "(none)"}`);
    ws.close(1008, "Origin not allowed");
    return;
  }
  ws.once("message", function onHello(data, isBinary) {
    if (isBinary) return ws.close(1003, "Unexpected binary frame");
    let hello;
    try {
      hello = JSON.parse(data.toString());
    } catch {
      return ws.close(1003, "Invalid hello");
    }
    if (!hello || hello.type !== "hello") {
      return ws.close(1003, "Invalid hello");
    }
    if (TOKEN && hello.token !== TOKEN) {
      return ws.close(1008, "Bad session token");
    }
    if (sessions.size >= MAX_SESSIONS) {
      ws.send(JSON.stringify({
        type: "error",
        message:
          `The headless browser is at capacity (${MAX_SESSIONS} sessions). Close a tab and try again.`,
      }));
      return ws.close(1013, "At capacity");
    }
    ws.removeListener("message", onHello);
    attachSession(ws, hello);
  });
});

let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    for (const session of [...sessions]) session.end?.("service stopping");
    browser?.close().catch(() => {}).finally(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}
process.on("unhandledRejection", (error) => {
  console.error("[headless] unhandled rejection:", error?.message || error);
});

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    // Another instance of this service (a stale dev stack) already owns the
    // port; bow out quietly instead of tearing down the whole dev stack.
    console.warn(
      "[headless] port busy; assuming an existing instance is serving",
    );
    process.exit(0);
  }
  throw error;
});

server.listen(PORT, process.env.HEADLESS_HOST || "127.0.0.1", () => {
  console.log(
    `[remote] listening on ws://127.0.0.1:${PORT}/session/ (origins: ${
      ORIGINS.join(", ") || "any"
    })`,
  );
});
