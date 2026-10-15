// Original compatibility glue following Proxy2's alpha2 API, not the alpha67 controller API.
self.OjjyAlpha2 = {};
OjjyAlpha2.create = (cookieJar, sendSetCookie) => {
  const runtime = self.$scramjet;
  const bare = new BareMux.BareClient(self.OJJY_BARE_PORT);
  const pairs = (headers) =>
    Array.isArray(headers)
      ? headers
      : Object.entries(headers || {}).flatMap(([name, values]) =>
        (Array.isArray(values) ? values : [values]).map((value) => [name, String(value)])
      );
  const transport = {
    ready: true,
    async init() {},
    connect(url, protocols, headers, onopen, onmessage, onclose, onerror) {
      const socket = bare.createWebSocket(url, protocols, undefined, Object.fromEntries(headers));
      socket.addEventListener("open", () => onopen(socket.protocol || "", socket.extensions || ""));
      socket.addEventListener("message", (event) => onmessage(event.data));
      socket.addEventListener("close", (event) => onclose(event.code, event.reason || ""));
      socket.addEventListener("error", () => onerror("socket error"));
      return [(data) => socket.send(data), (code, reason) => socket.close(code, reason)];
    },
    async request(remote, method, body, headers, signal) {
      const init = {
        method,
        headers: Object.fromEntries(headers),
        body: body ?? undefined,
        signal,
        redirect: "manual",
      };
      if (body != null && !["GET", "HEAD"].includes(method)) init.duplex = "half";
      const response = await bare.fetch(remote.toString(), init);
      return {
        body: response.body,
        headers: response.rawHeaders ? pairs(response.rawHeaders) : [...response.headers.entries()],
        status: response.status,
        statusText: response.statusText,
      };
    },
  };
  const scripts = [
    "/runtime/config.js",
    "/runtime/vendor/bridge/index.js",
    "/runtime/vendor/bundled.js",
    "/runtime/bootstrap.js",
    "/runtime/alpha2-shared.js",
    "/runtime/alpha2-client.js",
  ];
  const context = {
    config: { ...runtime.defaultConfig },
    prefix: new URL("/runtime/content/", self.location.origin),
    cookieJar,
    interface: {
      codecEncode: encodeURIComponent,
      codecDecode: decodeURIComponent,
      getInjectScripts: (meta, handler, script) =>
        scripts.map((url) => script(new URL(url, self.location.origin).href)),
      getWorkerInjectScripts: (meta, type, script) =>
        scripts.map((url) => script(new URL(url, self.location.origin).href)).join("\n"),
    },
  };
  return { context, transport, sendSetCookie };
};
