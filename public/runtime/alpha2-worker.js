const runtime = self.$scramjet;
const cookieJar = new runtime.CookieJar();
const channel = new BroadcastChannel("ojjy-alpha2-cookies");
let db;
const ready = new Promise((resolve, reject) => {
  const request = indexedDB.open("ojjy-alpha2-state", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("state");
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    db = request.result;
    const get = db.transaction("state").objectStore("state").get("cookies");
    get.onsuccess = () => {
      if (get.result) cookieJar.load(get.result);
      resolve();
    };
    get.onerror = () => reject(get.error);
  };
});
async function setCookie(url, cookie) {
  await ready;
  cookieJar.setCookies([cookie], new URL(url));
  const cookies = cookieJar.dump();
  const tx = db.transaction("state", "readwrite");
  tx.objectStore("state").put(cookies, "cookies");
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  channel.postMessage({ type: "snapshot", cookies });
}
channel.onmessage = (event) => {
  if (event.data?.type === "set") setCookie(event.data.url, event.data.cookie).catch(console.error);
};
const parts = OjjyAlpha2.create(cookieJar, setCookie);
const handler = new runtime.ScramjetFetchHandler({
  ...parts,
  crossOriginIsolated: self.crossOriginIsolated,
  fetchDataUrl: (url) => fetch(url),
  fetchBlobUrl: (url) => fetch(url),
});
OjjyAlpha2.handle = async (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === "/runtime/bootstrap.js") {
    await ready;
    return new Response(`self.OJJY_COOKIES=${JSON.stringify(cookieJar.dump())};`, {
      headers: { "content-type": "text/javascript", "cache-control": "no-store" },
    });
  }
  if (!url.pathname.startsWith("/runtime/content/")) return fetch(event.request);
  await ready;
  const method = event.request.method;
  const result = await handler.handleFetch({
    rawUrl: url,
    destination: event.request.destination,
    mode: event.request.mode,
    referrer: event.request.referrer,
    method,
    body: ["GET", "HEAD"].includes(method) ? null : event.request.body,
    cache: event.request.cache,
    initialHeaders: runtime.ScramjetHeaders.fromNativeHeaders(event.request.headers),
  });
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers: result.headers.toNativeHeaders(),
  });
};
