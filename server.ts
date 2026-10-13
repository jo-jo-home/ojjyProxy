import { ENGINES } from "./public/shared.js";

const publicRoot = new URL("./public/", import.meta.url);
const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  webmanifest: "application/manifest+json",
  wasm: "application/wasm",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  txt: "text/plain; charset=utf-8",
};
function environment(name: string) {
  return Deno.env.get(name) || "";
}
function isLocal(hostname: string) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}
function origins(url: URL): Record<string, string> {
  const raw = environment("RUNTIME_ORIGINS");
  if (raw) {
    const result = JSON.parse(raw);
    for (const [id, value] of Object.entries(result)) {
      if (
        !ENGINES.some((engine: { id: string }) => engine.id === id) || typeof value !== "string"
      ) throw new Error("Invalid RUNTIME_ORIGINS entry");
      const parsed = new URL(value);
      if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash) {
        throw new Error("Runtime origins must be HTTPS origins without a path");
      }
      result[id] = parsed.origin;
    }
    if (new Set(Object.values(result)).size !== Object.keys(result).length) {
      throw new Error("Each engine needs a distinct runtime origin");
    }
    return result;
  }
  return isLocal(url.hostname)
    ? Object.fromEntries(
      ENGINES.map((
        engine: { id: string; port: number },
      ) => [engine.id, `${url.protocol}//${url.hostname}:${engine.port}`]),
    )
    : {};
}
function runtimeConfig(url: URL, engine: string) {
  const compact = environment("SINGLE_RUNTIME") === "1";
  const configuredParent = environment("PUBLIC_APP_ORIGIN");
  const parent = configuredParent ? new URL(configuredParent) : null;
  if (
    parent && (!["http:", "https:"].includes(parent.protocol) || parent.username || parent.password)
  ) {
    throw new Error("PUBLIC_APP_ORIGIN must be an HTTP(S) origin without credentials");
  }
  return {
    engine,
    prefix: "/runtime/network/",
    wisp: environment("WISP_URL") ||
      (isLocal(url.hostname) ? `ws://${url.hostname}:9000/wisp/` : ""),
    parentOrigin: parent?.origin ||
      (compact ? url.origin : "") ||
      (isLocal(url.hostname) ? `${url.protocol}//${url.hostname}:8000` : ""),
  };
}
function response(
  body: BodyInit | null,
  status = 200,
  contentType = "text/plain; charset=utf-8",
  cacheControl = "no-store",
) {
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      "cache-control": cacheControl,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-resource-policy": "cross-origin",
    },
  });
}
// Optional site password gate. Set SITE_PASSWORD on the outer app to require a
// password before any page or asset is served. The five runtime origins must
// not set it: they load inside cross-origin iframes that never receive this
// cookie, and they already reject foreign parents on their own.
const AUTH_COOKIE = "ojjyproxy-key";
const AUTH_WINDOW = 15 * 60_000;
const AUTH_MAX = 10;
// Best-effort per-isolate brute-force brake for the password gate. The client
// IP comes from Deno Deploy's x-forwarded-for; local runs share one bucket.
const authAttempts = new Map<string, { count: number; reset: number }>();
export function clearAuthAttempts() {
  authAttempts.clear();
}
function authKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
function authLimited(key: string) {
  const entry = authAttempts.get(key);
  return !!entry && entry.count >= AUTH_MAX && Date.now() <= entry.reset;
}
function authFail(key: string) {
  const now = Date.now();
  const entry = authAttempts.get(key);
  if (!entry || now > entry.reset) authAttempts.set(key, { count: 1, reset: now + AUTH_WINDOW });
  else entry.count++;
}
async function gateToken() {
  const secret = environment("SITE_PASSWORD");
  if (!secret) return "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function hasCookie(request: Request, value: string) {
  return (request.headers.get("cookie") || "").split(";")
    .some((part) => part.trim() === `${AUTH_COOKIE}=${value}`);
}
function loginPage(again = false, limited = false) {
  return response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ojjyProxy</title><style>body{margin:0;min-height:100dvh;display:grid;place-content:center;background:#0a1628;color:#c8d6e5;font-family:'Segoe UI',system-ui,sans-serif}main{width:min(340px,calc(100% - 40px));border:1px solid #1e3a5f;background:#111d2e;border-radius:16px;padding:34px}h1{font-weight:300;letter-spacing:.05em;color:#e2e8f0;margin:0 0 6px;font-size:1.7rem}p{color:#90a3b9;font-size:13px;margin:0 0 20px}#again{color:#e05555}input{width:100%;box-sizing:border-box;border:1px solid #1e3a5f;background:#0a1628;color:#e2e8f0;border-radius:10px;padding:12px 13px;font-size:16px}button{width:100%;margin-top:14px;border:1px solid #2e6bbd;background:#2e6bbd;color:#fff;border-radius:10px;padding:12px;font-size:14px;cursor:pointer}</style></head><body><main><h1>ojjyProxy</h1><p>enter the site password to continue</p>${
      limited
        ? '<p id="again">too many attempts. wait a few minutes and try again.</p>'
        : again
        ? '<p id="again">that password was not right. try again.</p>'
        : ""
    }<form method="post" action="/auth"><input type="password" name="password" autocomplete="current-password" autofocus required><button type="submit">continue</button></form></main></body></html>`,
    limited ? 429 : again ? 401 : 200,
    MIME.html,
  );
}
export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = await gateToken();
  if (url.pathname === "/auth") {
    if (!token) return response("This website has no password configured.", 404);
    if (request.method !== "POST") return response("Method not allowed", 405);
    const key = authKey(request);
    if (authLimited(key)) return loginPage(false, true);
    const submitted = new URLSearchParams(await request.text()).get("password");
    if (submitted === environment("SITE_PASSWORD")) {
      authAttempts.delete(key);
      return new Response(null, {
        status: 303,
        headers: {
          "location": "/",
          "set-cookie": `${AUTH_COOKIE}=${token}; Path=/; Max-Age=2592000; SameSite=Lax${
            url.protocol === "https:" ? "; Secure" : ""
          }`,
          "cache-control": "no-store",
        },
      });
    }
    authFail(key);
    return loginPage(true);
  }
  if (!["GET", "HEAD"].includes(request.method)) return response("Method not allowed", 405);
  if (token && !hasCookie(request, token)) return loginPage();
  try {
    // Compact mode: one origin serves the shell AND a single runtime, so the
    // whole product (and its Wisp relay via the reverse proxy) lives behind
    // one domain — the deployment shape that survives restrictive networks.
    const compact = environment("SINGLE_RUNTIME") === "1";
    const registry = compact ? { [environment("RUNTIME_ENGINE")]: url.origin } : origins(url);
    const engine = environment("RUNTIME_ENGINE") ||
      Object.entries(registry).find(([, origin]) => origin === url.origin)?.[0];
    if (engine && !ENGINES.some((item: { id: string }) => item.id === engine)) {
      return response("Invalid runtime engine", 500);
    }
    if (url.pathname === "/api/config") {
      return response(
        JSON.stringify({
          engines: ENGINES,
          runtimes: registry,
          compact,
          ...runtimeConfig(url, engine || ""),
        }),
        200,
        MIME.json,
      );
    }
    if (url.pathname === "/health") {
      return response(JSON.stringify({ ok: true, role: engine || "shell" }), 200, MIME.json);
    }
    if (url.pathname === "/runtime/config.js") {
      if (!engine) return response("Runtime origin is not configured", 503);
      return response(
        `self.PROXY_CONFIG=${JSON.stringify(runtimeConfig(url, engine))};`,
        200,
        MIME.js,
      );
    }
    if (url.pathname === "/runtime/vendor/uv.config.js") {
      return response(
        `self.__uv$config={prefix:"/runtime/network/",encodeUrl:Ultraviolet.codec.xor.encode,decodeUrl:Ultraviolet.codec.xor.decode,handler:"/runtime/vendor/uv.handler.js",client:"/runtime/vendor/uv.client.js",bundle:"/runtime/vendor/uv.bundle.js",config:"/runtime/vendor/uv.config.js",sw:"/runtime/vendor/uv.sw.js"};`,
        200,
        MIME.js,
      );
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.includes("\0") || pathname.split("/").includes("..") || pathname.includes("\\")) {
      return response("Bad path", 400);
    }
    // Pinned engine bundles never change between deploys; caching them at the
    // browser turns repeat runtime startups from megabytes into cache hits.
    const vendorAsset = pathname.startsWith("/runtime/vendor/");
    if (pathname.startsWith("/runtime/")) {
      if (!engine) return response("This origin is the outer shell, not an engine runtime", 503);
      if (pathname.startsWith("/runtime/network/")) {
        return response("Service worker not controlling this page. Reload the runtime.", 503);
      }
      if (pathname.startsWith("/runtime/vendor/")) {
        const relative = pathname.slice("/runtime/vendor/".length);
        const folder = relative.startsWith("baremux/")
          ? "bare-mux"
          : relative.startsWith("epoxy-modern/")
          ? "epoxy-modern"
          : relative.startsWith("epoxy/")
          ? "epoxy-transport"
          : relative.startsWith("libcurl/")
          ? "libcurl-transport"
          : engine;
        const leaf =
          ["bare-mux", "epoxy-transport", "epoxy-modern", "libcurl-transport"].includes(folder)
            ? relative.slice(relative.indexOf("/") + 1)
            : relative;
        pathname = `/vendor/${folder}/${leaf}`;
      }
    } else if (pathname === "/") {
      // Compact mode keeps the outer shell at the root; the runtime lives
      // under /runtime/ on this same origin.
      pathname = engine && !compact ? "/runtime/index.html" : "/index.html";
    }
    const file = new URL(`.${pathname}`, publicRoot);
    if (!file.href.startsWith(publicRoot.href)) return response("Forbidden", 403);
    let data: Uint8Array;
    try {
      data = await Deno.readFile(file);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.IsADirectory) {
        return response("Not found", 404);
      }
      throw error;
    }
    const type = MIME[pathname.split(".").pop() || ""] || "application/octet-stream";
    return response(
      request.method === "HEAD" ? null : data as unknown as BodyInit,
      200,
      type,
      vendorAsset ? "public, max-age=3600" : "no-store",
    );
  } catch (error) {
    console.error(error);
    return response("Server configuration or request error", 500);
  }
}
if (import.meta.main) {
  Deno.serve({
    hostname: environment("HOST") || "0.0.0.0",
    port: Number(environment("PORT") || 8000),
  }, handle);
}
