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

const PORT = Number(process.env.HEADLESS_PORT || 9100);
const ORIGINS = (process.env.HEADLESS_ORIGINS || process.env.HEADLESS_SELF || "")
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
const QUALITY = Number(process.env.HEADLESS_QUALITY || 60);
const NAV_TIMEOUT_MS = 45000;
const FRAME_CAP = 1600;
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
    browser = await chromium.launch({ headless: true, channel: "chromium-headless-shell", args });
  } catch {
    browser = await chromium.launch({ headless: true, args });
  }
  browser.on("disconnected", () => {
    browser = null;
  });
  return browser;
}

function attachSession(ws, hello) {
  const width = Math.max(320, Math.min(2000, Math.round(hello.width || 1280)));
  const height = Math.max(240, Math.min(1600, Math.round(hello.height || 720)));
  const blocked = Array.isArray(hello.blocked)
    ? hello.blocked.filter((item) => typeof item === "string" && item.length < 200)
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
    startedAt: Date.now(),
    popupReported: new WeakSet(),
  };
  sessions.add(session);
  const send = (message) => {
    if (!session.closed && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };
  const fail = (message) => send({ type: "error", message });

  const end = async (reason) => {
    if (session.closed) return;
    session.closed = true;
    clearTimeout(session.idleTimer);
    clearInterval(session.ageTimer);
    sessions.delete(session);
    try {
      session.cdp?.detach?.().catch(() => {});
    } catch { /* already detached */ }
    try {
      await session.context?.close();
    } catch { /* already closed */ }
    console.log(`[headless] session ended (${reason}); active=${sessions.size}`);
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
  const startScreencast = (w, h) =>
    session.cdp?.send("Page.startScreencast", {
      format: "jpeg",
      quality: QUALITY,
      maxWidth: Math.min(FRAME_CAP, Math.max(320, w)),
      maxHeight: Math.min(FRAME_CAP, Math.max(240, h)),
      everyNthFrame: 1,
    }).catch(() => {});

  (async () => {
    const context = await (await getBrowser()).newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    session.context = context;
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
    await startScreencast(width, height);
    cdp.on("Page.screencastFrame", (event) => {
      if (session.closed || ws.readyState !== WebSocket.OPEN) return;
      ws.send(Buffer.concat([Buffer.from([1]), Buffer.from(event.data, "base64")]));
      cdp.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
    });
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
    page.on("crash", () => fail("The remote browser page crashed. Reopen the tab to retry."));
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
    send({ type: "hello-ok", width, height, maxAgeMs: MAX_AGE_MS });
    // Replay anything the client sent during setup (in hello order).
    for (const message of session.queue.splice(0)) dispatch(message);
  })().catch((error) => {
    fail(`The remote browser could not start: ${error.message || error}`);
    end("browser launch failed");
  });

  const handlers = {
    async navigate(message) {
      console.log(`[headless] navigate: ${message.url}`);
      const url = assertNavigatable(message.url, session.blocked, { allowPrivate: ALLOW_PRIVATE });
      session.lastUrl = url.href;
      send({ type: "navigating", url: url.href });
      await session.page.goto(url.href, { waitUntil: "commit", timeout: NAV_TIMEOUT_MS })
        .catch((error) => {
          console.log(`[headless] goto failed: ${error.message?.split("\n")[0]}`);
          fail(`Could not open that page: ${error.message?.split("\n")[0] || error}`);
        });
    },
    async back() {
      await session.page.goBack({ timeout: NAV_TIMEOUT_MS }).catch(() => {});
    },
    async forward() {
      await session.page.goForward({ timeout: NAV_TIMEOUT_MS }).catch(() => {});
    },
    async reload() {
      await session.page.reload({ waitUntil: "commit", timeout: NAV_TIMEOUT_MS }).catch(() => {});
    },
    async "clear-cache"() {
      await session.context.clearCookies().catch(() => {});
      await session.cdp.send("Network.clearBrowserCache").catch(() => {});
      send({ type: "cache-cleared" });
    },
    async resize(message) {
      const w = Math.max(320, Math.min(2000, Math.round(message.width || 1280)));
      const h = Math.max(240, Math.min(1600, Math.round(message.height || 720)));
      await session.page.setViewportSize({ width: w, height: h }).catch(() => {});
      await startScreencast(w, h).catch(() => {});
    },
    async mouse(message) {
      const { action, x, y, button = "left", clickCount = 1 } = message;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
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
      await session.page.mouse.move(x, y).catch(() => {});
      await session.page.mouse.wheel(deltaX, deltaY);
    },
    async key(message) {
      const key = String(message.key || "").slice(0, 24);
      if (!key) return;
      if (["Control", "Alt", "Shift", "Meta"].includes(key)) {
        if (message.action === "down") session.modifiers.add(key);
        else session.modifiers.delete(key);
      }
      if (message.action === "down") {
        if (
          key.length === 1 && !session.modifiers.has("Control") && !session.modifiers.has("Meta")
        ) {
          session.typed.add(key);
          await session.page.keyboard.press(key);
        } else {
          session.typed.delete(key);
          await session.page.keyboard.down(key);
        }
      } else if (message.action === "up") {
        if (session.typed.delete(key)) return; // press() already released it
        await session.page.keyboard.up(key).catch(() => {});
      }
    },
    async inspect() {
      const links = await session.page.evaluate(() => {
        const found = [];
        for (const anchor of document.querySelectorAll("a[href]")) {
          const rect = anchor.getBoundingClientRect();
          const text = (anchor.innerText || anchor.getAttribute("aria-label") || "")
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 80);
          if (!text || rect.width < 4 || rect.height < 4) continue;
          if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
          found.push({ text, x: rect.x, y: rect.y, w: rect.width, h: rect.height });
          if (found.length >= 60) break;
        }
        return found;
      }).catch(() => []);
      send({ type: "links", links });
    },
  };

  const dispatch = (message) => {
    const handler = handlers[message?.type];
    if (handler) handler(message).catch((error) => fail(error.message || String(error)));
  };

  ws.on("message", (data, isBinary) => {
    if (session.closed || isBinary) return;
    resetIdle();
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (message?.type === "ping") return send({ type: "pong" });
    // Messages that arrive while the browser context is still being allocated
    // (a resize can beat page creation) are queued, not dropped.
    if (!session.ready) {
      if (message?.type) session.queue.push(message);
      return;
    }
    dispatch(message);
  });
  ws.on("close", () => end("client disconnected"));
  ws.on("error", () => end("connection error"));
}

// Runtime pages this service hosts itself: the headless engine's "runtime
// origin" is this service, so the shell embeds these files directly. Files
// resolve in the repo layout (public/…) and in the flat container layout.
const RUNTIME_FILES = new Map([
  ["/runtime/index.html", ["runtime/index.html", "text/html; charset=utf-8"]],
  ["/runtime/adapter.js", ["runtime/adapter.js", "text/javascript; charset=utf-8"]],
  [
    "/runtime/headless-client.js",
    ["runtime/headless-client.js", "text/javascript; charset=utf-8"],
  ],
  ["/runtime/websocket.js", ["runtime/websocket.js", "text/javascript; charset=utf-8"]],
  ["/shared.js", ["shared.js", "text/javascript; charset=utf-8"]],
]);
async function readRuntimeFile(relative) {
  const candidates = [
    new URL(`../public/${relative}`, import.meta.url),
    new URL(`./${relative}`, import.meta.url),
  ];
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
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
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

const wss = new WebSocketServer({ server, path: "/session/" });
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
    console.warn("[headless] port busy; assuming an existing instance is serving");
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
