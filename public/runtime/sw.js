importScripts("/runtime/config.js");
const config = self.PROXY_CONFIG;
let engine;
if (config.engine === "sj-1.1.0" || config.engine === "sj-2.0.0-alpha") {
  importScripts("/runtime/vendor/scramjet.all.js");
  const { ScramjetServiceWorker } = $scramjetLoadWorker();
  engine = new ScramjetServiceWorker();
} else if (config.engine === "sj-2.0.67-alpha.2") {
  importScripts("/runtime/vendor/controller.sw.js");
} else if (config.engine === "sj-2.0.2-alpha") {
  importScripts(
    "/runtime/vendor/baremux/index.js",
    "/runtime/vendor/scramjet_bundled.js",
    "/runtime/alpha2-shared.js",
    "/runtime/alpha2-worker.js",
  );
} else if (config.engine === "uv-3.2.10") {
  importScripts(
    "/runtime/vendor/uv.bundle.js",
    "/runtime/vendor/uv.config.js",
    "/runtime/vendor/uv.sw.js",
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
  event.waitUntil(policyReady.then(() => {
    domains = event.data.domains.filter((host) =>
      typeof host === "string" && /^[a-z\d.-]+$/i.test(host)
    ).map((host) => host.toLowerCase());
    const tx = policyDb.transaction("policy", "readwrite");
    tx.objectStore("policy").put(domains, "domains");
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }));
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
  if (blocked(event.request)) {
    return new Response("This domain is blocked by your ojjyProxy domain filter.", {
      status: 403,
      headers: {
        "content-type": "text/plain",
        "cross-origin-embedder-policy": "require-corp",
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
self.addEventListener("fetch", (event) =>
  event.respondWith(
    route(event).catch((error) => {
      console.error(error);
      // Error text is not HTML: remote URLs/errors cannot inject markup into this page.
      return new Response(`ojjyProxy could not load this request.\n\n${error.message || error}`, {
        status: 502,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cross-origin-embedder-policy": "require-corp",
          "cross-origin-resource-policy": "cross-origin",
          "cross-origin-opener-policy": "same-origin",
        },
      });
    }),
  ));
