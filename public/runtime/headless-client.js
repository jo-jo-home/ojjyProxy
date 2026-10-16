// Remote pixels and local controls; no destination content runs in this document.
import { createMenuHost } from "./menus.js";
import { ENGINES } from "/shared.js";
import {
  bounded,
  frameDecoder,
  MAX_BUFFER,
  viewportPoint,
} from "./headless-helpers.mjs";

export async function startHeadless(
  { website, message, params, config, send, fail, onUrl },
) {
  document.body.dataset.motion =
    ["full", "subtle", "off"].includes(params.get("motion"))
      ? params.get("motion")
      : "full";
  website.hidden = true;
  const surface = document.createElement("div");
  surface.style.cssText =
    "position:fixed;inset:0;overflow:auto;background:#0a1628;z-index:1;overscroll-behavior:contain";
  const extent = document.createElement("div");
  extent.style.cssText = "position:relative;min-width:100%;min-height:100%";
  const canvas = document.createElement("canvas");
  canvas.id = "screen";
  canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", "Remote browser view");
  canvas.style.cssText =
    "display:block;position:absolute;left:0;top:0;transform-origin:0 0;border:0;outline:none;touch-action:none";
  extent.append(canvas);
  surface.append(extent);
  document.body.append(surface);
  const context = canvas.getContext("2d");
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/workspace.css";
  document.head.append(stylesheet);
  // Runtime documents do not inherit the shell's theme variables across origins.
  for (
    const [name, value] of Object.entries({
      "--bg": "#0a1628",
      "--bg2": "#102033",
      "--bg3": "#20364d",
      "--text": "#eef4fa",
      "--text2": "#d7e3ef",
      "--muted": "#9aafc4",
      "--accent": "#81bcff",
      "--border": "#385069",
      "--glass-a": "98%",
      "--blur": "8px",
      "--radius": "12px",
      "--radius-sm": "8px",
    })
  ) document.body.style.setProperty(name, value);
  const input = document.createElement("textarea");
  input.setAttribute(
    "aria-label",
    "Remote keyboard input (paste and composition supported)",
  );
  input.style.cssText =
    "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.01;z-index:2;resize:none";
  input.autocapitalize = "off";
  input.autocomplete = "off";
  input.spellcheck = false;
  surface.append(input);
  const status = document.createElement("div");
  status.setAttribute("role", "status");
  status.style.cssText =
    "position:fixed;bottom:12px;left:12px;z-index:400;background:#102033;color:white;padding:8px 12px;border-radius:8px;pointer-events:none";
  status.hidden = true;
  surface.append(status);
  let statusTimer;
  function notice(text) {
    clearTimeout(statusTimer);
    status.textContent = text;
    status.hidden = false;
    statusTimer = setTimeout(() => {
      status.hidden = true;
    }, 5000);
  }
  const note = (text) => {
    message.hidden = false;
    message.textContent = text;
  };
  const menus = createMenuHost({
    onError: () =>
      notice(
        "That action could not finish. Try again or reconnect the session.",
      ),
  });
  let ws = null;
  let attempts = 0;
  let lastUrl = params.get("remote-start") || "";
  let sessionReady = false;
  let stopped = false;
  let pingTimer;
  let viewport = { width: 1280, height: 720 };
  let zoom = 1;
  let announceSession;
  const sessionLive = new Promise((resolve) => {
    announceSession = resolve;
  });
  const blocked = (params.get("blocked") || "").split(/\s+/).filter(Boolean)
    .slice(0, 256);
  const capture = params.get("capture") === "true";
  const size = () => ({
    width: surface.clientWidth,
    height: surface.clientHeight,
    dpr: bounded(window.devicePixelRatio, 1, 1, 2),
  });
  function layout() {
    const { width, height } = size();
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.transform = `scale(${zoom})`;
    extent.style.width = `${width * zoom}px`;
    extent.style.height = `${height * zoom}px`;
  }
  function setZoom(value) {
    zoom = bounded(value, 1, 0.5, 3);
    layout();
    notice(`Remote view ${Math.round(zoom * 100)}%. Use scrollbars to pan.`);
  }
  const frames = frameDecoder(
    (buffer) => createImageBitmap(new Blob([buffer], { type: "image/jpeg" })),
    (bitmap) => {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      context.drawImage(bitmap, 0, 0);
      message.hidden = true;
    },
  );
  function sendJson(data) {
    if (ws?.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > MAX_BUFFER) {
      ws.close(1000, "input backpressure");
      return;
    }
    const payload = JSON.stringify(data);
    if (new TextEncoder().encode(payload).length > 128 * 1024) {
      notice("Input is too large to send.");
      return;
    }
    ws.send(payload);
  }
  const held = new Map();
  const pointerCounts = new Map();
  const pendingTouches = new Map();
  function releaseInput() {
    held.clear();
    pointerCounts.clear();
    pendingTouches.clear();
    sendJson({ type: "release-input" });
  }
  const copies = new Map();
  let copyId = 0;
  function selection() {
    if (copies.size >= 4 || ws?.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Session unavailable"));
    }
    return new Promise((resolve, reject) => {
      const id = ++copyId;
      const timer = setTimeout(() => {
        copies.delete(id);
        reject(new Error("Selection request timed out"));
      }, 5000);
      copies.set(id, { resolve, reject, timer });
      sendJson({ type: "copy-selection", id });
    });
  }
  async function copy(text) {
    try {
      const value = await text;
      if (!value) throw new Error("Nothing to copy");
      await navigator.clipboard.writeText(value);
      notice("Copied.");
    } catch {
      notice(
        "Could not copy. Clipboard access may be blocked, or no text is selected.",
      );
    }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await surface.requestFullscreen();
    } catch {
      notice("Fullscreen is unavailable or was denied by the browser.");
    }
  }
  function placeFullscreenMenu() {
    const host = document.querySelector(".context-menu2.menu-open");
    if (
      !host || !document.fullscreenElement || host.parentElement === surface
    ) return;
    const focused = host.contains(document.activeElement)
      ? document.activeElement
      : host;
    if (host.hidePopover && host.matches(":popover-open")) host.hidePopover();
    surface.append(host);
    host.showPopover?.();
    focused.focus({ preventScroll: true });
  }
  function openMenu(event, keyboard = false) {
    event.preventDefault();
    releaseInput();
    menus.open(
      [
        { label: "Back", action: () => sendJson({ type: "back" }) },
        { label: "Forward", action: () => sendJson({ type: "forward" }) },
        { label: "Reload", action: () => sendJson({ type: "reload" }) },
        { separator: true },
        {
          label: "Copy address",
          disabled: !lastUrl,
          action: () => void copy(lastUrl),
        },
        { label: "Copy selected text", action: () => void copy(selection()) },
        {
          label: "Open with another engine",
          disabled: !lastUrl,
          submenu: ENGINES.filter((engine) =>
            engine.id !== "headless" &&
            (params.get("engines") || "").split(",").includes(engine.id)
          ).map((engine) => ({
            id: engine.id,
            label: engine.label,
            action: () =>
              send("open-engine", { engine: engine.id, url: lastUrl }),
          })),
        },
        { separator: true },
        {
          label: "Zoom in",
          disabled: zoom >= 3,
          action: () => setZoom(zoom * 1.2),
        },
        {
          label: "Zoom out",
          disabled: zoom <= 0.5,
          action: () => setZoom(zoom / 1.2),
        },
        { label: "Reset zoom", action: () => setZoom(1) },
        {
          label: document.fullscreenElement ? "Exit fullscreen" : "Fullscreen",
          action: () => void fullscreen(),
        },
      ],
      keyboard
        ? { anchor: canvas, focusFirst: true }
        : { at: { x: event.clientX, y: event.clientY } },
    );
    // Keep both shared-host implementations usable inside the fullscreen subtree.
    placeFullscreenMenu();
  }
  canvas.addEventListener("contextmenu", (event) => openMenu(event));
  menus.bindLongPress(canvas, (event) => openMenu(event));
  const point = (event) =>
    viewportPoint(
      event.clientX,
      event.clientY,
      canvas.getBoundingClientRect(),
      viewport,
    );
  const buttonLabel = (event) =>
    event.button === 2 ? "right" : event.button === 1 ? "middle" : "left";
  let lastClick = { time: 0, x: 0, y: 0, count: 0 };
  canvas.addEventListener("pointerdown", (event) => {
    input.focus({ preventScroll: true });
    if (event.button === 2) {
      event.preventDefault();
      return;
    }
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* Synthetic accessibility input may not have an active pointer. */
    }
    const now = Date.now();
    const close = now - lastClick.time < 400 &&
      Math.hypot(event.clientX - lastClick.x, event.clientY - lastClick.y) < 8;
    const count = close ? Math.min(3, lastClick.count + 1) : 1;
    lastClick = { time: now, x: event.clientX, y: event.clientY, count };
    pointerCounts.set(event.pointerId, count);
    const down = {
      type: "mouse",
      action: "down",
      ...point(event),
      button: buttonLabel(event),
      clickCount: count,
    };
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      pendingTouches.set(event.pointerId, {
        down,
        x: event.clientX,
        y: event.clientY,
      });
    } else sendJson(down);
    event.preventDefault();
  });
  canvas.addEventListener(
    "pointermove",
    (event) => {
      const pending = pendingTouches.get(event.pointerId);
      if (pending) {
        if (
          Math.hypot(event.clientX - pending.x, event.clientY - pending.y) <= 10
        ) return;
        pendingTouches.delete(event.pointerId);
        sendJson(pending.down);
      }
      sendJson({ type: "mouse", action: "move", ...point(event) });
    },
  );
  canvas.addEventListener("pointerup", (event) => {
    if (!pointerCounts.has(event.pointerId)) return;
    const pending = pendingTouches.get(event.pointerId);
    if (pending) {
      pendingTouches.delete(event.pointerId);
      sendJson(pending.down);
    }
    sendJson({
      type: "mouse",
      action: "up",
      ...point(event),
      button: buttonLabel(event),
      clickCount: pointerCounts.get(event.pointerId),
    });
    pointerCounts.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    event.preventDefault();
  });
  canvas.addEventListener("pointercancel", releaseInput);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      setZoom(zoom * (event.deltaY < 0 ? 1.2 : 1 / 1.2));
      return;
    }
    const unit = event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
      ? surface.clientHeight
      : 1;
    sendJson({
      type: "wheel",
      ...point(event),
      deltaX: bounded(event.deltaX * unit / zoom, 0, -10000, 10000),
      deltaY: bounded(event.deltaY * unit / zoom, 0, -10000, 10000),
    });
  }, { passive: false });
  let composing = false;
  let compositionCommit = null;
  for (const target of [canvas, input]) {
    target.addEventListener("keydown", (event) => {
      if (
        params.get("panic") && event.key === params.get("panic") &&
        !event.ctrlKey &&
        !event.metaKey && !event.altKey
      ) {
        event.preventDefault();
        releaseInput();
        send("panic", { key: event.key });
        return;
      }
      if (
        event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")
      ) {
        return openMenu(event, true);
      }
      if (
        event.isComposing || composing || event.key === "Process" ||
        event.key === "Dead"
      ) return;
      // Host-browser shortcuts can still emit a keydown; never claim to replay them remotely.
      if (
        (event.ctrlKey || event.metaKey) &&
        ["t", "w", "n", "l", "r", "q", "v"].includes(event.key.toLowerCase())
      ) return;
      if (
        event.key === "F11" ||
        (event.key === "Escape" && document.fullscreenElement)
      ) return;
      // Physical keys must reach destination key handlers (Space activates
      // buttons, printable keys drive shortcuts). Prevent local text insertion
      // so the textarea input path cannot insert the same character twice.
      // IME/dead keys above and virtual-keyboard input still use insertText.
      if (event.key === "Unidentified") return;
      const code = event.code || event.key;
      const duplicatePhysicalKey = !held.has(code) &&
        [...held.values()].includes(event.key);
      held.set(code, event.key);
      if (duplicatePhysicalKey) {
        event.preventDefault();
        return;
      }
      sendJson({ type: "key", action: "down", key: event.key });
      event.preventDefault();
    });
    target.addEventListener("keyup", (event) => {
      const code = event.code || event.key;
      const key = held.get(code);
      if (!key) return;
      held.delete(code);
      if (![...held.values()].includes(key)) {
        sendJson({ type: "key", action: "up", key });
      }
      event.preventDefault();
    });
    target.addEventListener("blur", releaseInput);
    target.addEventListener("paste", (event) => {
      event.preventDefault();
      insertText(event.clipboardData?.getData("text/plain") || "");
      input.value = "";
    });
  }
  function insertText(text) {
    if (text && text.length <= 65536) sendJson({ type: "insert-text", text });
    else if (text) notice("Paste is too large (maximum 65,536 characters).");
  }
  input.addEventListener("compositionstart", () => {
    composing = true;
  });
  input.addEventListener("compositionend", (event) => {
    composing = false;
    insertText(event.data);
    compositionCommit = event.data;
    setTimeout(() => {
      compositionCommit = null;
    }, 0);
    input.value = "";
  });
  input.addEventListener("input", (event) => {
    if (composing || event.isComposing) return;
    if (
      !(compositionCommit !== null && event.data === compositionCommit) &&
      event.inputType !== "insertCompositionText" &&
      event.inputType !== "insertFromComposition"
    ) insertText(input.value);
    input.value = "";
  });
  canvas.addEventListener("focus", () => input.focus({ preventScroll: true }));
  window.addEventListener("blur", releaseInput);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseInput();
  });
  window.addEventListener("pagehide", () => {
    stopped = true;
    releaseInput();
    frames.reset();
    ws?.close();
  });
  let resizeTimer;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      layout();
      sendJson({ type: "resize", ...size() });
    }, 150);
  });
  document.addEventListener("fullscreenchange", () => {
    menus.close(true);
    layout();
    sendJson({ type: "resize", ...size() });
  });
  function connect() {
    ws = new WebSocket(config.remote);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => sendJson({ type: "hello", ...size(), blocked });
    ws.onmessage = (event) => {
      if (typeof event.data !== "string") {
        const view = new Uint8Array(event.data);
        if (view[0] === 1 && view.length <= MAX_BUFFER) {
          frames.push(view.subarray(1));
        }
        return;
      }
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!data || typeof data !== "object") return;
      switch (data.type) {
        case "viewport":
          frames.reset();
          viewport = { width: data.width, height: data.height };
          break;
        case "capture":
          self.__remote.capture = data;
          break;
        case "selection": {
          const request = copies.get(data.id);
          if (request) {
            clearTimeout(request.timer);
            copies.delete(data.id);
            request.resolve(typeof data.text === "string" ? data.text : "");
          }
          break;
        }
        case "hello-ok":
          viewport = { width: data.width, height: data.height };
          self.__remote.session = data;
          attempts = 0;
          resizeObserver.observe(surface);
          announceSession();
          message.hidden = true;
          if (sessionReady && lastUrl) {
            sendJson({ type: "navigate", url: lastUrl });
          }
          sessionReady = true;
          pingTimer = setInterval(() => sendJson({ type: "ping" }), 20000);
          break;
        case "navigating":
          lastUrl = data.url;
          onUrl?.(data.url);
          send("navigation", { url: data.url, title: "" });
          break;
        case "loaded":
          lastUrl = data.url;
          onUrl?.(data.url);
          send("loaded", { url: data.url, title: data.title || "" });
          input.focus({ preventScroll: true });
          break;
        case "popup":
          if (capture) send("popup", { url: data.url });
          break;
        case "cache-cleared":
          send("cache-cleared");
          break;
        case "error":
          fail(data.message || "The remote browser reported an error.");
          break;
      }
    };
    ws.onclose = () => {
      clearInterval(pingTimer);
      frames.reset();
      releaseInput();
      for (const request of copies.values()) {
        clearTimeout(request.timer);
        request.reject(new Error("Session disconnected"));
      }
      copies.clear();
      if (stopped) return;
      if (!sessionReady || attempts >= 2) {
        fail(
          sessionReady
            ? "The remote session ended. Try again to start a new one."
            : "Could not reach the remote session service. It may be offline, at capacity, or blocked by this network.",
        );
        return;
      }
      attempts++;
      note(`reconnecting to the remote browser… (attempt ${attempts})`);
      setTimeout(connect, attempts === 1 ? 800 : 2000);
    };
    ws.onerror = () => {/* close decides whether to retry */};
  }
  self.__remote = {
    links: () =>
      new Promise((resolve) => {
        const socket = ws;
        const finish = (links) => {
          clearTimeout(timeout);
          socket.removeEventListener("message", listener);
          resolve(links);
        };
        const timeout = setTimeout(() => finish([]), 5000);
        const listener = (event) => {
          if (typeof event.data !== "string") return;
          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            return;
          }
          if (data?.type === "links") finish(data.links || []);
        };
        socket.addEventListener("message", listener);
        sendJson({ type: "inspect" });
      }),
  };
  layout();
  note("connecting to the remote browser…");
  connect();
  await sessionLive;
  return {
    navigate(url) {
      lastUrl = url;
      note(`opening ${new URL(url).hostname} on the remote browser…`);
      sendJson({ type: "navigate", url });
    },
    back() {
      sendJson({ type: "back" });
    },
    forward() {
      sendJson({ type: "forward" });
    },
    reload() {
      sendJson({ type: "reload" });
    },
    clearCache() {
      sendJson({ type: "clear-cache" });
    },
    stop() {/* remote page manages its own loads */},
  };
}
