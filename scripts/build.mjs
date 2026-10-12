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
for (const dep of ["bare-mux", "epoxy-transport", "libcurl-transport"]) {
  await copyDist(dep, `public/vendor/${dep}`);
}
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
await writeFile(alphaPath, alpha);
manifest.adaptations.push({
  engine: "sj-2.0.0-alpha",
  change: "Guard cross-origin singleton probes",
  count: guards,
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
