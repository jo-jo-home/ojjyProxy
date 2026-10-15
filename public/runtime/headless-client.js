// ojjyProxy headless engine client: renders a server-side headless browser as
// a live pixel stream and forwards real input, while speaking the shell's
// existing runtime protocol (ready / loading / navigating / loaded / popup) so
// tabs, titles, history, bookmarks and the error card work unchanged.
const FRAME = 1; // binary prefix for JPEG frames

export async function startHeadless({ website, message, params, config, send, fail, onUrl }) {
  website.hidden = true;
  const canvas = document.createElement("canvas");
  canvas.id = "screen";
  canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", "Remote browser view");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;border:0;background:#0a1628;outline:none;z-index:1";
  document.body.append(canvas);
  const context = canvas.getContext("2d");

  const note = (text) => {
    message.hidden = false;
    message.textContent = text;
  };
  note("connecting to the remote browser…");

  let ws = null;
  let attempts = 0;
  let lastUrl = params.get("remote-start") || "";
  let sessionReady = false;
  let stopped = false;
  let lastFrame = null;
  let pingTimer = null;
  // Resolves once the service has acknowledged the session; the adapter must
  // not report "ready" (and the shell must not navigate) before this point.
  let announceSession;
  const sessionLive = new Promise((resolve) => {
    announceSession = resolve;
  });

  const blocked = (params.get("blocked") || "").split(/\s+/).filter(Boolean);
  const capture = params.get("capture") === "true";
  const size = () => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  });

  function draw(buffer) {
    const blob = new Blob([buffer], { type: "image/jpeg" });
    createImageBitmap(blob).then((bitmap) => {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      context.drawImage(bitmap, 0, 0);
      lastFrame = bitmap;
      message.hidden = true;
    }).catch(() => { /* a torn or partial frame is replaced by the next one */ });
  }

  function sendJson(message) {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }

  function connect() {
    ws = new WebSocket(config.remote);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      const { width, height } = size();
      ws.send(JSON.stringify({ type: "hello", width, height, blocked }));
    };
    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "hello-ok":
            attempts = 0;
            resizeObserver.observe(document.documentElement);
            announceSession();
            if (!sessionReady) {
              sessionReady = true;
              note("");
              message.hidden = true;
            } else {
              note("");
              message.hidden = true;
              if (lastUrl) sendJson({ type: "navigate", url: lastUrl });
            }
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
            try {
              canvas.focus();
            } catch { /* focus is best-effort */ }
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
          case "pong":
            break;
        }
        return;
      }
      const view = new Uint8Array(event.data);
      if (view[0] === FRAME) draw(view.subarray(1));
    };
    ws.onclose = () => {
      clearInterval(pingTimer);
      if (stopped) return;
      if (!sessionReady || attempts >= 2) {
        if (!sessionReady) {
          fail(
            "Could not reach the headless browser service. It may be offline, at capacity, or blocked by this network.",
          );
        } else {
          fail("The headless browser session ended. Try again to start a new one.");
        }
        return;
      }
      attempts += 1;
      note(`reconnecting to the remote browser… (attempt ${attempts})`);
      setTimeout(connect, attempts === 1 ? 800 : 2000);
    };
    ws.onerror = () => { /* the close handler decides what happens next */ };
  }

  connect();

  // Input forwarding -------------------------------------------------------
  let buttonLabel = (event) =>
    event.button === 2 ? "right" : event.button === 1 ? "middle" : "left";
  let lastClick = { time: 0, x: 0, y: 0, count: 0 };
  function clickCount(event) {
    const now = Date.now();
    const close = now - lastClick.time < 400 &&
      Math.hypot(event.clientX - lastClick.x, event.clientY - lastClick.y) < 8;
    lastClick = close
      ? { time: now, x: event.clientX, y: event.clientY, count: lastClick.count + 1 }
      : { time: now, x: event.clientX, y: event.clientY, count: 1 };
    return lastClick.count;
  }
  const point = (event) => ({ x: event.clientX, y: event.clientY });
  canvas.addEventListener("pointerdown", (event) => {
    canvas.focus();
    const { x, y } = point(event);
    sendJson({ type: "mouse", action: "down", x, y, button: buttonLabel(event), clickCount: clickCount(event) });
    event.preventDefault();
  });
  canvas.addEventListener("pointermove", (event) => {
    const { x, y } = point(event);
    sendJson({ type: "mouse", action: "move", x, y });
  });
  canvas.addEventListener("pointerup", (event) => {
    const { x, y } = point(event);
    sendJson({ type: "mouse", action: "up", x, y, button: buttonLabel(event), clickCount: clickCount(event) });
    event.preventDefault();
  });
  canvas.addEventListener("wheel", (event) => {
    const { x, y } = point(event);
    sendJson({ type: "wheel", x, y, deltaX: event.deltaX, deltaY: event.deltaY });
    event.preventDefault();
  }, { passive: false });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("keydown", (event) => {
    sendJson({ type: "key", action: "down", key: event.key });
    // Browser-reserved combinations never reach this handler anyway; everything
    // else belongs to the remote page.
    event.preventDefault();
  });
  canvas.addEventListener("keyup", (event) => {
    sendJson({ type: "key", action: "up", key: event.key });
    event.preventDefault();
  });

  let resizeTimer = null;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const { width, height } = size();
      sendJson({ type: "resize", width, height });
      if (lastFrame) context.drawImage(lastFrame, 0, 0);
    }, 150);
  });

  const controller = {
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
    stop() { /* the remote page manages its own loads; nothing to abort */ },
  };

  // Diagnostics hook (also used by the end-to-end test).
  self.__headless = {
    links: () =>
      new Promise((resolve) => {
        const timeout = setTimeout(() => resolve([]), 5000);
        const listener = (event) => {
          const data = JSON.parse(event.data);
          if (data.type !== "links") return;
          clearTimeout(timeout);
          ws.removeEventListener("message", listener);
          resolve(data.links || []);
        };
        ws.addEventListener("message", listener);
        sendJson({ type: "inspect" });
      }),
  };

  await sessionLive;
  return controller;
}
