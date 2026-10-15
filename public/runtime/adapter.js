import { flattenHeaders, validateWisp } from "/shared.js";
import { installSocketBridge } from "./websocket.js";
const params = new URLSearchParams(location.search);
const token = params.get("token");
const parentOrigin = params.get("parent");
const config = self.PROXY_CONFIG;
const website = document.getElementById("website");
const message = document.getElementById("message");
let frame, controller, lastUrl = "", initialized = false;
let headlessSession = null;
function captureLinks() {
  if (params.get("capture") !== "true") return;
  try {
    const doc = website.contentDocument;
    if (!doc || doc.__ojjyLinkCapture) return;
    doc.__ojjyLinkCapture = true;
    doc.addEventListener("click", (event) => {
      const link = event.target.closest?.('a[target="_blank"]');
      if (!link) return;
      const url = new URL(link.href, lastUrl);
      if (!["http:", "https:"].includes(url.protocol)) return;
      if (url.origin === location.origin) return; // Do not mistake an encoded route for a real URL.
      event.preventDefault();
      send("popup", { url: url.href });
    }, true);
  } catch { /* Not all partially initialized documents are accessible. */ }
}
const send = (type, data = {}) => {
  if (parentOrigin && token) {
    parent.postMessage({ source: "ojjy-runtime", token, type, ...data }, parentOrigin);
  }
};
function fail(error) {
  message.hidden = false;
  message.textContent = `Browser could not start\n\n${error.message || error}`;
  send("error", { message: String(error.message || error) });
}
function script(src) {
  const load = (url) =>
    new Promise((resolve, reject) => {
      const element = document.createElement("script");
      element.src = url;
      element.onload = resolve;
      element.onerror = () => reject(new Error("load failed"));
      document.head.append(element);
    });
  // Filtering or flaky networks can cut a single download; retry before
  // declaring the asset unreachable.
  return (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await load(src);
        return;
      } catch (error) {
        if (attempt === 2) {
          throw new Error(
            `Could not load ${src} after ${attempt + 1} tries. This network may be ` +
              "filtering or cutting the download; try again, or choose another engine.",
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  })();
}
function timeout(promise, label, ms = 20000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
async function worker() {
  const expected = new URL("/runtime/sw.js", location.origin).href;
  await navigator.serviceWorker.register(expected, { scope: "/runtime/" });
  if (navigator.serviceWorker.controller?.scriptURL === expected) {
    return navigator.serviceWorker.controller;
  }
  await timeout(
    new Promise((resolve) => {
      const changed = () => {
        if (navigator.serviceWorker.controller?.scriptURL === expected) {
          navigator.serviceWorker.removeEventListener("controllerchange", changed);
          resolve();
        }
      };
      navigator.serviceWorker.addEventListener("controllerchange", changed);
      changed();
    }),
    "The matching service worker did not take control. Reload this tab.",
  );
  return navigator.serviceWorker.controller;
}
async function applyPolicy(domains) {
  let port, changed;
  try {
    await timeout(
      new Promise((resolve, reject) => {
        changed = () => {
          port?.close();
          const channel = new MessageChannel();
          port = channel.port1;
          port.onmessage = ({ data }) => {
            if (data?.source !== "ojjy-policy-applied") return;
            // A previous active worker may still have the old content prefix.
            // Wait for the updated controller instead of navigating into a
            // route that the old worker does not handle.
            if (data.ok && data.prefix !== config.prefix) return;
            if (data.ok) resolve();
            else reject(new Error(data.message || "The domain policy could not be saved."));
          };
          navigator.serviceWorker.controller?.postMessage({ source: "ojjy-policy", domains }, [
            channel.port2,
          ]);
        };
        // An existing deployment may still have the previous worker. Resend to
        // the replacement when it claims this page instead of accepting no ACK.
        navigator.serviceWorker.addEventListener("controllerchange", changed);
        changed();
      }),
      "The service worker did not confirm the domain policy. Reload this runtime.",
    );
  } finally {
    navigator.serviceWorker.removeEventListener("controllerchange", changed);
    port?.close();
  }
}
async function bareMux() {
  await script("/runtime/vendor/bridge/index.js");
  const connection = new BareMux.BareMuxConnection("/runtime/vendor/bridge/worker.js");
  const selected = params.get("transport") === "libcurl" ? "net-b" : "net-a";
  await connection.setTransport(`/runtime/vendor/${selected}/index.mjs`, [{ wisp: config.wisp }]);
}
function canonical() {
  try {
    if (frame?.url) return String(frame.url);
    const actual = website.contentWindow.location.href;
    if (config.engine === "sj-2.0.2-alpha" && actual.startsWith(location.origin + config.prefix)) {
      const physical = new URL(actual);
      const logical = new URL(decodeURIComponent(physical.pathname.slice(config.prefix.length)));
      if (physical.hash) logical.hash = physical.hash;
      return logical.href;
    }
    if (
      config.engine === "sj-2.0.67-alpha.2" && frame &&
      actual.startsWith(location.origin + frame.prefix)
    ) {
      return $scramjet.unrewriteUrl(actual, frame.context);
    }
    if (/^https?:/.test(actual) && !actual.startsWith(location.origin + "/")) return actual;
    const prefix = location.origin + (frame?.prefix || config.prefix);
    if (actual.startsWith(prefix)) {
      const encoded = actual.slice(prefix.length);
      return config.engine.startsWith("uv-")
        ? __uv$config.decodeUrl(encoded)
        : decodeURIComponent(encoded);
    }
  } catch { /* A not-yet-loaded document can be inaccessible. */ }
  return lastUrl;
}
function report(type = "navigation") {
  const url = canonical();
  if (!url || !/^https?:\/\//.test(url)) return;
  let title = new URL(url).hostname;
  try {
    title = website.contentDocument?.title || title;
  } catch { /* During navigation. */ }
  lastUrl = url;
  send(type, { url, title });
}
async function epoxySockets() {
  await script("/runtime/vendor/net-c/index.js");
  // The UMD bundle publishes the namespace object: the class lives at
  // EpoxyTransport.EpoxyTransport (with a .default alias on some builds).
  const SocketTransport = EpoxyTransport.EpoxyTransport ?? EpoxyTransport.default ?? EpoxyTransport;
  const client = new SocketTransport({ wisp: config.wisp });
  await timeout(client.init(), "Epoxy socket transport did not initialize.");
  return {
    connect(url, protocols, headers, ...callbacks) {
      // Modern Epoxy iterates header pairs.
      return client.connect(url, protocols, Object.entries(headers), ...callbacks);
    },
  };
}
async function libcurlSockets() {
  const loaded = new Promise((resolve) =>
    document.addEventListener("libcurl_load", resolve, { once: true })
  );
  await script("/runtime/vendor/net-b/index.js");
  await timeout(loaded, "Libcurl WebAssembly did not initialize.");
  const client = new CurlMod.default({ wisp: config.wisp });
  await timeout(client.init(), "Libcurl socket transport did not initialize.");
  return {
    connect(url, protocols, headers, ...callbacks) {
      // The legacy Libcurl transport takes a plain header object, not pairs.
      return client.connect(url, protocols, headers, ...callbacks);
    },
  };
}
async function initialize() {
  if (parentOrigin !== config.parentOrigin || !token) {
    throw new Error("Open this workspace from its configured website.");
  }
  if (config.engine === "headless") {
    // Remote browser isolation: no service worker, no rewritten bundles, no
    // relay. The service serves this very page and its config.
    const endpoint = config.remote ||
      (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/session/";
    const client = await import("./headless-client.js");
    headlessSession = await client.startHeadless({
      website,
      message,
      params,
      config: { ...config, remote: endpoint },
      send,
      fail,
      onUrl: (url) => {
        lastUrl = url;
      },
    });
    initialized = true;
    send("ready", { engine: config.engine, isolated: crossOriginIsolated });
    return;
  }
  if (!isSecureContext || !navigator.serviceWorker) {
    throw new Error("Service workers require HTTPS (or localhost).");
  }
  config.wisp = validateWisp(params.get("wisp") || config.wisp, location.protocol === "https:");
  if (config.engine === "sj-1.1.0" || config.engine === "sj-2.0.0-alpha") {
    await script("/runtime/vendor/app.js");
    const { ScramjetController } = $scramjetLoadController();
    controller = new ScramjetController({
      prefix: config.prefix,
      wisp: config.wisp,
      files: {
        wasm: "/runtime/vendor/app.wasm",
        all: "/runtime/vendor/app.js",
        sync: "/runtime/vendor/app.sync.js",
      },
    });
    await controller.init();
    if (config.engine === "sj-1.1.0") await bareMux();
    await worker();
    frame = controller.createFrame(website);
    if (config.engine === "sj-2.0.0-alpha") {
      // Destination WebSockets bypass this release's unfinished embedded socket hook.
      // Pages still use the built-in Epoxy transport; sockets prefer Libcurl because
      // modern Epoxy's wasm send queue only drains on incoming relay traffic and stalls
      // on an idle connection. Epoxy remains the automatic fallback.
      let transport = null;
      const failures = [];
      for (const name of ["libcurl", "epoxy"]) {
        try {
          transport = name === "libcurl" ? await libcurlSockets() : await epoxySockets();
          send("transport-selected", { transport: name });
          break;
        } catch (error) {
          failures.push(`${name}: ${error.message || error}`);
        }
      }
      if (!transport) {
        throw new Error(`No socket transport could initialize (${failures.join("; ")}).`);
      }
      self.__ojjyInstallSocketBridge = (window, client) =>
        installSocketBridge(window, client, transport);
      frame.addEventListener(
        "contextInit",
        (event) => installSocketBridge(event.window, event.client, transport),
      );
    }
  } else if (config.engine === "sj-2.0.67-alpha.2") {
    await script("/runtime/vendor/main.js");
    await script("/runtime/vendor/controller.api.js");
    const api = $scramjetController;
    Object.assign(api.config, {
      prefix: config.prefix,
      scramjetPath: "/runtime/vendor/main.js",
      wasmPath: "/runtime/vendor/main.wasm",
      virtualWasmPath: "core.wasm.js",
      injectPath: "/runtime/vendor/controller.inject.js",
    });
    const serviceworker = await worker();
    const useLibcurl = params.get("transport") === "libcurl";
    // The UMD Libcurl bundle announces its embedded WASM asynchronously.
    // Its old init() constructs a session before waiting, so await this event first.
    const wasmReady = useLibcurl
      ? new Promise((resolve) => document.addEventListener("libcurl_load", resolve, { once: true }))
      : null;
    await script(`/runtime/vendor/${useLibcurl ? "net-b" : "net-a"}/index.js`);
    if (wasmReady) await timeout(wasmReady, "Libcurl WebAssembly did not initialize.");
    const Client = useLibcurl ? CurlMod.default : EpxMod.default;
    const client = new Client({ wisp: config.wisp });
    await timeout(client.init(), "Could not initialize the transport.");
    const transport = {
      get ready() {
        return client.ready;
      },
      init: () => client.init(),
      connect: (url, protocols, headers, ...callbacks) =>
        client.connect(url, protocols, Object.fromEntries(headers), ...callbacks),
      request: async (remote, method, body, headers, signal) => {
        // Proxy2's older transports take a header object; controller 0.0.14
        // uses raw pairs in both directions. Normalize input as well as output.
        const result = await client.request(
          remote,
          method,
          body,
          Object.fromEntries(headers),
          signal,
        );
        return { ...result, headers: flattenHeaders(result.headers) };
      },
    };
    controller = new api.Controller({ serviceworker, transport });
    await timeout(controller.wait(), "Controller handshake timed out.");
    frame = controller.createFrame(website);
  } else if (config.engine === "sj-2.0.2-alpha") {
    await bareMux();
    await worker();
  } else if (config.engine === "uv-3.2.10") {
    await script("/runtime/vendor/bundle.js");
    await script("/runtime/vendor/config.js");
    await bareMux();
    await worker();
  } else throw new Error("Unknown engine version.");
  if (frame?.addEventListener) frame.addEventListener("urlchange", () => report());
  await applyPolicy((params.get("blocked") || "").split(/\s+/).filter(Boolean));
  initialized = true;
  send("ready", { engine: config.engine, isolated: crossOriginIsolated });
}
window.addEventListener("message", async (event) => {
  if (
    event.source !== parent || event.origin !== parentOrigin || event.data?.token !== token ||
    event.data?.source !== "ojjy-shell"
  ) return;
  if (!initialized) return;
  try {
    const { action, url } = event.data;
    if (headlessSession) {
      if (action === "navigate") {
        const target = new URL(url);
        if (!["http:", "https:"].includes(target.protocol)) {
          throw new Error("Invalid website protocol.");
        }
        lastUrl = target.href;
        message.hidden = true;
        send("loading", { url: lastUrl });
        headlessSession.navigate(lastUrl);
      } else if (action === "back" || action === "forward") {
        headlessSession[action]();
      } else if (action === "reload") {
        headlessSession.reload();
      } else if (action === "clear-cache") {
        headlessSession.clearCache();
      }
      return;
    }
    if (action === "navigate") {
      const target = new URL(url);
      if (!["http:", "https:"].includes(target.protocol)) {
        throw new Error("Invalid website protocol.");
      }
      lastUrl = target.href;
      message.hidden = true;
      send("loading", { url: lastUrl });
      if (frame) frame.go(lastUrl);
      else {website.src = config.prefix + (config.engine.startsWith("uv-")
          ? __uv$config.encodeUrl(lastUrl)
          : encodeURIComponent(lastUrl));}
    } else if (action === "back" || action === "forward") {
      if (frame) frame[action]();
      else website.contentWindow.history[action]();
    } else if (action === "reload") {
      if (frame) frame.reload();
      else website.contentWindow.location.reload();
    } else if (action === "stop") website.contentWindow.stop();
    else if (action === "clear-cache") {
      for (const key of await caches.keys()) await caches.delete(key);
      send("cache-cleared");
    }
  } catch (error) {
    fail(error);
  }
});
website.addEventListener("load", () => {
  if (initialized && lastUrl) {
    captureLinks();
    report("loaded");
  }
});
setInterval(() => {
  // Remote sessions report their own URLs from the remote browser.
  if (initialized && lastUrl && !headlessSession) report();
}, 750);
initialize().catch(fail);
