import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

// Package pins mirror the audited Proxy2 distributions. Build reproducibly from npm,
// not from a user's Downloads directory or an unversioned CDN.
const packages = {
  "sj-1.1.0": ["sj-stable"],
  "sj-2.0.0-alpha": ["sj-alpha0"],
  "sj-2.0.2-alpha": ["sj-alpha2"],
  "sj-2.0.67-alpha.2": ["sj-alpha67", "sj-controller"],
  "uv-3.2.10": ["ultraviolet"],
};
await mkdir("public/vendor", { recursive: true });
await mkdir("public/notices", { recursive: true });
const manifest = { generatedFrom: "package-lock.json", engines: {}, adaptations: [] };
async function copyDist(pkg, destination) {
  const source = `node_modules/${pkg}`;
  const metadata = JSON.parse(await readFile(`${source}/package.json`, "utf8"));
  await mkdir(destination, { recursive: true });
  await cp(`${source}/dist`, destination, {
    recursive: true,
    filter: (file) => !file.endsWith(".map") && !file.endsWith(".ts"),
  });
  const notice = {
    name: metadata.name,
    version: metadata.version,
    license: metadata.license,
    repository: metadata.repository,
  };
  await writeFile(`public/notices/${pkg}.json`, JSON.stringify(notice, null, 2) + "\n");
  for (const filename of ["LICENSE", "LICENSE.md", "NOTICE"]) {
    try {
      await cp(`${source}/${filename}`, `public/notices/${pkg}-${filename}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return notice;
}
for (const [engine, deps] of Object.entries(packages)) {
  manifest.engines[engine] = [];
  for (const dep of deps) {
    manifest.engines[engine].push(await copyDist(dep, `public/vendor/${engine}`));
  }
}
for (const dep of ["bare-mux", "epoxy-transport", "epoxy-modern", "libcurl-transport"]) {
  await copyDist(dep, `public/vendor/${dep}`);
}
// Firefox does not expose request bodies through Request.body (the getter is
// null even for buffered bodies) and drops stream bodies at Request
// construction. Carry the body directly from the fetch init — buffering
// streams once — and never read it back through the getter. Guard the worker
// transfer list so only ArrayBuffers are marked transferable.
{
  const file = "public/vendor/bare-mux/index.js";
  const source = await readFile(file, "utf8");
  const patches = [
    ['async fetch(e,r){const a=new Request(e,r)', 'async fetch(e,r){if(r&&r.body instanceof ReadableStream)r={...r,body:await new Response(r.body).arrayBuffer()};const a=new Request(e,r)'],
    ["n=a.body;", "n=r?.body??null;"],
    ["n?[n]:[])", "n instanceof ArrayBuffer?[n]:[])"],
  ];
  for (const [needle] of patches) if (!source.includes(needle)) throw new Error(`BareMux pattern changed: ${needle}`);
  await writeFile(file, patches.reduce((text, [from, to]) => text.replace(from, to), source));
  manifest.adaptations.push({ component: "bare-mux@2.1.9", change: "Carry request bodies from the init across the worker boundary" });
}
// Stable 1.1.0 embeds its own private BareMux copy, so the vendored patch never
// reaches it. Apply the same init-carry handling inside its internal client.
{
  const file = "public/vendor/sj-1.1.0/scramjet.all.js";
  const source = await readFile(file, "utf8");
  const patches = [
    ["async fetch(e,t){let r=new Request(e,t)", 'async fetch(e,t){if(t&&t.body instanceof ReadableStream)t={...t,body:await new Response(t.body).arrayBuffer()};let r=new Request(e,t)'],
    ["s=r.body,o=new URL(r.url)", "s=t?.body??null,o=new URL(r.url)"],
    ["s?[s]:[])", "s instanceof ArrayBuffer?[s]:[])"],
  ];
  for (const [needle] of patches) if (!source.includes(needle)) throw new Error(`Stable internal client pattern changed: ${needle}`);
  await writeFile(file, patches.reduce((text, [from, to]) => text.replace(from, to), source));
  manifest.adaptations.push({ engine: "sj-1.1.0", change: "Carry request bodies from the init inside the embedded private BareMux" });
}
// UV's bundled client re-exposes every body through the same getter; its
// handler already buffers requests as Blobs, so carry that value directly.
{
  const file = "public/vendor/uv-3.2.10/uv.bundle.js";
  const source = await readFile(file, "utf8");
  const patches = [
    ["async fetch(t,r){let n=new Request(t,r)", 'async fetch(t,r){if(r&&r.body instanceof ReadableStream)r={...r,body:await new Response(r.body).arrayBuffer()};let n=new Request(t,r)'],
    ["i=n.body,f=new URL(n.url)", "i=r?.body??null,f=new URL(n.url)"],
    ["i?[i]:[])", "i instanceof ArrayBuffer?[i]:[])"],
  ];
  for (const [needle] of patches) if (!source.includes(needle)) throw new Error(`UV client pattern changed: ${needle}`);
  await writeFile(file, patches.reduce((text, [from, to]) => text.replace(from, to), source));
  manifest.adaptations.push({ engine: "uv-3.2.10", change: "Carry request bodies from the init before the worker boundary" });
}
// Alpha0's built-in transport and the alpha67 controller RPC pass raw streams;
// buffer both. Plain assignments cover internal objects; defineProperty covers
// Request instances whose body is a prototype getter.
const bodyHelper =
  'async function __ojjyBody(t){const r=t.body;if(r instanceof ReadableStream){const a=await new Response(r).arrayBuffer();' +
  'try{t.body=a}catch{Object.defineProperty(t,"body",{value:a,writable:!1,configurable:!0})}return a}return r}\n';
{
  const file = "public/vendor/sj-2.0.0-alpha/scramjet.all.js";
  const source = await readFile(file, "utf8");
  const needle = 'body:k.body,headers:k.requestHeaders,credentials:"omit"';
  if (!source.includes(needle)) throw new Error("Alpha0 fetch body pattern changed");
  await writeFile(file, bodyHelper + source.replace(needle, 'body:await __ojjyBody(k),headers:k.requestHeaders,credentials:"omit"'));
  manifest.adaptations.push({ engine: "sj-2.0.0-alpha", change: "Buffer stream request bodies before the built-in transport" });
}
{
  const file = "public/vendor/sj-2.0.67-alpha.2/controller.sw.js";
  const source = await readFile(file, "utf8");
  const needle = "body:e.request.body,cache:e.request.cache";
  if (!source.includes(needle)) throw new Error("Controller SW body pattern changed");
  await writeFile(file, bodyHelper + source.replace(needle, "body:await __ojjyBody(e.request),cache:e.request.cache"));
  manifest.adaptations.push({ engine: "sj-2.0.67-alpha.2", change: "Buffer stream request bodies before the controller RPC" });
}
for (const extension of ["js", "mjs"]) {
  const file = `public/vendor/epoxy-transport/index.${extension}`;
  const source = await readFile(file, "utf8");
  const needle = "(await ws).send(data);";
  if (!source.includes(needle)) throw new Error("Epoxy socket send pattern changed");
  await writeFile(file, source.replace(needle, "await (await ws).send(data);"));
}
manifest.adaptations.push({
  component: "epoxy-transport@2.1.28",
  change: "Await asynchronous destination WebSocket sends",
});
const alphaPath = "public/vendor/sj-2.0.0-alpha/scramjet.all.js";
let alpha = await readFile(alphaPath, "utf8");
// Alpha0 assumes accessible parent/top/opener. Keep that release's runtime, but
// guard only its cross-origin singleton probes so a nested runtime can initialize.
let guards = 0;
alpha = alpha.replace(
  /([\w$]+(?:\.[\w$]+)*)\s+in\s+([\w$]+)\.(parent|top|opener)/g,
  (_, symbol, global, property) => {
    guards++;
    return `__ojjyHasSymbol(${global}.${property},${symbol})`;
  },
);
if (!guards) {
  throw new Error("Alpha0 guard pattern changed; inspect the pinned artifact before building.");
}
alpha =
  "function __ojjyHasSymbol(target,symbol){try{return target!=null&&symbol in target}catch{return false}}\n" +
  alpha;
const clientHook = "A.hook(),h&&new D.ScramjetServiceWorkerRuntime(A).hook();";
if (!alpha.includes(clientHook)) throw new Error("Alpha0 client bootstrap pattern changed");
alpha = alpha.replace(
  clientHook,
  '(()=>{const owner=globalThis.parent;A.hook();if(owner&&owner!==globalThis&&typeof owner.__ojjyInstallSocketBridge==="function")owner.__ojjyInstallSocketBridge(A.global,A)})(),h&&new D.ScramjetServiceWorkerRuntime(A).hook();',
);
await writeFile(alphaPath, alpha);
manifest.adaptations.push({
  engine: "sj-2.0.0-alpha",
  change: "Guard cross-origin singleton probes",
  count: guards,
});
manifest.adaptations.push({
  engine: "sj-2.0.0-alpha",
  change: "Window WebSocket compatibility bridge via the owned runtime Epoxy transport",
  source: "public/runtime/websocket.js",
});
await cp("node_modules/@mercuryworkshop/wisp-js/LICENSE", "public/notices/wisp-LICENSE");
await cp("node_modules/@mercuryworkshop/wisp-js/LICENSE", "LICENSE");
manifest.hashes = {};
async function fingerprint(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await fingerprint(file);
    else {manifest.hashes[file.replaceAll("\\", "/")] = createHash("sha256").update(
        await readFile(file),
      ).digest("hex");}
  }
}
await fingerprint("public/vendor");
await writeFile("public/asset-manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Built ${
    Object.keys(packages).length
  } engine distributions; guarded ${guards} alpha0 ancestor probes.`,
);
