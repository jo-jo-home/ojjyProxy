importScripts("/runtime/config.js");
const config = self.PROXY_CONFIG;
let engine;
if (config.engine === "sj-1.1.0" || config.engine === "sj-2.0.0-alpha") {
  importScripts("/runtime/vendor/app.js");
  const { ScramjetServiceWorker } = $scramjetLoadWorker();
  engine = new ScramjetServiceWorker();
} else if (config.engine === "sj-2.0.67-alpha.2") {
  importScripts("/runtime/vendor/controller.sw.js");
} else if (config.engine === "sj-2.0.2-alpha") {
  importScripts(
    "/runtime/vendor/bridge/index.js",
    "/runtime/vendor/bundled.js",
    "/runtime/alpha2-shared.js",
    "/runtime/alpha2-worker.js",
  );
} else if (config.engine === "uv-3.2.10") {
  importScripts(
    "/runtime/vendor/bundle.js",
    "/runtime/vendor/config.js",
    "/runtime/vendor/app.sw.js",
  );
  engine = new UVServiceWorker();
}
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
let domains = [];
let policyDb;
const policyReady = new Promise((resolve, reject) => {
  const request = indexedDB.open("ojjy-runtime-policy", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("policy");
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    policyDb = request.result;
    const read = policyDb.transaction("policy").objectStore("policy").get("domains");
    read.onsuccess = () => {
      domains = read.result || [];
      resolve();
    };
    read.onerror = () => reject(read.error);
  };
});
self.addEventListener("message", (event) => {
  if (event.data?.source !== "ojjy-policy" || !Array.isArray(event.data.domains)) return;
  event.waitUntil(
    policyReady.then(() => {
      domains = event.data.domains.filter((host) =>
        typeof host === "string" && /^[a-z\d.-]+$/i.test(host)
      ).map((host) => host.toLowerCase());
      const tx = policyDb.transaction("policy", "readwrite");
      tx.objectStore("policy").put(domains, "domains");
      return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = tx.onabort = () =>
          reject(tx.error || new Error("Domain policy transaction aborted."));
      });
    }).then(() => {
      event.ports?.[0]?.postMessage({ source: "ojjy-policy-applied", ok: true });
    }).catch((error) => {
      event.ports?.[0]?.postMessage({
        source: "ojjy-policy-applied",
        ok: false,
        message: String(error.message || error),
      });
    }),
  );
});
function blocked(request) {
  if (!domains.length) return false;
  const url = new URL(request.url);
  if (!url.pathname.startsWith(config.prefix)) return false;
  let encoded = url.pathname.slice(config.prefix.length);
  if (config.engine === "sj-2.0.67-alpha.2") encoded = encoded.split("/").slice(2).join("/");
  try {
    const target = new URL(
      config.engine.startsWith("uv-")
        ? __uv$config.decodeUrl(encoded)
        : decodeURIComponent(encoded),
    );
    return domains.some((host) => target.hostname === host || target.hostname.endsWith("." + host));
  } catch {
    return false;
  }
}
async function route(event) {
  await policyReady;
  if (!["GET", "HEAD"].includes(event.request.method)) {
    // Firefox does not expose fetch bodies through Request.body, so every engine
    // would read null and send empty POSTs. Buffer the body once and shadow the
    // getter; engines and transports then handle a plain ArrayBuffer everywhere.
    try {
      const buffer = await event.request.clone().arrayBuffer();
      Object.defineProperty(event.request, "body", {
        value: buffer.byteLength ? buffer : null,
        configurable: true,
      });
    } catch { /* Keep the browser-provided body when it cannot be buffered. */ }
  }
  if (blocked(event.request)) {
    return new Response("This domain is blocked by your ojjyProxy domain filter.", {
      status: 403,
      headers: {
        "content-type": "text/plain",
        "cross-origin-resource-policy": "cross-origin",
        "cross-origin-opener-policy": "same-origin",
      },
    });
  }
  if (config.engine === "sj-2.0.67-alpha.2") {
    return $scramjetController.shouldRoute(event)
      ? $scramjetController.route(event)
      : fetch(event.request);
  }
  if (config.engine === "sj-2.0.2-alpha") return OjjyAlpha2.handle(event);
  if (config.engine === "uv-3.2.10") {
    return engine.route(event) ? engine.fetch(event) : fetch(event.request);
  }
  await engine.loadConfig();
  return engine.route(event) ? engine.fetch(event) : fetch(event.request);
}
function embeddingResponse(event, response) {
  const pathname = new URL(event.request.url).pathname;
  if (
    !pathname.startsWith(config.prefix) ||
    !["document", "iframe"].includes(event.request.destination)
  ) return response;
  // The proxied document is same-origin with the runtime page, so the parent's
  // require-corp policy is satisfied without any COEP of its own. Older engines
  // emit credentialless here, which Firefox refuses to embed, and require-corp
  // makes Firefox reject same-origin worker and blob scripts. Drop the header:
  // keep CORP so the parent can embed the response, and COOP for window naming.
  const headers = new Headers(response.headers);
  headers.delete("cross-origin-embedder-policy");
  headers.set("cross-origin-resource-policy", "cross-origin");
  headers.set("cross-origin-opener-policy", "same-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
self.addEventListener("fetch", (event) =>
  event.respondWith(
    route(event).then((response) => embeddingResponse(event, response)).catch((error) => {
      console.error(error);
      // Error text is not HTML: remote URLs/errors cannot inject markup into this page.
      return new Response(`ojjyProxy could not load this request.\n\n${error.message || error}`, {
        status: 502,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cross-origin-resource-policy": "cross-origin",
          "cross-origin-opener-policy": "same-origin",
        },
      });
    }),
  ));
