import http from "node:http";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
export function createRelay({ allowedOrigins, testMode = false } = {}) {
  const allowed = new Set(
    allowedOrigins ||
      Array.from({ length: 6 }, (_, index) => `http://localhost:${8000 + index * 100}`)
        .concat(Array.from({ length: 6 }, (_, index) => `http://127.0.0.1:${8000 + index * 100}`)),
  );
  wisp.options.allow_private_ips = testMode;
  wisp.options.allow_loopback_ips = testMode;
  // Wisp 0.4.1's per-host limiter iterates a non-iterable stream object.
  // Use its working per-connection total limiter instead.
  wisp.options.stream_limit_per_host = -1;
  wisp.options.stream_limit_total = 512;
  const server = http.createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ ok: true, service: "ojjyProxy owned Wisp", version: "0.4.1" }));
    } else {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Use the /wisp/ WebSocket endpoint.");
    }
  });
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (!["/wisp", "/wisp/"].includes(pathname) || !allowed.has(request.headers.origin)) {
      socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      return;
    }
    wisp.routeRequest(request, socket, head);
  });
  return server;
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const production = process.env.NODE_ENV === "production";
  const host = process.env.HOST || (production ? "0.0.0.0" : "127.0.0.1");
  const origins = process.env.ALLOWED_ORIGINS?.split(",").map((value) =>
    new URL(value.trim()).origin
  );
  if (production && !origins?.length) {
    throw new Error("Set ALLOWED_ORIGINS to your app and runtime origins.");
  }
  const testMode = process.env.WISP_TEST_MODE === "1";
  if (testMode && (production || host !== "127.0.0.1")) {
    throw new Error("WISP_TEST_MODE is restricted to local tests.");
  }
  const server = createRelay({ allowedOrigins: origins, testMode });
  server.listen(
    Number(process.env.PORT || 9000),
    host,
    () => console.log(`Owned Wisp listening on ${host}:${process.env.PORT || 9000}/wisp/`),
  );
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
