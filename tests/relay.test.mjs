import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import WebSocket from "ws";
import { createRelay } from "../relay/server.mjs";
test("owned relay accepts configured browser origins and rejects other origins/routes", async () => {
  const server = createRelay({ allowedOrigins: ["https://proxy.example"] });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base + "/health")).status, 200);
    const good = new WebSocket(base.replace("http:", "ws:") + "/wisp/", {
      origin: "https://proxy.example",
    });
    await once(good, "open");
    const closed = once(good, "close");
    good.close();
    await closed;
    for (
      const [origin, path] of [["https://other.example", "/wisp/"], [
        "https://proxy.example",
        "/wrong",
      ]]
    ) {
      const socket = new WebSocket(base.replace("http:", "ws:") + path, { origin });
      const [error] = await once(socket, "error");
      assert.match(error.message, /403/);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
