(() => {
  if (self.__ojjyAlpha2Ready) return;
  const nativeWorkerPost = self.Worker?.prototype.postMessage;
  if (typeof document === 'undefined') {
    self.OJJY_BARE_PORT = new Promise((resolve) => {
      const receive = (event) => {
        if (!event.data?.__ojjyWorkerPort || !event.ports[0]) return;
        self.removeEventListener('message', receive);
        resolve(event.ports[0]);
      };
      self.addEventListener('message', receive);
    });
  }
  const runtime = self.$scramjet;
  const cookieJar = new runtime.CookieJar();
  if (self.OJJY_COOKIES) cookieJar.load(self.OJJY_COOKIES);
  const channel = new BroadcastChannel("ojjy-alpha2-cookies");
  channel.onmessage = (event) => {
    if (event.data?.type === "snapshot") cookieJar.load(event.data.cookies);
  };
  const sendSetCookie = async (url, cookie) => {
    cookieJar.setCookies([cookie], new URL(url));
    channel.postMessage({ type: "set", url: String(url), cookie });
  };
  const parts = OjjyAlpha2.create(cookieJar, sendSetCookie);
  const hookSubcontext = (global) => {
    const client = new runtime.ScramjetClient(global, { ...parts, hookSubcontext });
    client.hook();
    return client;
  };
  hookSubcontext(self);
  if (typeof document !== 'undefined' && self.Worker) {
    const WrappedWorker = self.Worker;
    self.Worker = new Proxy(WrappedWorker, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(target, args, newTarget);
        // Workers cannot construct SharedWorkers. Give each one a fresh port
        // from its creating document after the core has rewritten its URL.
        const connection = new BareMux.BareMuxConnection('/runtime/vendor/baremux/worker.js');
        Promise.resolve(connection.getInnerPort()).then((port) => {
          nativeWorkerPost.call(worker, { __ojjyWorkerPort: true }, [port]);
          connection.worker.channel?.close();
        }).catch(console.error);
        return worker;
      },
    });
  }
  self.__ojjyAlpha2Ready = true;
})();
