// The socket class executes in the destination realm. Only cloned messages cross
// to the owning runtime, preventing old foreign-function hooks from touching it.
function installLocalSockets(client, port, rawPost) {
  const sockets = new Map();
  let serial = 0;
  const post = (message) => rawPost.call(port, message);
  class ProxyWebSocket extends EventTarget {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    CONNECTING = 0;
    OPEN = 1;
    CLOSING = 2;
    CLOSED = 3;
    readyState = 0;
    bufferedAmount = 0;
    extensions = "";
    protocol = "";
    binaryType = "blob";
    onopen = null;
    onmessage = null;
    onerror = null;
    onclose = null;
    constructor(input, protocols = []) {
      super();
      const target = new URL(String(input), client.url.href);
      if (target.protocol === "http:") target.protocol = "ws:";
      if (target.protocol === "https:") target.protocol = "wss:";
      if (!["ws:", "wss:"].includes(target.protocol) || target.hash) {
        throw new DOMException("Invalid WebSocket URL", "SyntaxError");
      }
      const list = typeof protocols === "string" ? [protocols] : protocols;
      if (
        !Array.isArray(list) || new Set(list).size !== list.length ||
        list.some((value) =>
          typeof value !== "string" || !/^[!#$%&'*+\-.^_`|~\da-z]+$/i.test(value)
        )
      ) throw new DOMException("Invalid WebSocket protocol", "SyntaxError");
      this.url = target.href;
      this._id = ++serial;
      sockets.set(this._id, this);
      const cookieUrl = new URL(target);
      cookieUrl.protocol = target.protocol === "wss:" ? "https:" : "http:";
      const headers = { "User-Agent": navigator.userAgent, Origin: client.url.origin };
      const cookie = client.cookieStore.getCookies(cookieUrl, false);
      if (cookie) headers.Cookie = cookie;
      post({ type: "connect", id: this._id, url: this.url, protocols: list, headers });
    }
    send(data) {
      if (this.readyState === 0) {
        throw new DOMException("WebSocket is connecting", "InvalidStateError");
      }
      if (this.readyState !== 1) return;
      if (
        typeof data !== "string" && !(data instanceof Blob) && !(data instanceof ArrayBuffer) &&
        !ArrayBuffer.isView(data)
      ) data = String(data);
      post({ type: "send", id: this._id, data });
    }
    close(code = 1000, reason = "") {
      if (code !== 1000 && (code < 3000 || code > 4999)) {
        throw new DOMException("Invalid close code", "InvalidAccessError");
      }
      if (new TextEncoder().encode(reason).length > 123) {
        throw new DOMException("Close reason is too long", "SyntaxError");
      }
      if (this.readyState >= 2) return;
      this.readyState = 2;
      post({ type: "close", id: this._id, code, reason });
    }
  }
  port.onmessage = async ({ data }) => {
    const socket = sockets.get(data.id);
    if (!socket) return;
    let event;
    if (data.type === "open") {
      if (socket.readyState === 2) {
        post({ type: "close", id: data.id, code: 1000, reason: "" });
        return;
      }
      socket.readyState = 1;
      socket.protocol = data.protocol || "";
      socket.extensions = data.extensions || "";
      event = new Event("open");
    } else if (data.type === "message") {
      let body = data.body;
      if (typeof body !== "string") {
        if (socket.binaryType === "arraybuffer" && body instanceof Blob) {
          body = await body.arrayBuffer();
        } else if (socket.binaryType === "blob" && !(body instanceof Blob)) body = new Blob([body]);
      }
      event = new MessageEvent("message", { data: body, origin: new URL(socket.url).origin });
    } else if (data.type === "close") {
      socket.readyState = 3;
      sockets.delete(data.id);
      event = new CloseEvent("close", {
        code: data.code || 1000,
        reason: data.reason || "",
        wasClean: data.code === 1000,
      });
    } else if (data.type === "error") {
      socket.readyState = 3;
      sockets.delete(data.id);
      event = new Event("error");
    }
    if (event) {
      socket["on" + event.type]?.call(socket, event);
      socket.dispatchEvent(event);
    }
  };
  port.start();
  globalThis.WebSocket = ProxyWebSocket;
}
export function installSocketBridge(window, client, transport) {
  if (window.__ojjySocketBridgeInstalled) return;
  const Channel = client.natives.store.MessageChannel;
  const rawPost = client.natives.store["MessagePort.prototype.postMessage"];
  const nativeEval = client.natives.store.eval;
  const channel = new Channel();
  const sockets = new Map();
  const post = (message) => rawPost.call(channel.port2, message);
  channel.port2.onmessage = ({ data }) => {
    console.debug("socket broker", data.type, data.id, typeof data.data);
    if (data.type === "connect") {
      try {
        const [send, close] = transport.connect(
          new URL(data.url),
          data.protocols,
          data.headers,
          (protocol, extensions) => post({ type: "open", id: data.id, protocol, extensions }),
          (body) => post({ type: "message", id: data.id, body }),
          (code, reason) => {
            sockets.delete(data.id);
            post({ type: "close", id: data.id, code, reason });
          },
          () => {
            sockets.delete(data.id);
            post({ type: "error", id: data.id });
          },
        );
        sockets.set(data.id, { send, close });
      } catch {
        post({ type: "error", id: data.id });
      }
    } else if (data.type === "send") sockets.get(data.id)?.send(data.data);
    else if (data.type === "close") sockets.get(data.id)?.close(data.code, data.reason);
  };
  channel.port2.start();
  const installer = nativeEval.call(window, `(${installLocalSockets.toString()})`);
  installer(client, channel.port1, rawPost);
  window.__ojjySocketBridgeInstalled = true;
  window.__ojjyInstallSocketBridge = (child, childClient) =>
    installSocketBridge(child, childClient, transport);
  window.addEventListener("pagehide", () => {
    for (const socket of sockets.values()) socket.close(1000, "");
    sockets.clear();
    channel.port2.close();
  }, { once: true });
}
