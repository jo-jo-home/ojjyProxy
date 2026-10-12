(() => {
  if (self.__ojjyAlpha2Ready) return;
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
  self.__ojjyAlpha2Ready = true;
})();
