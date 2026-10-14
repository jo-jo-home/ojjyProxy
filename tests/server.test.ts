import { clearAuthAttempts, handle } from "../server.ts";
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
      [8100, "sj-1.1.0", "app.js"],
      [8200, "sj-2.0.0-alpha", "app.js"],
      [8300, "sj-2.0.2-alpha", "bundled.js"],
      [8400, "sj-2.0.67-alpha.2", "main.js"],
      [8500, "uv-3.2.10", "bundle.js"],
    ]
  ) {
    const base = `http://localhost:${port}`;
    const config = await handle(new Request(base + "/runtime/config.js"));
    equal((await config.text()).includes(String(engine)), true);
    const asset = await handle(new Request(base + "/runtime/vendor/" + filename));
    equal(asset.status, 200);
    equal(asset.headers.get("content-type"), "text/javascript; charset=utf-8");
  }
  const wasm = await handle(new Request("http://localhost:8100/runtime/vendor/app.wasm"));
  equal(wasm.status, 200);
  equal(wasm.headers.get("content-type"), "application/wasm");
  const module = await handle(new Request("http://localhost:8100/runtime/vendor/net-a/index.mjs"));
  equal(module.status, 200);
  equal(module.headers.get("content-type"), "text/javascript; charset=utf-8");
});
Deno.test("decoded traversal and unsupported methods are rejected", async () => {
  equal((await handle(new Request("http://localhost:8000/%2e%2e%2fpackage.json"))).status, 400);
  equal((await handle(new Request("http://localhost:8000/%00"))).status, 400);
  equal((await handle(new Request("http://localhost:8000/", { method: "POST" }))).status, 405);
});
Deno.test("optional site password gates the shell until the correct password unlocks it", async () => {
  const previous = Deno.env.get("SITE_PASSWORD");
  try {
    Deno.env.set("SITE_PASSWORD", "ojjythebest");
    const base = "https://proxy.example.com";
    const locked = await handle(new Request(base + "/"));
    equal(locked.status, 200);
    const lockedBody = await locked.text();
    // The login page is self-contained and does not leak the real app markup.
    equal(lockedBody.includes('name="password"'), true);
    equal(lockedBody.includes("home-input"), false);
    const blocked = await handle(new Request(base + "/api/config"));
    equal((await blocked.text()).includes("runtimes"), false);
    const wrong = await handle(
      new Request(base + "/auth", {
        method: "POST",
        body: "password=nope",
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
    );
    equal(wrong.status, 401);
    const good = await handle(
      new Request(base + "/auth", {
        method: "POST",
        body: "password=ojjythebest",
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
    );
    equal(good.status, 303);
    const cookie = (good.headers.get("set-cookie") || "").split(";")[0];
    equal(cookie.startsWith("ojjyproxy-key="), true);
    const open = await handle(new Request(base + "/", { headers: { cookie } }));
    const openBody = await open.text();
    equal(openBody.includes("home-input"), true);
    equal(openBody.includes('name="password"'), false);
  } finally {
    if (previous === undefined) Deno.env.delete("SITE_PASSWORD");
    else Deno.env.set("SITE_PASSWORD", previous);
  }
});
Deno.test("runtime vendor assets cache at the browser while dynamic config stays fresh", async () => {
  const vendor = await handle(new Request("http://localhost:8100/runtime/vendor/app.js"));
  equal(vendor.status, 200);
  equal(vendor.headers.get("cache-control"), "public, max-age=3600");
  const config = await handle(new Request("http://localhost:8100/runtime/config.js"));
  equal(config.headers.get("cache-control"), "no-store");
  const home = await handle(new Request("http://localhost:8000/"));
  equal(home.headers.get("cache-control"), "no-store");
});
Deno.test("repeated wrong passwords are rate limited", async () => {
  clearAuthAttempts();
  const previous = Deno.env.get("SITE_PASSWORD");
  try {
    Deno.env.set("SITE_PASSWORD", "ojjythebest");
    const post = (body: string) =>
      handle(new Request("https://proxy.example.com/auth", {
        method: "POST",
        body,
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }));
    let status = 0;
    for (let i = 0; i < 11; i++) status = (await post("password=wrong")).status;
    equal(status, 429);
    equal((await post("password=ojjythebest")).status, 429);
  } finally {
    if (previous === undefined) Deno.env.delete("SITE_PASSWORD");
    else Deno.env.set("SITE_PASSWORD", previous);
    clearAuthAttempts();
  }
});
Deno.test("compact mode serves the shell and one runtime on a single origin", async () => {
  const previous = {
    runtime: Deno.env.get("RUNTIME_ENGINE"),
    single: Deno.env.get("SINGLE_RUNTIME"),
    parent: Deno.env.get("PUBLIC_APP_ORIGIN"),
    origins: Deno.env.get("RUNTIME_ORIGINS"),
  };
  try {
    Deno.env.set("RUNTIME_ENGINE", "sj-1.1.0");
    Deno.env.set("SINGLE_RUNTIME", "1");
    Deno.env.delete("RUNTIME_ORIGINS");
    Deno.env.delete("PUBLIC_APP_ORIGIN");
    const base = "https://proxy.example.com";
    const home = await handle(new Request(base + "/"));
    equal(home.status, 200);
    // The shell stays at the root; the runtime is nested under /runtime/.
    const homeBody = await home.text();
    equal(homeBody.includes("ojjyProxy"), true);
    equal(homeBody.includes("starting browser"), false);
    const runtimePage = await handle(new Request(base + "/runtime/index.html"));
    equal(runtimePage.status, 200);
    equal((await runtimePage.text()).includes("starting browser"), true);
    const config = await handle(new Request(base + "/runtime/config.js"));
    const text = await config.text();
    equal(text.includes('"engine":"sj-1.1.0"'), true);
    // Compact defaults the runtime's parent to the shared origin.
    equal(text.includes('"parentOrigin":"https://proxy.example.com"'), true);
    const api = await handle(new Request(base + "/api/config"));
    const state = await api.json();
    equal(state.compact, true);
    equal(state.runtimes["sj-1.1.0"], "https://proxy.example.com");
    equal(Object.keys(state.runtimes).length, 1);
    const vendor = await handle(new Request(base + "/runtime/vendor/app.js"));
    equal(vendor.status, 200);
    const health = await handle(new Request(base + "/health"));
    equal((await health.json()).role, "sj-1.1.0");
  } finally {
    if (previous.runtime === undefined) Deno.env.delete("RUNTIME_ENGINE");
    else Deno.env.set("RUNTIME_ENGINE", previous.runtime);
    if (previous.single === undefined) Deno.env.delete("SINGLE_RUNTIME");
    else Deno.env.set("SINGLE_RUNTIME", previous.single);
    if (previous.parent === undefined) Deno.env.delete("PUBLIC_APP_ORIGIN");
    else Deno.env.set("PUBLIC_APP_ORIGIN", previous.parent);
    if (previous.origins === undefined) Deno.env.delete("RUNTIME_ORIGINS");
    else Deno.env.set("RUNTIME_ORIGINS", previous.origins);
  }
});
