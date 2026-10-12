import { ENGINES } from "./public/shared.js";

const publicRoot = new URL("./public/", import.meta.url);
const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
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
      (isLocal(url.hostname) ? `${url.protocol}//${url.hostname}:8000` : ""),
  };
}
function response(body: BodyInit | null, status = 200, contentType = "text/plain; charset=utf-8") {
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
      "cross-origin-resource-policy": "cross-origin",
      "permissions-policy": "cross-origin-isolated=*",
    },
  });
}
export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (!["GET", "HEAD"].includes(request.method)) return response("Method not allowed", 405);
  try {
    const registry = origins(url);
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
    if (pathname.startsWith("/runtime/")) {
      if (!engine) return response("This origin is the outer shell, not an engine runtime", 503);
      if (pathname.startsWith("/runtime/network/")) {
        return response("Service worker not controlling this page. Reload the runtime.", 503);
      }
      if (pathname.startsWith("/runtime/vendor/")) {
        const relative = pathname.slice("/runtime/vendor/".length);
        const folder = relative.startsWith("baremux/")
          ? "bare-mux"
          : relative.startsWith("epoxy/")
          ? "epoxy-transport"
          : relative.startsWith("libcurl/")
          ? "libcurl-transport"
          : engine;
        const leaf = ["bare-mux", "epoxy-transport", "libcurl-transport"].includes(folder)
          ? relative.slice(relative.indexOf("/") + 1)
          : relative;
        pathname = `/vendor/${folder}/${leaf}`;
      }
    } else if (pathname === "/") pathname = engine ? "/runtime/index.html" : "/index.html";
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
    return response(request.method === "HEAD" ? null : data as unknown as BodyInit, 200, type);
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
