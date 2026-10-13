import { handle } from "../server.ts";
function equal(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}
Deno.test("Deno shell serves headers and never exposes a forwarding endpoint", async () => {
  const home = await handle(new Request("http://localhost:8000/"));
  equal(home.status, 200);
  // Cross-origin isolation is intentionally absent: nothing in the stack uses
  // SharedArrayBuffer, and a require-corp shell would force COEP onto proxied
  // documents, which makes Firefox reject their same-origin worker scripts.
  equal(home.headers.get("cross-origin-embedder-policy"), null);
  equal(home.headers.get("cross-origin-opener-policy"), "same-origin");
  equal(home.headers.get("content-type"), "text/html; charset=utf-8");
  equal((await handle(new Request("http://localhost:8000/wisp/"))).status, 404);
  equal((await handle(new Request("http://localhost:8000/runtime/index.html"))).status, 503);
  const previous = Deno.env.get("PUBLIC_APP_ORIGIN");
  try {
    Deno.env.set("PUBLIC_APP_ORIGIN", "https://proxy.example.com/");
    const config = await handle(new Request("http://localhost:8000/api/config"));
    equal((await config.json()).parentOrigin, "https://proxy.example.com");
  } finally {
    if (previous === undefined) Deno.env.delete("PUBLIC_APP_ORIGIN");
    else Deno.env.set("PUBLIC_APP_ORIGIN", previous);
  }
});
Deno.test("runtime host routing selects correct distributions and MIME types", async () => {
  for (
    const [port, engine, filename] of [
      [8100, "sj-1.1.0", "scramjet.all.js"],
      [8200, "sj-2.0.0-alpha", "scramjet.all.js"],
      [8300, "sj-2.0.2-alpha", "scramjet_bundled.js"],
      [8400, "sj-2.0.67-alpha.2", "scramjet.js"],
      [8500, "uv-3.2.10", "uv.bundle.js"],
    ]
  ) {
    const base = `http://localhost:${port}`;
    const config = await handle(new Request(base + "/runtime/config.js"));
    equal((await config.text()).includes(String(engine)), true);
    const asset = await handle(new Request(base + "/runtime/vendor/" + filename));
    equal(asset.status, 200);
    equal(asset.headers.get("content-type"), "text/javascript; charset=utf-8");
  }
  const wasm = await handle(new Request("http://localhost:8100/runtime/vendor/scramjet.wasm.wasm"));
  equal(wasm.status, 200);
  equal(wasm.headers.get("content-type"), "application/wasm");
  const module = await handle(new Request("http://localhost:8100/runtime/vendor/epoxy/index.mjs"));
  equal(module.status, 200);
  equal(module.headers.get("content-type"), "text/javascript; charset=utf-8");
});
Deno.test("decoded traversal and unsupported methods are rejected", async () => {
  equal((await handle(new Request("http://localhost:8000/%2e%2e%2fpackage.json"))).status, 400);
  equal((await handle(new Request("http://localhost:8000/%00"))).status, 400);
  equal((await handle(new Request("http://localhost:8000/", { method: "POST" }))).status, 405);
});
