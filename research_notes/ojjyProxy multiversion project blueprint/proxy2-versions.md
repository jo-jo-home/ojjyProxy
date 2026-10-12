# Proxy2 evidence audit and revised ojjyProxy multiversion blueprint

Research date: **2026-10-12**. Primary implementation reference: `/Users/tinlaplee/Downloads/Proxy2`. This is a research deliverable, not an application. The earlier implementation research and report are research artifacts; their Scramjet 2.x default and combined-root-worker recommendation are superseded for this task. **User-mandated default: Scramjet 1.1.0 stable. Selectable engines: Scramjet 1.1.0, 2.0.0-alpha, 2.0.2-alpha, 2.0.67-alpha.2, and Ultraviolet.** “Stable” is the requested release label, not a finding that every website works.

Method: read all four `config.js`, `index.html`, `sw.js`, `server.mjs`, manifests and locks; inspect vendor API signatures and storage/transport code; read the supplied 2.0.2 `client.js`; compare vendored binaries with exact npm tarball members in memory; corroborate selected source details from ZIP members. No originals were edited, no dependencies installed, and no app was implemented. Temporary inspection scripts were placed outside the project. Exact tests and their limits are recorded in question 3.

Evidence convention: **F** = source finding; **T** = limited executed check; **P** = proposed blueprint/inference; **U** = unverified browser/website behavior. References link actual source files or packages. For minified code, `L… @…` means the physical line and a **zero-based decoded character offset** in the original file, followed by an identifying literal. Offsets are not byte offsets. A source ZIP citation identifies an archive member, not an extracted file. The README was used as an inventory claim to check, not as implementation proof.

## 1. What do the four supplied versions actually contain, and which integrations are compatible?

### Takeaway

Proxy2 contains genuine, byte-matched distributions for all four requested Scramjet versions, but they represent **three incompatible runtime generations**. Retain a separate adapter and shell realm for each selectable version; 2.0.2-alpha's hand-written integration has real bootstrap/state gaps even though its vendor runtime is authentic. ([1.1 runtime][s1-all]; [alpha0 runtime][s0-all]; [alpha2 runtime][s2-all]; [alpha67 controller][s67-api])

### Cited Findings

#### Concrete integration matrix

| Choice / role | Runtime globals and browser API | Transport actually wired | Worker / state model | Required asset set and navigation | Integration disposition |
|---|---|---|---|---|---|
| **Scramjet 1.1.0 — DEFAULT** | `$scramjetLoadController()` → `ScramjetController`; `$scramjetLoadWorker()` → `ScramjetServiceWorker`; `$scramjetVersion` says `1.1.0`, build `57ba89e` | BareMux **2.1.9** → ESM Epoxy transport **2.1.28**, embedding Epoxy-TLS **2.1.18-1** → Wisp | Engine SW does rewriting; controller config and cookies in hardcoded IndexedDB **`$scramjet`, version 1** | `scramjet.all.js`, `scramjet.wasm.wasm`, `scramjet.sync.js`; BareMux index/worker and Epoxy `.mjs`; `controller.createFrame(iframe).go(canonicalUrl)` | Authentic stable distribution; fix unawaited `init()` and readiness; isolate from alpha0 DB and other BareMux users. [Index L38–71][s1-index]; [worker L8–18][s1-sw]; [vendor][s1-all] |
| **Scramjet 2.0.0-alpha — selectable** | Same factory/controller/frame style, but `$scramjetVersion` says `2.0.0-alpha`, build `8a2ced3` | **Built-in Epoxy-TLS 2.1.18-1**, configured through controller **`wisp`**; no BareMux in supplied path. Both SW and injected client code include Epoxy usage | Engine SW rewriting; **same `$scramjet`, version 1**, same singleton config record as 1.1.0 | Same filenames as stable but different JS/WASM bytes; pass `wisp` plus `prefix/files`; `.createFrame().go()` | Independent compatibility option; cannot substitute stable bundles or expose a BareMux transport menu as if it controlled this version. [Index L41–66][s0-index]; [vendor L193 `initEpoxy`][s0-all]; [exact npm metadata][r0] |
| **Scramjet 2.0.2-alpha — selectable** | `self.$scramjet`; exports `ScramjetClient`, `ScramjetFetchHandler`, `ScramjetHeaders`, `CookieJar`, `defaultConfig`, codecs/rewriters; **no controller or ready-made ScramjetServiceWorker export** | BareMux **2.1.9** → Epoxy transport **2.1.28**; hand-written `ProxyTransport` adapters in SW and injected client | Custom `ScramjetFetchHandler` in SW; SW and each client create **separate in-memory CookieJars**; no persistence/sync glue supplied | Single `scramjet_bundled.js` embeds rewriter WASM; BareMux index/worker, Epoxy `.mjs`, `client.js`, shared bootstrap config; current shell manually uses `prefix + encodeURIComponent(url)` | Vendor genuine, **integration requires repair**: config is not injected; worker injection is empty; cookie state diverges. [Index L35–58][s2-index]; [SW L17–104][s2-sw]; [client L15–121][s2-client]; [exports L32][s2-all] |
| **Scramjet 2.0.67-alpha.2 — selectable** | `$scramjet` core + `$scramjetController` API; `new Controller({serviceworker,transport,…})`, `await controller.wait()`, `.createFrame().go()`; controller is **0.0.14** and asserts exact core version | **Direct** UMD Epoxy transport **2.1.28**, global **`EpxMod.default`**; supplied optional direct libcurl transport **1.5.2**, global **`CurlMod.default`**, embedding libcurl.js **0.7.4** | SW forwards requests by RPC to live page controller/frame; controller cookies persisted in **`__scramjet_controller`**, shared via fixed BroadcastChannel | `scramjet.js`, `scramjet.wasm`, `controller.api.js`, `controller.inject.js`, `controller.sw.js`, selected transport UMD; virtual WASM script generated under frame prefix | Matched core/controller pair verified; preserve this version's header adapter and handshake; generated controller/frame routes are ephemeral. [Index L42–111][s67-index]; [API L1, L40][s67-api]; [SW bundle][s67-sw-bundle] |
| **Ultraviolet 3.2.10 — retained selectable legacy engine** | `Ultraviolet`, `__uv$config`, `UVServiceWorker`; separate UV codec/config contract | BareMux-backed `Ultraviolet.BareClient`; exact transport pin to be selected/verified in UV adapter | UV SW rewriting; cookie IndexedDB **`__op`** | `uv.bundle.js`, `uv.client.js`, `uv.handler.js`, `uv.config.js`, `uv.sw.js`, wrapper SW + BareMux transport assets; matching UV encoder/decoder | **Not supplied in Proxy2**. Retain from separately pinned UV package/source, with its own runtime origin/scope. Do not treat Proxy2 as a five-engine finished app. [UV ZIP `package.json`, `src/uv.config.js`, `src/rewrite/cookie.js` L22–31][uv-zip]; [UV worker][uv-sw-source] |

The two old factory versions do not share the same network model simply because their public frame APIs look similar. Conversely, the two `$scramjet` versions do not share controller APIs simply because their core global has the same name. **Version numbers are selection IDs, not interchangeable interfaces.** ([stable setup][s1-index]; [alpha0 setup][s0-index]; [alpha2 exports][s2-all]; [alpha67 API][s67-api])

#### Runtime signatures checked in actual vendor code

| Source path under Proxy2 | Physical evidence locator / signature |
|---|---|
| `scramjet-1.1.0/vendor/scramjet.all.js` | **L195 @169390** area: global factories `$scramjetLoadController`, `$scramjetLoadClient`, `$scramjetLoadWorker`; `$scramjetVersion={build:"57ba89e",version:"1.1.0"}`. **L4 @57607** `async init()` awaits `openIDB()`. **L4 @58367** opens `$scramjet` and creates config/cookies/redirectTrackers/referrerPolicies/publicSuffixList. **L192 @95533** `loadConfig()` gets `config/config`. [File][s1-all] |
| `scramjet-2.0.0-alpha/vendor/scramjet.all.js` | **L193 @1897566** version `2.0.0-alpha`, build `8a2ced3`; **L193 @1808638** `loadConfig()` opens `$scramjet`, then `initEpoxy()` creates the embedded client with `this.config.wisp`; **L2 @1719270** injected client also creates Epoxy with config `wisp`; **L5 @1770539** controller IDB open. [File][s0-all] |
| `scramjet-2.0.2-alpha/vendor/scramjet_bundled.js` | **L28 @64032** version `2.0.2-alpha`, build `82d0a55e`, build date `2025-12-25T06:40:23.380Z`; **L32 @162577–163700** exported names; **L32 @164502** inline `setWasm(Uint8Array.from(atob("AGFzb…"),…))`; **L1 @4918** `ScramjetClient(global, init)` reads `init.context` and `init.transport`; **L1 @8396** `.hook()`; **L21 @53704** FetchHandler constructor options. [File][s2-all] |
| `scramjet-2.0.67-alpha.2/vendor/scramjet.js` | **L26 @74631** core `version:"2.0.67-alpha.2",build:"c26bfc6",date:"2026-06-24T02:30:45.970Z"`; **L30 @215640** export map. Its exports include `Tap`, `Plugin`, `BareResponse`, `ScramjetFetchTrackedClient`, `IncrementalHtmlRewriter`; these are not the older alpha2 event API. [File][s67-core] |
| `scramjet-2.0.67-alpha.2/vendor/controller.api.js` | **L1 @~200** version constant `0.0.14` and exact expected core string `2.0.67-alpha.2`; **L1 @5739** default asset/config paths; **L1 @10928** `Controller` construction and readiness Promise; **L1 @13372** `.wait()`; **L40 @16734** Frame back/forward/reload/go. [File][s67-api] |
| `scramjet-1.1.0/vendor/baremux/worker.js` and identical alpha2 copy | **L1** logs `bare-mux: running v2.1.9 (build dc9dc6e)`; worker-level single `s=null` active transport. [File][bm-worker] |
| `scramjet-2.0.67-alpha.2/vendor/epoxy/index.js` | **L1** UMD global `EpxMod`; **L1487** embedded TLS info `2.1.18-1`, commit `e2d1d4e50a97be4a1a242eea6b212cfb77b78426`; **L1500–1561** transport class and request/connect signatures. The wrapper package is **2.1.28**, not 2.1.18-1. [File][epoxy-umd]; [registry][re] |
| `scramjet-2.0.67-alpha.2/vendor/libcurl/index.js` | **L1** UMD global `CurlMod`; **L6258–6259** embedded libcurl.js `0.7.4`, Wisp library `1.1.1`; **L6399–6490** `LibcurlClient` contract. The wrapper package is **1.5.2**, not 0.7.4. [File][curl-umd]; [registry][rcurl] |

**T — runtime export check:** loaded alpha2 and alpha67 core bundles in a stubbed Node VM; their reported versions and exported names matched these signatures. Alpha2 had no `ScramjetController`/`ScramjetServiceWorker`; alpha67 core likewise needs its separate controller package. This did not construct real browser clients or register workers. ([Probe script][runtime-probe]; [alpha2 runtime][s2-all]; [alpha67 runtime][s67-core])

#### Exact dependency and artifact provenance

All four **example** manifests have only `@mercuryworkshop/wisp-js: ^0.4.1` and `start: node server.mjs`; none declares its vendored browser engines or transport packages. Each supplied lock resolves the same server dependency set: Wisp **0.4.1**, bufferutil **4.1.0**, commander **14.0.3**, ipaddr.js **2.5.0**, node-gyp-build **4.8.4**, ws **8.22.0**. Commander declares Node `>=20`. The browser distribution pins below were established by bundle signatures and npm byte comparison, **not the example lockfile**. ([Stable manifest][s1-package]; [stable lock L12–88][s1-lock]; [alpha0 manifest][s0-package]; [alpha2 manifest][s2-package]; [alpha67 manifest][s67-package]; [audit script][audit-script])

**T — npm member comparison:** fetched each exact registry metadata record and tarball; read tarball members in memory without extraction/install; every tested member matched the corresponding local bytes. Each fetched tarball's SHA-1 matched registry `dist.shasum`. Alpha2's BareMux/Epoxy copies also match stable by local SHA-256. npm registry includes signature metadata and, for some packages, provenance URLs; **the signing keys/signatures and SLSA attestations were not cryptographically authenticated in this audit**. Byte equivalence and runtime API signatures are the verified claims. ([Comparison script][provenance-script]; [registry stable][r1]; [registry alpha0][r0]; [registry alpha2][r2]; [registry alpha67][r67]; [controller][rcontroller]; [BareMux][rbm]; [Epoxy][re]; [libcurl][rcurl])

| Exact npm package | Matching `package/dist/` members | Downloaded tarball SHA-256 |
|---|---|---|
| Scramjet **1.1.0** | all, bundle, sync, wasm.wasm | `5f864315141a1c76044cb8e801650f41581dae32a417cde08a691bc3fad8366b` [Package][r1] |
| Scramjet **2.0.0-alpha** | all, bundle, sync, wasm.wasm | `b5ad6aefae3322634de440431d99775c68a786d2186cc4bad3b15bf8042617e2` [Package][r0] |
| Scramjet **2.0.2-alpha** | `scramjet_bundled.js` | `6d3f24cc3738fb48ba84acb801fdee30f91eb80386f9f99597e6dabfe1b71f21` [Package][r2] |
| Scramjet **2.0.67-alpha.2** | `scramjet.js`, `scramjet.wasm` | `ad99a2bb6fcd35b146b7d23a53273d31a53a85089b1b8e8291053a8847be8c51` [Package][r67] |
| Scramjet-controller **0.0.14** | controller api, inject, sw | `53318f8a9d160ca06c7ac20cebc1577cbe322801c803bcaa8104d2729d9b122a` [Package][rcontroller] |
| BareMux **2.1.9** | `index.js`, `worker.js` | `21f3e6027eea488d4188ba0c7c12e2764198e0bcc7c6cd0cec1aea01516f5667` [Package][rbm] |
| Epoxy transport **2.1.28** | `index.mjs` (stable/alpha2), `index.js` (alpha67) | `afc4603c7ce424d43f8c70f3bb183f45c57ffb709e091e2dfc428837f0d77840` [Package][re] |
| Libcurl transport **1.5.2** | `index.js` (alpha67) | `6a4d243ad9a53be4bd6dc3f141fe2a23b87b6db401abb3de0ad7441c6d503ba7` [Package][rcurl] |

Relevant **engine package** dependencies differ: stable declares BareMux `^2.1.9` and idb `^8.0.3`; alpha0 declares Epoxy-TLS **exact 2.1.18-1** and no BareMux; alpha2 and alpha67 declare `proxy-transports` **1.0.2**. Controller 0.0.14 declares proxy-transports 1.0.2 and dev core exactly alpha67. Epoxy 2.1.28 declares TLS exactly 2.1.18-1; libcurl 1.5.2 declares libcurl.js `^0.7.4`, but the inspected bundle embeds 0.7.4. These package dependencies are already included as appropriate in vendored builds; installing the example's Wisp dependency does not regenerate them. ([r1][r1]; [r0][r0]; [r2][r2]; [r67][r67]; [controller][rcontroller]; [Epoxy][re]; [libcurl][rcurl])

#### Local vendor fingerprint inventory

These identify the inspected local vendor snapshot. Original sizes are bytes. The unused old-generation `scramjet.bundle.js` files are still inventoried; the supplied shells load `scramjet.all.js`, not both. ([Inventory script][audit-script]; [stable shell L17–19][s1-index]; [alpha0 shell L19–20][s0-index])

| Path under Proxy2 | Bytes | SHA-256 |
|---|---:|---|
| `scramjet-1.1.0/vendor/scramjet.all.js` | 180319 | `7d8de4965167a27b573bf7022190cfb68c9485d622c5a082e207a1092158d520` |
| `scramjet-1.1.0/vendor/scramjet.bundle.js` | 900441 | `fb4edb23d777062d7233490ec23b69efaa31e85912ad602de48209b2a5a459f7` |
| `scramjet-1.1.0/vendor/scramjet.sync.js` | 759 | `776e61fe075e231c105ca8f9540cceb631b94f6e565ba5d8470545151e0ba804` |
| `scramjet-1.1.0/vendor/scramjet.wasm.wasm` | 536994 | `ed500d8cb02ea06810707ee40f0eeb5790c2eaa5b53550b19e302815d2b1307a` |
| `scramjet-1.1.0/vendor/baremux/index.js` | 8676 | `80626244b605a12cde14c81ea603ed27908ff80775e6d46d1c1e02912947eefb` |
| `scramjet-1.1.0/vendor/baremux/worker.js` | 2903 | `de905101f2845a021e35768ec7c008b5d0979aa5ea52bf41a33df9e40eaa8d8f` |
| `scramjet-1.1.0/vendor/epoxy/index.mjs` | 1737803 | `1095264b51ed56ef3cbeaa545b2329bf807dea469a0a85d129ca04787643940a` |
| `scramjet-2.0.0-alpha/vendor/scramjet.all.js` | 1918782 | `6fff68a7096fc21acf78ce5073a63c49061dc197e483b380c24d61d6f8bd2c03` |
| `scramjet-2.0.0-alpha/vendor/scramjet.bundle.js` | 2807998 | `a8dc749c5fa0c5e5ae1bc6db8c46f73eff484247d5577e5a12fadf8241c6a051` |
| `scramjet-2.0.0-alpha/vendor/scramjet.sync.js` | 759 | same sync hash as stable |
| `scramjet-2.0.0-alpha/vendor/scramjet.wasm.wasm` | 425724 | `d286d8ac714a8bfeade65a138917d11798372df88176f19811200cb4ca466bdc` |
| `scramjet-2.0.2-alpha/vendor/scramjet_bundled.js` | 818161 | `19ee2e52e2fccc4647239e26acb3391af310032e6d1b77afc414ee7beb6fd56d` |
| `scramjet-2.0.2-alpha/vendor/baremux/index.js` | 8676 | identical to stable BareMux index |
| `scramjet-2.0.2-alpha/vendor/baremux/worker.js` | 2903 | identical to stable BareMux worker |
| `scramjet-2.0.2-alpha/vendor/epoxy/index.mjs` | 1737803 | identical to stable Epoxy ESM |
| `scramjet-2.0.67-alpha.2/vendor/scramjet.js` | 227109 | `e116b8adbdae9e9d9bee6abd8370990faa2615796c2e8fc0b7b8942537c0d92e` |
| `scramjet-2.0.67-alpha.2/vendor/scramjet.wasm` | 586279 | `c8740c340a506686d9e46feb82894ab710cf57cd20564d001d0aef04310661e8` |
| `scramjet-2.0.67-alpha.2/vendor/controller.api.js` | 17086 | `9bc38bc6dce704ebf71fd7c418151bf7192b0a6c10e15f1037c77e146c163c91` |
| `scramjet-2.0.67-alpha.2/vendor/controller.inject.js` | 6436 | `4744bb39bcfcdbe2baa43f26c760abc5c6248475da5086b2be0eefcd1724fb87` |
| `scramjet-2.0.67-alpha.2/vendor/controller.sw.js` | 4576 | `805309725993d31a8e540c20c575dcc176a86e7fdfc6b9d69ccf4ee8f94c736d` |
| `scramjet-2.0.67-alpha.2/vendor/epoxy/index.js` | 1739484 | `bae1ca90ea0e8f180c29358c95f6b08f227817ef66c4edea8b1024927305ac1d` |
| `scramjet-2.0.67-alpha.2/vendor/libcurl/index.js` | 2112149 | `8dd5a1e84f615f6d50746b94cb7b0d1e55cb9c97bc5d213a7d56038acaec77c6` |

Table evidence: [local inventory output L5–471][audit-output], [local vendor tree][primary-root], [exact member comparison][provenance-script].

#### Licenses and notices: actual contents, including conflicts

No root/example/vendor `LICENSE` or `NOTICE` file was found in Proxy2. All four examples do retain dependency LICENSE files inside `node_modules`; this includes Wisp's full **GNU Affero General Public License v3** text. These are server-dependency notices, not a substitute for the omitted browser-vendor notices. Vendor map trailers refer to maps that were not supplied; source maps are optional for execution and are not license files. ([Inventory output][audit-output]; [Wisp LICENSE L1–6][wisp-license]; [stable map trailer][s1-all]; [controller trailer][s67-api])

| Component | Metadata vs actual license content | Blueprint consequence |
|---|---|---|
| Scramjet 1.1.0 | npm/source manifest says **MIT**, but exact npm `package/LICENSE` and optional source ZIP's root LICENSE are **AGPL v3 text** | **Confirmed conflict**; do not present the vendored stable engine as cleanly MIT-licensed. Preserve both evidence and resolve intended license with upstream before distribution. [Metadata][r1]; [tarball member][r1-tar]; [ZIP `package.json` / `LICENSE`][zip1] |
| Scramjet 2.0.0-alpha | npm metadata **MIT**, exact npm `package/LICENSE` **AGPL v3 text** | Same explicit conflict; metadata alone is insufficient. [Metadata][r0]; [tarball][r0-tar] |
| Scramjet 2.0.2-alpha | npm metadata **MIT**; no LICENSE/NOTICE member located in inspected exact tarball; Proxy2 also omits notices | License-text/provenance gap; do not infer the earlier AGPL-file conflict automatically resolves this version's terms. A lookup of raw upstream paths using embedded `82d0a55e` returned 404. [Metadata][r2]; [tarball][r2-tar] |
| Scramjet alpha67 and controller 0.0.14 | npm metadata and optional ZIP component manifests **AGPL-3.0-only**; no LICENSE/NOTICE member located in their exact tarballs; optional alpha67 source ZIP has no license-named member | SPDX declarations consistent, full license text/corresponding-source packaging still missing from Proxy2. [Core metadata][r67]; [controller metadata][rcontroller]; [ZIP component manifests][zip67] |
| BareMux 2.1.9 | registry license field absent; exact `package/LICENSE` has **MIT text**, copyright **2024 Mercury Workshop Inc.** | Preserve this actual copyright/permission notice, not a guessed SPDX from a missing field. [Metadata][rbm]; [tarball][rbm-tar] |
| Epoxy transport 2.1.28 | registry **AGPL-3.0-only**; no license-named tarball member found in the inspected wrapper package | Retain declaration and acquire corresponding license/source notices for wrapper and embedded Epoxy-TLS. [Metadata][re]; [bundle info L1487][epoxy-umd] |
| Libcurl transport 1.5.2 | registry **AGPL-3.0-only** and actual tarball LICENSE **AGPL v3**; embedded libcurl.js notice **LGPL v3**, plus listed C libraries | Keep wrapper and embedded-library notices separately. Embedded notice lists curl License, mbedtls Apache-2.0, cJSON MIT, zlib, brotli MIT, nghttp2 MIT. [Metadata][rcurl]; [tarball][rcurl-tar]; [bundle L5591–5602][curl-umd] |
| Wisp 0.4.1 | installed metadata/lock **AGPL-3.0**; full installed AGPL v3 text present | Server dependency is independently licensed. [Lock L12–16][s1-lock]; [LICENSE][wisp-license] |
| UV 3.2.10 | separate source ZIP manifest **MIT**, root LICENSE present | Retain UV's actual LICENSE and dependency notices when adding UV distribution. [UV ZIP][uv-zip] |
| Proxy2 hand-written glue | example manifests have no license field; no application-license file inventoried | Do not assign a license to extracted glue based on a vendor's package license or README attribution. [Stable manifest][s1-package]; [inventory][audit-output] |

### Inferences

- **P — version menu:** use immutable IDs `sj-1.1.0` (default), `sj-2.0.0-alpha`, `sj-2.0.2-alpha`, `sj-2.0.67-alpha.2`, `uv-3.2.10`; show release labels and transport capability per choice. All four requested Scramjet choices remain in the final design. Successful selection must await that adapter's own ready state. ([Integration contracts][s1-index]; [alpha0][s0-index]; [alpha2][s2-index]; [alpha67][s67-index])
- **P — distribution manifest:** a future build should record version, package tarball URL/integrity, local asset hash, license-source links and adaptation revision for every artifact. Never rebuild browser vendors accidentally from the Wisp-only example lock. Preserve exact file generations, especially `.wasm.wasm` versus `.wasm` and bundled-WASM alpha2. ([Example lock][s1-lock]; [npm metadata][r1]; [alpha2 inline WASM][s2-all]; [alpha67 assets][s67-config])
- **P — transport menus:** use bundled Epoxy as fixed legacy transport for alpha0; stable/alpha2 use BareMux modules; alpha67 uses direct transport through its adapter. Do not upgrade supplied Epoxy2/libcurl1 to newer direct transport families without adapting and retesting their contracts. ([alpha0 vendor][s0-all]; [stable setup][s1-index]; [alpha67 adapter][s67-index])

### Gaps

- Authentic npm bytes establish provenance, not website compatibility, release stability, licensed redistribution of the whole extracted application, or verified signature authenticity. No cryptographic npm signature/attestation verification was performed. ([Registry signature metadata][r1]; [comparison procedure][provenance-script])
- UV built assets were not supplied by Proxy2 and were not byte-matched against its npm tarball in this audit. UV evidence here is the separately supplied source ZIP and identified upstream worker source. ([Primary directory][primary-root]; [UV ZIP][uv-zip]; [UV source][uv-sw-source])
- No full preferred-form source/build archive for each vendored/transitively embedded library was assembled. Missing/conflicting notice evidence above needs resolution in the implementation distribution, not invented certainty. ([Exact package metadata][r1]; [alpha2][r2]; [alpha67][r67]; [libcurl embedded notice][curl-umd])

## 2. Are dedicated same-origin runtime pages and SW scopes sufficient, and what is the recommended topology?

### Takeaway

**Dedicated runtime pages and nonoverlapping SW scopes are necessary separation of execution and routing, but insufficient separation of data and transport discovery.** Preferred design: one engine-free outer browser shell plus one runtime **origin per engine/version and profile**, each owning its own proxy iframe and SW; a strict one-origin deployment requires explicit source-level namespacing across every relevant bundle/context. ([IDB origin model][mdn-idb]; [SW scopes][mdn-sw]; [stable DB][s1-all]; [BareMux][bm-index]; [controller DB/channel][s67-api])

### Cited Findings

#### Collision matrix: what a path/scope does and does not isolate

| Resource | Stock source behavior | Dedicated page / scope effect | Required isolation decision |
|---|---|---|---|
| JavaScript globals | Both old versions define the same `$scramjetLoad*` factories / `$scramjetVersion`; both newer cores define `$scramjet`; controller bundles define `$scramjetController`; examples define `PROXY_CONFIG`; BareMux `index.js` sets `globalThis.BareMux={}` | Separate Window realms prevent direct global overwrites; separate worker realms prevent import overwrites | Never load all versions in one common page or worker. Runtime page loads exactly one core and matching glue. [Stable][s1-all]; [alpha0][s0-all]; [alpha2][s2-all]; [controller][s67-api]; [BareMux L1][bm-index] |
| Scramjet cross-realm SingletonBox | Shared `Symbol.for("scramjet client global")`; stable/alpha0 reuse related parent/top/opener client boxes; alpha2/alpha67 recursively search accessible parent/top/opener and child frames | Separate Window globals do **not** by themselves prevent client-box reuse between accessible same-origin siblings | Separate origins block cross-origin object access; a single-origin fork must bind discovery to version/profile, not merely change globals in the host shell. [Stable L1 @5705][s1-all]; [alpha0 L2 @1719142][s0-all]; [alpha2 L1 @4918–5583][s2-all]; [alpha67 L1 @4878][s67-core] |
| SW registration | One registration per unique scope; same-scope registration updates it; most-specific scope controls a document | Distinct scopes prevent worker replacement and give each runtime a correct controller | Scope must contain **runtime owner page and proxied document paths**, not only target prefix. [MDN][mdn-sw]; [alpha67 controller setup][s67-index] |
| 1.1.0 / alpha0 engine config DB | Both hardcode `$scramjet`, DB version 1, object store `config`, key `config`; cookies use store/key `cookies` | **No isolation by pathname or SW scope** | Separate origin, or namespace every DB open/write/read in both engines. Changing only proxy prefix does not alter database identity. [Stable L4/L192][s1-all]; [alpha0 L5/L193][s0-all] |
| Other old-engine IDB state | Same DB also contains redirectTrackers/referrerPolicies/publicSuffixList; helpers open `$scramjet` independently | Same-origin versions can overwrite shared state even if config were split | Full engine DB namespace needed, not just config-key rename. [Stable L4 @58367][s1-all]; [alpha0 L22 @1787755/@1789449][s0-all] |
| Alpha67 controller cookies | Hardcoded `__scramjet_controller`, version 1; store `state`; key `cookies`; one updatedAt/string-cookie snapshot; BroadcastChannel `__scramjet_controller_channel` | Different random controller/frame IDs do **not** isolate saved jars or broadcasts | Separate profile origin, or namespace DB **and** channel and cookie propagation recipient set. [API L1 @6757/@7761][s67-api]; [ZIP controller source L94–97, L141][zip67] |
| Alpha67 SW cookie synchronization | `sendSetCookie` uses `self.clients.matchAll()` and sends `$controller$setCookie` to clients; it is not filtered by a profile token | An isolated registration reduces client set; stock API still shares persistent cookies across same-origin controllers | A different Controller instance alone is not a fresh/private profile. [SW bundle L1 @2092][s67-sw-bundle]; [API L1 @11483][s67-api] |
| BareMux active transport | SharedWorker `worker.js` has one active transport variable; all ports to that worker use it; `setTransport` replaces it | Different pages do not create per-tab transport state if worker identity is the same | Endpoint/transport setting must be version/profile-wide, or use separate workers plus explicit discovery isolation. [Worker L1][bm-worker]; [index `setTransport`][bm-index] |
| BareMux automatic discovery | `localStorage["bare-mux-path"]`; BroadcastChannel **`bare-mux`**; SharedWorker name **`bare-mux-worker`**; generic SW message **`getPort`** | Distinct script URLs can create different workers, **but do not namespace discovery keys/channel** | Separate origins preferred; otherwise namespace all discovery paths, names/messages and filter SW client responders. [Index L1 @537/@1513/@2014/@2448][bm-index] |
| Stable embedded BareMux | 1.1.0 runtime internally contains BareMux transport/discovery implementation in addition to separately loaded BareMux UMD | Patching only external `vendor/baremux/index.js` leaves engine-internal discovery unchanged | Namespace/rebuild engine embedded dependency as well as external UMD/worker, or use origin isolation. [Stable L192 @95901/@97595][s1-all] |
| Website local/sessionStorage | All four cores prefix by **logical target host + `@`**, not engine/profile; scheme absent from this host key | Same target through different same-origin runtimes hits identical keys | Separate version/profile origin or add engine/profile namespace in storage hooks. [Stable L1 @26767][s1-all]; [alpha0 L2 @1738914][s0-all]; [alpha2 L18 @25639][s2-all]; [alpha67 L18 @29183][s67-core] |
| Website IndexedDB | All four hook `IDBFactory.prototype.open` with **logical target origin + `@` + requested name** | Site isolation emulation, **not version/profile isolation**; same logical site across engines collides | Namespace site DB opens plus matching name/deletion/enumeration behavior, or isolate origin. [Stable L4 @40861][s1-all]; [alpha0 L5 @1753075][s0-all]; [alpha2 L21 @38566][s2-all]; [alpha67 L18 @40302][s67-core] |
| Website caches / OPFS | Cache names prefix logical target origin; StorageManager.getDirectory uses target-origin-derived directory | Same logical site can collide across versions/profiles at one browser origin | Include these in profile isolation, not merely cookie DBs. [Stable L1 @32408, L4 after @40861][s1-all]; [alpha2 L18 @30158/L21 after @38566][s2-all]; [alpha67 L18 @33144/after @40302][s67-core] |
| App libraries/preferences | No app bookmarks/history/profile DB exists in Proxy2 | New outer-shell data can be distinctly keyed | App-owned records must be independent of vendor jars and website storage. [All minimal indexes][s1-index]; [alpha2 index][s2-index]; [alpha67 index][s67-index] |

IndexedDB is same-origin storage. A service-worker **scope is a control/routing range**, not an IndexedDB partition. SharedWorkers can be shared by same-origin pages/iframes; path changes matter to script identity, but BareMux's origin-wide discovery layer still matters. ([MDN IndexedDB][mdn-idb]; [MDN registration][mdn-sw]; [MDN SharedWorker][mdn-sharedworker]; [BareMux source][bm-index])

#### BareMux “global singleton”: precise interpretation

It is not one unavoidable singleton across the entire browser: each distinct runtime **origin**, and potentially each distinct worker-script identity, can have its own worker. In this distribution, however, a worker holds **one selected transport**, and the library's **default discovery** is effectively shared at an origin level. ([Worker][bm-worker]; [discovery][bm-index]; [SharedWorker origin restriction][mdn-sharedworker])

Specific failure mechanism on one origin:

1. Stable opens `/runtime/sj110/vendor/baremux/worker.js`, and writes that URL to `bare-mux-path`.
2. Alpha2 opens `/runtime/sj202/vendor/baremux/worker.js`, and overwrites the same key.
3. New default BareClients use whichever worker URL is stored; existing clients may retain old ports. On `refreshPort`, the SW library scans window clients using `includeUncontrolled:true`, requests generic `getPort`, and accepts a responding port.
4. Because the scan is not filtered by version/profile, a SW can obtain another runtime's transport. UV's BareMux path becomes a third participant if colocated.

This is a source-supported **collision scenario**, not a reproduced multi-tab browser race. Choosing a single shared worker intentionally would avoid competing worker paths but would instead make endpoint/transport changes affect the whole shared pool; it still would not isolate cookies/site storage. ([Index L1 @537–2649][bm-index]; [stable embedded discovery L192][s1-all]; [worker singleton][bm-worker]; [UV BareClient usage][uv-sw-source])

#### Root-path relocation audit

All four supplied examples assume their folder is the **server's URL root**, even though the local filesystem has four siblings. Simply mounting each folder at `/runtime/<version>/` does not satisfy the hardcoded references. ([Four servers L15–16/L37–44][s1-server]; [alpha0 server][s0-server]; [alpha2 server][s2-server]; [alpha67 server][s67-server])

| Source | Root references needing a deployment-specific value |
|---|---|
| Every config | `/wisp/` derived from `location.host`; `/network/` target prefix. [Stable L9–27][s1-config]; [alpha0 L11–20][s0-config]; [alpha2 L9–37][s2-config]; [alpha67 L10–38][s67-config] |
| Stable shell/SW | `files.wasm/all/sync` = `/vendor/…`; BareMux worker `/vendor/baremux/worker.js`; transport `/vendor/epoxy/index.mjs`; SW `importScripts("/vendor/scramjet.all.js")`. [Index L39–55][s1-index]; [SW L8][s1-sw] |
| Alpha0 shell/SW | Same `/vendor/…` paths and SW import; built-in `wisp` must be an absolute valid ws(s) URL. [Index L42–49][s0-index]; [SW L8][s0-sw]; [vendor `initEpoxy`][s0-all] |
| Alpha2 shell/SW/client | `/vendor/baremux/…`, `/vendor/scramjet_bundled.js`, `/client.js`; SW relative config load is sound only at the proper runtime location; proxied client needs its own injected config, not the SW's global. [Config L34–37][s2-config]; [SW L17–19][s2-sw]; [client L85–96][s2-client] |
| Alpha67 shell/SW | Config overrides `/vendor/scramjet.js`, `/vendor/scramjet.wasm`, `/vendor/controller.inject.js`; SW imports `/vendor/controller.sw.js`; dynamic transport load is relative `./vendor/<name>/index.js`. [Config L36–38][s67-config]; [index L71][s67-index]; [SW L7][s67-sw] |
| Old runtime defaults | `/scramjet/`, `/scramjet.wasm.wasm`, `/scramjet.all.js`, `/scramjet.sync.js`; alpha0 additionally default `/wisp/`. Supplied controllers override files/prefix, so these defaults are not all active in standalone examples. [Stable L4 @56724–57176][s1-all]; [alpha0 L5 @1768889–1769357][s0-all] |
| Alpha0 bundled transport fallback | Bundler module **3465**, **L2 @1718462**, contains `publicPath + "507621c43f70fc86.wasm"`; fallback initializer references it at **L1 @1701894**. That filename is not supplied. However exported initializer **`x=u`** at L2 @1713412 uses function `u`, which sets its module input from inline base64 WASM at L1 @11197 before reaching the fallback. Record it as a **dormant fallback**, not a demonstrated missing-asset failure in the default path. Automatic publicPath follows script/worker location at L193 @1897200. [Actual bundle][s0-all] |
| Alpha67 controller defaults | `/~/sj/`, `/scramjet/scramjet.js`, `/controller/controller.inject.js`, `/scramjet/scramjet.wasm`; relative `virtualWasmPath:"scramjet.wasm.js"` generated under live frame route. Supplied page overrides defaults; retain virtual route behavior. [API L1 @5739–5873][s67-api] |
| All standalone servers | Static URL `/` maps only root index; upgraded `/wisp` or paths starting `/wisp/` dispatch to Wisp. No multi-version mount router exists. [Every server L28–66][s1-server]; [alpha0][s0-server]; [alpha2][s2-server]; [alpha67][s67-server] |

All four absolute `/network/` paths would collide on one origin, as would `/vendor/scramjet.all.js` between the two old versions and `/sw.js` if each example were flattened to root. The sibling filesystem names do not themselves namespace web URLs. ([Configs][s1-config]; [alpha0 config][s0-config]; [all factory SW import][s1-sw]; [alpha0 SW import][s0-sw]; [scope rules][mdn-sw])

### Inferences

#### P — exact preferred runtime topology

Use **one product UI**, with separate runtime origins implementing adapters. The following are exact proposed conventions using reserved illustrative names; no DNS/hosting is provisioned:

| Owner | Proposed origin | Owned paths / scope |
|---|---|---|
| Outer app | `https://proxy.example/` | Browser chrome, app tabs, engine selector, search, bookmarks, visits, recovery, preferences; **no vendor proxy SW or engine core** |
| Stable runtime, profile `pdefault` | `https://sj110-pdefault.runtime.proxy.example/` | `/runtime/index.html`, `/runtime/config.js`, `/runtime/sw.js` **scope `/runtime/`**, `/runtime/vendor/*`, target prefix `/runtime/network/` |
| Alpha0 runtime | `https://sj200-pdefault.runtime.proxy.example/` | Same path convention, alpha0-only bundles and config |
| Alpha2 runtime | `https://sj202-pdefault.runtime.proxy.example/` | Same path convention, alpha2-only bundles; additionally `/runtime/client.js` and correctly injected bootstrap config |
| Alpha67 runtime | `https://sj2067a2-pdefault.runtime.proxy.example/` | Same path convention, alpha67/controller 0.0.14; target prefix internally becomes `/runtime/network/<controllerId>/<frameId>/…` |
| UV runtime | `https://uv3210-pdefault.runtime.proxy.example/` | Same runtime scope; UV assets under `/runtime/vendor/uv/`, UV target prefix `/runtime/network/` on **its own origin** |
| Network backend | `wss://relay.proxy.example/wisp/` | Owned Wisp service, explicitly configured rather than inferred from each runtime host |

Rationale: this keeps the proposed dedicated shell pages/SW scopes while using origins to separate hardcoded IndexedDB, localStorage and channels. Different origins can use identical vendor DB names without colliding; app state stays on the outer origin. A shared backend process can route static content by Host and expose the relay separately; independent browser origins do not require five independent server processes. ([Origin storage semantics][mdn-idb]; [BareMux origin restriction][mdn-sharedworker]; [actual config][s1-config]; [controller persistence][s67-api])

**Runtime ownership contract:** each app tab owns one outer runtime iframe. That runtime page owns a second, inner proxy iframe and exactly one version's controller/glue. The controller must remain in the runtime page: alpha67 performs request rewriting/RPC there; moving the Controller into an invisible shared top-level shell changes its location/scope assumptions. Keep inactive tabs' owning runtime alive if their live page is expected to continue; lazy restore creates a fresh runtime and reopens a canonical URL. ([Alpha67 index L75–79/L130–132][s67-index]; [controller/frame prefixes and RPC][s67-api]; [SW lookup][s67-sw-bundle])

**Required alpha0 embedding adaptation:** its client constructor probes `Symbol in global.parent`, then `Symbol in global.top`, then `global.opener` **without try/catch**, unlike stable's guarded probes and the newer recursive searches. In the proposed cross-origin nesting, the inner page's parent is its same-origin runtime owner, but its top is the different outer-app origin. Treat those unguarded cross-origin probes as an embedding blocker requiring guarded access in a documented alpha0 runtime adaptation and a browser proof. This finding does not invalidate origin isolation; it means the preferred iframe topology is **not a claim that pristine alpha0 will run cross-origin without adaptation**. Until that adaptation is validated, its isolated top-level runtime page is the source-compatible proof harness (not an additional finished-product mode). ([Alpha0 L2 @1719142][s0-all]; [stable guarded constructor L1 @5705][s1-all]; [cross-origin restrictions][mdn-postmessage])

Multiple tabs of the **same version and profile** may intentionally share that runtime origin: cookies/site storage and BareMux transport are then profile-level, while frames/history are tab-level. A second profile uses five different runtime hostnames, e.g. `sj110-pwork.runtime.proxy.example`. A random controller/frame ID or a new JS CookieJar by itself is not a complete profile boundary. ([Old DB][s1-all]; [controller saved-cookie merge/channel][s67-api]; [site hooks][s67-core]; [BareMux worker][bm-worker])

**No opaque-origin sandbox as an isolation substitute:** a runtime that loses its usable origin cannot register its normal same-origin SW/storage. Exact embedding headers, frame permissions, storage partitioning and browser support still require implementation validation. If enabling cross-origin isolation, the outer shell and runtime response policies must permit this cross-origin embedding; add appropriate CORP/COEP and cross-origin-isolated permission delegation where needed, then measure `crossOriginIsolated` in actual contexts. Do not copy an override that only assigns a fake boolean. ([Registration requirements][mdn-sw]; [SharedArrayBuffer/COOP/COEP][mdn-postmessage]; [supplied sync-XHR uses][s1-all])

#### P — strict single-origin variant: required adaptations, not a ready-made option

If one origin is a hard deployment requirement, retain the exact separate runtime owner-page model but use these paths:

```text
/app/                         outer UI, scope-free from proxy engines
/runtime/pdefault/sj110/       owner page, sw.js, vendor/*, network/*
/runtime/pdefault/sj200/       owner page, sw.js, vendor/*, network/*
/runtime/pdefault/sj202/       owner page, sw.js, client.js, vendor/*, network/*
/runtime/pdefault/sj2067a2/    owner page, sw.js, vendor/*, network/*
/runtime/pdefault/uv3210/      owner page, sw.js, vendor/*, network/*
```

For every runtime, SW scope is **that whole runtime directory**, and target prefix is that directory plus `network/`. The outer `/app/` page should not register a competing root proxy dispatcher. This design solves routing/global collisions but **becomes viable only with the following additional data/transport adaptations**. ([SW registration rules][mdn-sw]; [root path assumptions][s1-sw]; [alpha67 controlled-page contract][s67-index])

1. Rebuild/fork old engines with engine/profile-specific DB names, such as `ojjyproxy:engine:pdefault:sj-1.1.0`, at **every** config/cookie/redirect/referrer/PSL opener. The stock config contract has no demonstrated working `dbName` switch; adding an unused property does not rename the hardcoded database. ([Stable DB open/load][s1-all]; [alpha0 helper opens][s0-all])
2. Namespace BareMux discovery as `ojjyproxy:baremux:pdefault:sj-1.1.0:path`, channel `ojjyproxy:baremux:pdefault:sj-1.1.0`, unique worker identity, and profile/version-specific `getPort` protocol. Filter candidate SW clients to the owning runtime prefix. Apply this consistently to shell UMD, worker, injected clients, and **stable's embedded** BareMux; do not assume a new worker URL alone is enough. ([BareMux discovery][bm-index]; [embedded implementation][s1-all])
3. Namespace alpha67 `__scramjet_controller` and `__scramjet_controller_channel`, including live cookie propagation to only its profile/version recipients. This needs controller-source adaptation; stock `config.prefix` is not a cookie DB namespace. ([API persistence/channel][s67-api]; [SW recipients][s67-sw-bundle])
4. Namespace website storage across all engines: local/sessionStorage keys, site IndexedDB and matching exposed-name/delete/enumerate behavior, CacheStorage and OPFS. Retain target-origin distinctions beneath the version/profile namespace. ([Site IDB/storage/cache hooks][s1-all]; [alpha2][s2-all]; [alpha67][s67-core])
   Also bind Scramjet SingletonBox/frame-symbol discovery to the engine/profile. Alpha2 and alpha67 can walk from the target window to the common top and into accessible sibling runtime frames and reuse another client's box. A JS realm is not enough to defeat that explicit cross-realm search. ([Alpha2 constructor L1 @4918–5583][s2-all]; [alpha67 constructor L1 @4878][s67-core])
5. Repair alpha2 CookieJar lifetime and synchronization, then add its own engine/profile persistence if sessions are to survive SW suspension. Namespace UV's `__op` and website stores in its adapter/build too. ([Alpha2 SW jar][s2-sw]; [alpha2 client jar][s2-client]; [UV cookie DB][uv-cookie-source])
6. All new artifacts must retain original package identity/version plus an explicit **ojjyProxy adaptation revision**, hashes and corresponding source changes. The originals stay reference inputs. ([Exact npm-byte manifest][provenance-script]; [license conflicts][r1]; [controller license][rcontroller])

**Verdict:** same-origin scopes alone fail the isolation requirement. A source-adapted one-origin deployment can be engineered; separate origins are the preferred first implementation because they remove the highest-risk shared namespaces without rewriting every vendor storage layer. This is a topology recommendation grounded in source, not a browser-proven deployment. ([IDB boundary][mdn-idb]; [old DB][s1-all]; [BareMux discovery][bm-index]; [controller DB/channel][s67-api])

#### P — preferred app data isolation and canonical state

Use an outer-shell IndexedDB **`ojjyproxy-app-v1`** with separately managed stores for `profiles`, `bookmarks`, `visits`, `tabSnapshots`, and `preferences`. A small pre-paint localStorage record may use **`ojjyproxy:preferences:v1`**. Keys should include profile ID where the product supports different libraries; tab snapshots use `(profileId, tabId)`. These are proposed keys; no such app data exists in Proxy2. ([Minimal shell][s1-index]; [alpha67 minimal shell][s67-index]; [IDB capabilities][mdn-idb])

Proposed snapshot fields:

```text
{schemaVersion, profileId, tabId, engineId, engineVersion,
 requestedTargetUrl, committedTargetUrl, title,
 navigationId, runtimeGeneration, lastActiveAt}
```

Engine origin is determined from a fixed deployment registry, not from arbitrary incoming messages. **Store canonical absolute HTTP(S) URLs**, never `/network/` routes, controller IDs, MessagePorts or UV XOR encodings. The application can transfer URLs between adapters, while engine cookies/site storage remain isolated. ([Stable encode/decode][s1-all]; [alpha2 codec][s2-all]; [alpha67 generated prefixes][s67-api]; [UV config][uv-zip])

Separate clear operations: app history; app recovery; bookmarks; runtime cookies; runtime website storage; response caches; diagnostic logs. Avoid a blanket origin `localStorage.clear()`/database deletion on a one-origin app. On preferred multi-origin topology, resetting runtime data affects that version/profile pool, not outer bookmarks. A “don't save visits” option is not a fresh isolated cookie profile. ([Origin-wide DB behavior][mdn-idb]; [controller persistence][s67-api]; [website storage hooks][s67-core])

### Gaps

- No same-origin concurrency test or cross-origin embedded-runtime browser test was performed. The collision matrix is source-verified; the recommended host topology and adapted namespace names are proposed. ([Source discovery][bm-index]; [source controller][s67-api]; [test procedure][checks-script])
- Browser storage partitioning, policies for nested cross-origin frames, worker lifetime/revival and cross-origin isolation need proof in target browsers. Different profiles require actual origins or complete namespaces, not merely an interface label. ([SharedWorker behavior][mdn-sharedworker]; [IDB origin model][mdn-idb]; [SW controller setup][s67-index])
- A fully ephemeral/private profile has not been established: even a unique runtime origin can leave persistent data until cleared. Do not promise that closing a frame automatically erases databases, caches or website storage. ([Persistent databases][s67-api]; [site caches][s67-core])

## 3. What must the final browser implement for startup, injection, search, navigation and verification?

### Takeaway

Canonical URL transfer and native frame navigation are supported by the underlying APIs, but Proxy2 is a set of minimal Go-button examples, not a tabbed browser/history product. The most immediate adapter repair is alpha2's missing **injected config bootstrap**, followed by cookie/worker semantics and explicit readiness for every version. ([Four UI examples][s1-index]; [alpha0][s0-index]; [alpha2][s2-index]; [alpha67][s67-index]; [alpha2 injected client][s2-client])

### Cited Findings

#### Startup audit and readiness contract

| Choice | Source-found sequence and limitation | Required blueprint sequence |
|---|---|---|
| Stable | `controller.init()` at **index L47 is not awaited**; BareMux setTransport is awaited; register/ready awaited; submit listener installed later. init is actually async and writes IDB. [Index][s1-index]; [vendor L4 @57607][s1-all] | Await config DB initialization before any request; register exact runtime SW, await correct active worker and runtime-page control; establish BareMux transport; verify adapter handshake/config presence; enable Go. |
| Alpha0 | `controller.init()` at **index L51 not awaited**; register/ready awaited; no BareMux. SW loads config and lazily calls `initEpoxy()` before fetch. [Index][s0-index]; [vendor L193 @1808638][s0-all] | Await engine config write, correct worker control, and validate full ws(s) endpoint; treat embedded Epoxy init as its own stage. No fictitious BareMux transport selection. |
| Alpha2 | BareMux setTransport → SW register/ready → direct iframe navigation. No client-bootstrap/config verification; no cookie synchronization; `transport.ready:true` means adapter shim readiness, not relay health. [Index L35–58][s2-index]; [SW L40–43][s2-sw]; [client L45–48][s2-client] | Complete document/worker bootstrap and cookie contract, then transport and correct SW control. Surface initialization failures before claiming ready. |
| Alpha67 | register; if no controller, waits for controllerchange **or a 10s timeout**; chooses `navigator.serviceWorker.controller ?? registration.active`; loads transport; new Controller → wait. Existing controller isn't checked for matching script; timeout can resolve without correct control. [Index L51–79][s67-index] | Validate expected `registration.scope` and controller scriptURL; wait for activation/control with rejecting timeout; load matched core/controller; initialize selected direct transport; construct/await Controller; enable navigation. |

`navigator.serviceWorker.ready` and worker registration do not establish transport connectivity or successful website loading. For alpha67, `.wait()` waits its readiness Promise (RPC ready, WASM load, saved cookies) and **does not itself initialize/test the relay transport**. The core's transport fetch wrapper lazily calls `transport.init()` if not ready. Therefore the supplied alpha67 adapter is not proven broken merely because there is no explicit pre-init call; explicit awaited transport init is recommended for deterministic startup/status. ([API L1 @11121/@13372][s67-api]; [core L30 @108552][s67-core]; [Epoxy init L1514–1520][epoxy-umd])

BareMux `setTransport` instantiates/sets a transport, while worker fetch/WebSocket handlers lazily call `init()` when `ready` is false. Its returned set acknowledgment is **not a successful relay fetch probe**. This matters to UI labels: `configured`, `engine ready`, `transport initialized`, and `remote response received` are separate signals. ([Worker L1 `set`/`fetch`/`websocket` branches][bm-worker]; [UMD setTransport][bm-index])

All supplied indexes initialize eagerly and install submit handlers only after asynchronous setup. Before that, the form's inline `onsubmit="return false"` suppresses navigation but has no queued intent/error status. They set `status.textContent="Loading..."` on submit but have **no completed/error status wiring**. There is no startup catch/retry/capability panel. ([Stable index L24/L34–86][s1-index]; [alpha0 L25/L35–81][s0-index]; [alpha2 L23/L33–73][s2-index]; [alpha67 L30/L40–147][s67-index])

#### Critical alpha2 injection bootstrap: code-level audit

**`client.js` exists.** It is 3,729 bytes and passed syntax/local HTTP serving checks. An early intermediate claim of absence resulted from a truncated broad file listing and was corrected; it is **not** a final finding. The substantive defect is config availability in the proxied page. ([Actual file L1–123][s2-client]; [test procedure][checks-script])

1. **F — SW config exists in the SW realm.** SW L17 imports `./config.js`. Shell L17 separately loads it in the host realm. Neither operation creates that global in a newly navigated proxied document. ([SW][s2-sw]; [index][s2-index])
2. **F — document injection omits it.** Config L34–37 injects only `/vendor/baremux/index.js`, `/vendor/scramjet_bundled.js`, `/client.js`. SW `getInjectScripts` simply maps those URLs to script nodes. There is no injected `config.js` or inline serialized `PROXY_CONFIG` before `client.js`. ([Config][s2-config]; [SW L83–90][s2-sw])
3. **F — client dereferences missing global.** `createContext()` uses `new URL(PROXY_CONFIG.prefix, self.location.origin)` at client L88, and uses `PROXY_CONFIG.injectScripts` at L93; invoked while constructing the top client at L116–121. Runtime does not provide this example-specific global. ([Client][s2-client]; [runtime exports][s2-all])
4. **T — stubbed execution confirms the reference path.** Node VM with `URL`, stub BareMux and stub runtime, but no `PROXY_CONFIG`, executing the real client file produced **`ReferenceError: PROXY_CONFIG is not defined`**. This is a controlled bootstrap probe, **not a browser-run page**. Earlier probe failures for missing VM `URL`/`WebSocket`/`URLSearchParams` were harness-stub defects and were corrected; final export/codec probes passed. ([Probe script][runtime-probe])
5. **F — initialization latch is set before success.** `__scramjetExampleClientReady=true` at client L13 precedes context construction/hooking; a thrown error can leave the flag set and suppress retry in that realm. ([Client L10–17][s2-client])
6. **F — workers receive no bootstrap.** Both SW and client `getWorkerInjectScripts()` return an empty string. Yet runtime `rewriteWorkers` prepends precisely that hook's output, and client hooks recursively expect `hookSubcontext`. No proof establishes functional dedicated/shared/website SW execution with this empty bootstrap. ([SW L89–91][s2-sw]; [client L95–110][s2-client]; [runtime L32 @73658][s2-all])
7. **F — cookie jars are disconnected.** SW has one `new CookieJar()`; each document client creates another empty jar. SW response Set-Cookie updates SW jar; client `sendSetCookie` only changes client jar. There is no jar snapshot injected, message sync or persistent write. SW jar survives only that worker lifetime. This loses server cookies in document.cookie and client-written cookies in subsequent SW requests unless new glue is added. ([SW L22–23/L93/L101][s2-sw]; [client L16–17/L41–43/L99][s2-client])
8. **F — missing request metadata / redundant decode.** SW constructs `target` by decoding pathname at L114, supplies it as fallback referrer, but does not populate `rawClientUrl`. Runtime uses rawClientUrl for origin/referer calculation and handles internal query parameters/form fields itself. The SW's up-front URL decode can reject raw `blob:`/`data:` virtual paths before FetchHandler handles them. These are limited paths requiring adaptation tests, not blanket claims that all navigation fails. ([SW L106–130][s2-sw]; [runtime L21 @53948/@55398/@56463][s2-all])
9. **F — header conversion warrants proof.** The alpha2 transport turns request header pairs into an object and response raw-header object into entries; this may coalesce duplicate request headers and must preserve repeated Set-Cookie values/response pair shape correctly. No multi-cookie/POST streaming test was run. Alpha67 instead explicitly flattens array-valued response headers. ([SW L26–36/L63–75][s2-sw]; [client L19–37/L68–80][s2-client]; [alpha67 L95–110][s67-index])

**P — repair specification:** inject a complete version/profile-specific context bootstrap before the client; serialize cookie snapshot and matching prefix/codec/config into every document; synchronize CookieJar changes between clients and SW with persistence and lifetime recovery; initialize dedicated/shared workers with the same runtime/transport/context; set the init flag only after success; preserve request raw URL/client/referrer/form metadata; route virtual blob/data correctly; validate all constructor/transport/header signatures against **this** alpha2 export set. Loading alpha67 `controller.inject.js` into alpha2 is not a fix: that controller expects a different core. ([Alpha2 client/options][s2-all]; [alpha2 glue][s2-sw]; [alpha67 exact version guard][s67-api])

#### Alpha67 transport/header and live-route particulars

- The supplied adapter's **response** header normalization is intentional: Epoxy returns `rawHeaders` as an object; libcurl returns object properties with arrays; the controller/core expect pair arrays. `flattenHeaders` expands arrays rather than stringifying them. Retain it unless a future transport API directly returns the required shape. ([Index L81–110][s67-index]; [Epoxy L1524–1533][epoxy-umd]; [libcurl L6443–6463][curl-umd])
- Epoxy's wrapper `request` accepts a `signal` argument but does not pass it into its `client.fetch` options. Therefore cancel/Stop is not proven by the function signature; libcurl does pass signal to session fetch. Request header and destination WebSocket header conversion still need tests for the precise pair-array/native transport interfaces. ([Epoxy L1524–1551][epoxy-umd]; [libcurl L6443–6449/L6466–6469][curl-umd])
- The controller creates base + random controller ID, and Frame appends random frame ID. SW lookup/RPC routes depend on the live owning controller/frame; the virtual WASM script is generated there. Do not persist the internal encoded route as a bookmark or use it as a version-switch payload. ([API L1 @10928/@12305/L40][s67-api]; [SW bundle L1 @3115–3605][s67-sw-bundle])
- The README's libcurl global name `LcMod` is wrong for the supplied UMD; actual global is **`CurlMod`**, matching index code. This is one reason README-only integration would be unreliable. ([README L89–93][primary-readme]; [index L86][s67-index]; [bundle L1][curl-umd])

#### Search handling is present, but not a robust shared omnibox

All four actual indexes contain the same policy: trim; empty → `https://example.com`; accept anything parsed by `new URL(text)`; otherwise prepend `https://` and accept a hostname containing a dot; else **Google search** with `encodeURIComponent`. This corrects any claim that Proxy2 only prepends a scheme or has no search. It also means the supplied default is Google, not an inherited default from earlier research. ([Stable L75–85][s1-index]; [alpha0 L70–80][s0-index]; [alpha2 L62–72][s2-index]; [alpha67 L136–146][s67-index])

**T — executed pure parser results** (same in all four, extracted function run in Node, not browser navigation):

| Input | Actual result |
|---|---|
| `hello world` | `https://www.google.com/search?q=hello%20world` |
| `example.com/a?x=1#frag` | `https://example.com/a?x=1#frag` |
| `127.0.0.1:8000/a` | `https://127.0.0.1:8000/a` |
| `localhost:3000` | **`localhost:3000`** accepted as a URL with custom scheme, not normalized HTTPS |
| `javascript:alert(1)` | **`javascript:alert(1)`**, unrestricted explicit scheme |
| `data:text/html,hello` | **`data:text/html,hello`** |
| `foo.bar terms` | Google query `foo.bar%20terms` |
| empty | `https://example.com` |

Evidence: [extracted-parser check procedure][checks-script] and each actual source parser above. This is not a website compatibility test or proof of a security exploit.

**P — one outer parser/provider registry:** recognize explicit HTTP(S), bare domain/IP/port/path, and queries; reject unsupported explicit schemes; do not accept `localhost:` as an arbitrary scheme by accident. Keep the search-provider default an explicit product decision; Proxy2's implemented default is Google. Resolve a search query to a canonical destination once, then pass that destination to the selected adapter. Reuse the same parser for all five choices. ([Actual parser][s1-index]; [alpha2 direct navigation][s2-index]; [stable bypass of non-HTTP encode][s1-all])

#### Navigation/history capability matrix

| Choice | Available primitives in actual engine code | What Proxy2 UI implements / what must be added |
|---|---|---|
| Stable | Frame `go`, `back`, `forward`, `reload`; `frame.url` via client; EventTarget `navigate`/`urlchange`; encode/decode | UI only Go; no back/forward buttons or URL event listeners, no visited-sites database. Adapter can build on events and frame.url. [Vendor L4 @59112–59703][s1-all]; [index][s1-index] |
| Alpha0 | Same frame primitives and URL events, independent old-generation runtime | Same Go-only UI. [Vendor L5 @1772047][s0-all]; [index][s0-index] |
| Alpha2 | Core ScramjetClient URL property; old event types and frame Symbol hooks; rewrite/unrewrite helpers; no controller wrapper | Current host only assigns iframe.src. A Frame/EventTarget bridge and URL reporting must be written, after bootstrap is repaired; a bare iframe can request native history traversal, but reliable URL/title/events are not supplied. [Core L1 @8396/L18 @27215/L32 exports][s2-all]; [index L51–58][s2-index] |
| Alpha67 | Frame `back`, `forward`, `reload`, `go`; init/fetch/error hooks; `client.url`; separate **UrlWatcherPlugin** in source `packages/utils`, not a Frame `.watchUrl()` built-in in supplied API | Go-only UI; title/URL watchers must be added. Pinned utils source can guide reporting, but its built bundle is not supplied here. [API L40][s67-api]; [ZIP `packages/utils/src/url-watcher.ts`][zip67]; [index][s67-index] |
| UV | Config encoder/decoder and engine page hooks; native iframe history; no supplied Proxy2 UV shell | Add its own canonical URL/reporting bridge and navigation adapter; do not assume Scramjet frame methods. [UV config ZIP][uv-zip]; [UV SW source][uv-sw-source] |

These frame back/forward methods delegate to **inner iframe `history.back()/forward()`**, not outer application visits. There is no verified `canGoBack`/`canGoForward` API in the supplied controller/frame signatures. Native site history, outer browser session history and an app visit ledger are separate. A rebuilt frame after changing version starts a different live site-history domain even if the app ledger persists. ([Stable frame][s1-all]; [alpha0 frame][s0-all]; [alpha67 Frame][s67-api])

#### Canonical transfer: verified mechanism and proposed bridge

**F/T — canonical URL transfer is possible.** Stable/alpha0 expose engine encode/decode and Frame go; alpha2/alpha67 export rewriteUrl/unrewriteUrl. Stubbed core probes used `https://example.com/a?x=1#frag` with proposed prefix `https://proxy.example/runtime/network/`:

```text
alpha2 rewrite:
https://proxy.example/runtime/network/https%3A%2F%2Fexample.com%2Fa%3Fx%3D1#frag
alpha2 unrewrite: https://example.com/a?x=1#frag

alpha67 rewrite:
https://proxy.example/runtime/network/https%3A%2F%2Fexample.com%2Fa%3Fx%3D1?%24io=https%3A%2F%2Fexample.com#frag
alpha67 unrewrite: https://example.com/a?x=1#frag
```

This proves the **pure-code codec round trip in the VM** for this input, not live redirect/SPA coverage. Alpha67's internal `$io` metadata and generated IDs show why regex-stripping prefixes is inferior to adapter/runtime decoding. Alpha2's shell currently encodes the *whole* input including fragment into its pathname, unlike the runtime helper's external hash placement; use its real rewrite/unrewrite helpers for consistent navigation rather than standardizing on that hand-built route. ([Probe][runtime-probe]; [alpha2 shell L55–58][s2-index]; [alpha2 helpers][s2-all]; [alpha67 helpers][s67-core])

**P — outer/runtime bridge:** send a versioned message envelope containing `tabId`, `profileId`, `engineId`, `runtimeGeneration`, `navigationId`, command and canonical `targetUrl`. A runtime READY signal should include observed core/controller versions, SW scope/script and capabilities. For the initial channel, verify **exact runtime origin and `event.source === runtimeIframe.contentWindow`**, then transfer a dedicated MessagePort. Runtime URL/title/error messages use the same generation/navigation tokens; reject stale messages after engine switches. Never send commands directly to the proxied page's rewritten `postMessage` hooks or expose vendor RPC objects to the outer UI. ([Cross-origin messaging mechanism][mdn-postmessage]; [engine hooks/message rewriting][s67-core]; [live controller RPC][s67-api])

A version change keeps `committedTargetUrl`, initializes a new selected runtime, and issues its adapter's native `go(targetUrl)`/UV encoder equivalent. Preserve bookmarks and visits in the outer app; leave site cookies/storage in the version/profile runtime. Switching is a fresh navigation: no automatic POST replay, transfer of in-memory forms/sockets, native history serialization or cross-engine login migration is established. ([Frame navigation][s67-api]; [distinct engine cookie stores][s1-all]; [alpha2 jars][s2-sw]; [UV cookie DB][uv-cookie-source])

#### Server audit: what the reference does and what it cannot establish

All four `server.mjs` files use the same Node static/Wisp server pattern, differing in folder-root/port/log label: defaults **8100, 8200, 8300, 8400**. They import `@mercuryworkshop/wisp-js/server`, serve `.js/.mjs` as JavaScript and `.wasm` as `application/wasm`, emit `cache-control:no-store`, and route WebSocket upgrades at `/wisp` or `/wisp/…`. There is no implemented Deno server, engine chooser backend, profile API or origin/mount dispatcher. ([Stable server L15–26/L51–66][s1-server]; [alpha0][s0-server]; [alpha2][s2-server]; [alpha67][s67-server])

The server serves files anywhere in the example root (subject to its path check), so the prototype static root includes source manifests and `node_modules`. Its boundary test is only `filePath.startsWith(root)` rather than a segment-safe relative-path check. This should be replaced by explicit deployment asset routes/validated containment when building a unified server; no traversal exploit was executed. It lacks COOP/COEP response headers; local HTTP checks confirmed their absence. Secure-context SW/WASM feature behavior must be checked independently. ([Server L28–54][s1-server]; [syntax/HTTP procedure][checks-script]; [SW secure context][mdn-sw]; [isolation headers][mdn-postmessage])

#### Major blockers / concrete decisions

| Priority | Finding | Required action before claiming integrated browsing |
|---|---|---|
| **1 — same-origin collision** | Old versions share `$scramjet/config`; all versions' logical site storage lacks version/profile namespace | Adopt preferred per-version/profile origins, or implement all source-level namespaces. [Stable DB][s1-all]; [alpha0 DB][s0-all]; [site hooks][s67-core] |
| **1 — alpha2 bootstrap** | PROXY_CONFIG isn't injected; client throws on context creation | Repair config/context injection and initialization latch. [Config][s2-config]; [client][s2-client]; [stub probe][runtime-probe] |
| **1 — alpha2 state/worker completeness** | Disconnected volatile jars; no worker bootstrap | Define and implement page/SW cookie persistence/sync and worker transport/bootstrap before treating this as a functioning selectable adapter. [SW][s2-sw]; [client][s2-client] |
| **1 — BareMux isolation** | Fixed origin-wide key/channel/getPort discovery; one transport per worker | Origin isolation preferred; otherwise rebuild all copies consistently. [BareMux][bm-index]; [stable embedded][s1-all] |
| **2 — topology and paths** | Every standalone example assumes root `/vendor`, `/network`, `/wisp` | Dedicated owner pages/scopes with deployment asset registry; no flattened root imports. [Configs][s1-config]; [alpha67 config][s67-config]; [SW imports][s67-sw] |
| **2 — cross-realm client/embedding** | Newer cores can reuse same-origin sibling SingletonBoxes; alpha0 probes cross-origin top/opener without guards | Bind same-origin box discovery to version/profile; guard alpha0 ancestor/opener access for preferred cross-origin nested runtime and validate in browser. [Alpha2 constructor][s2-all]; [alpha67 constructor][s67-core]; [alpha0 constructor][s0-all] |
| **2 — readiness** | Unawaited old controller init; SW-ready ≠ correct controller/transport health; timeout resolves in alpha67 | Explicit version-specific readiness stages, bounded rejecting waits, correct control verification, then navigation. [Stable][s1-index]; [alpha0][s0-index]; [alpha67][s67-index] |
| **2 — licensing/provenance** | Browser notices omitted; MIT metadata contradicts actual AGPL text in two packages | Preserve actual notices/source, resolve conflicts, make adaptation provenance explicit. [Stable metadata/tarball][r1]; [alpha0][r0]; [comparison][provenance-script] |
| **2 — UV supply** | No UV assets in Proxy2 | Add pinned independent UV distribution/runtime adapter. [Directory][primary-root]; [UV source ZIP][uv-zip] |
| **3 — browser product** | Go-only UI, no tabs/bookmark/history/state machine | Build engine-free outer UI/data model with canonical bridge and actual navigation signals. [Indexes][s1-index]; [alpha67][s67-index] |

### Inferences

#### P — final-project explanation to carry forward

“ojjyProxy is one coherent browser workspace. It opens new tabs with **Scramjet 1.1.0 stable by default**, and lets each tab choose any of the other three supplied Scramjet versions or Ultraviolet. The UI owns tabs, search, bookmarks, history and saved preferences. Each tab's selected runtime runs its own matching engine, worker and transport adapter. Runtime origins separate version/profile cookies and website storage; bookmarks and visits retain real destination URLs in the outer app. Changing engine reopens the destination through that engine, rather than migrating the website session.” This is the proposed finished project, not functionality already present in Proxy2. ([Minimal reference UI][s1-index]; [versioned contracts][s0-index]; [alpha2][s2-index]; [alpha67][s67-index]; [origin storage][mdn-idb])

#### T — checks actually executed and exact limits

| Check | Observed result | Scope / exclusions |
|---|---|---|
| Read-only inventory/API inspection | Four complete version directories, alpha2 client present; storage/global/path/transport findings above | Static analysis. No runtime assurance. [Audit script][audit-script]; [focused excerpts][focused-script] |
| npm exact-byte comparison | All four Scramjet distribution sets, controller 0.0.14, BareMux2.1.9, Epoxy2.1.28 and libcurl1.5.2 matched the checked members; tarball SHA-1 matched registry | Package/artifact provenance check. No authenticated registry-signature validation, no npm install. [Script][provenance-script] |
| Node syntax (`v24.12.0`) | **36 checks passed**: 12 root JS/server files + 19 vendor JS/MJS files + 4 inline module blocks + alpha2 client separately | Parser validation only. `node --check` does not emulate browser APIs, service workers or rewrite correctness. [Batch script][checks-script]; [client][s2-client] |
| Actual supplied servers on ephemeral localhost ports | Started each original server with a temporary `PORT`; every tested root/config/SW/vendor asset returned **200** with correct JS/WASM MIME; alpha2 `/client.js` returned **200**, 3729 bytes; servers terminated with no stderr | **Local static HTTP serving**, not proxied browsing. COOP/COEP absent. Did not open Wisp socket, fetch a destination through Wisp, register browser SW or exercise POST/media/auth. [Script][checks-script]; [source server][s1-server] |
| Extracted pure omnibox functions | Same eight results for all four, including Google search and permissive custom schemes | Pure JavaScript parser check only; no navigation or website test. [Script][checks-script]; [parser][s1-index] |
| Stubbed Node VM core export/signature probe | Alpha2 and alpha67 exported correct versions/methods; codec round trip retained query/hash for sample target | Minimal API stubs, **not browser integration**; no real ScramjetClient hooking or controller/SW lifecycle. [Probe][runtime-probe] |
| Stubbed Node VM alpha2 injection probe | Real client.js throws `ReferenceError: PROXY_CONFIG is not defined` under the supplied injection assumptions | Controlled bootstrap dependency probe; not a website/browser run. [Probe][runtime-probe]; [inject list][s2-config] |

Source ZIPs were only read in memory. Optional stable ZIP comment identifies `57ba89e3ffaded81f43cc1597f2e863b15cca6f5`, aligning with embedded stable build; optional alpha67 ZIP comment identifies `c26bfc6d7f7c7f4dac52ce182a2ceab90e851823`, aligning with core build. Their source manifests/selected members corroborate these API/storage details; full source-to-built-output reproducibility was not established. ([Stable ZIP][zip1]; [alpha67 ZIP][zip67]; [focused ZIP procedure][focused-script])

### Gaps

- **No actual website/browser tests occurred.** No claims of successful example.com/Google/authenticated-site loading, simultaneous five-engine browsing, WebSockets, workers, downloads, redirects/POST, SPA/history event completeness, private browsing, mobile support or performance are justified by these checks. ([Executed procedure][checks-script]; [stub procedure][runtime-probe])
- A future focused browser proof must cover: first-run/returning-profile control; all five selected choices; simultaneous stable/alpha0 state isolation; simultaneous stable/alpha2/UV BareMux discovery; alpha67 controller restart/revival; URL transfer with query/hash/redirect/SPA; multiple cookies and document.cookie changes; POST/streams; dedicated/shared workers; destination WebSockets; history traversal; correct runtime shutdown/reset; and source-informed embedding/isolation policy. These follow actual source dependencies rather than README claims. ([Controller revival][s67-sw-bundle]; [BareMux discovery][bm-index]; [alpha2 missing glue][s2-client]; [codecs][s67-core])
- Deployment remains a later decision. Proxy2 demonstrates a Node static/Wisp reference, not a completed Deno deployment or permission for any specific host. Earlier hosting research remains contextual; this audit does not revalidate hosting policy. ([Node server][s1-server]; [earlier research report][old-report])

#### Evidence references and audit locations

All relative source locators in tables expand beneath `/Users/tinlaplee/Downloads/Proxy2`. The saved artifact is this file; temporary scripts are evidence utilities outside the application workspace, not app implementation.

[primary-root]: file:///Users/tinlaplee/Downloads/Proxy2
[primary-readme]: file:///Users/tinlaplee/Downloads/Proxy2/README.md
[s1-config]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/config.js
[s1-index]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/index.html
[s1-sw]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/sw.js
[s1-server]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/server.mjs
[s1-package]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/package.json
[s1-lock]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/package-lock.json
[s1-all]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/vendor/scramjet.all.js
[s0-config]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/config.js
[s0-index]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/index.html
[s0-sw]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/sw.js
[s0-server]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/server.mjs
[s0-package]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/package.json
[s0-all]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/vendor/scramjet.all.js
[s2-config]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/config.js
[s2-index]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/index.html
[s2-sw]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/sw.js
[s2-client]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/client.js
[s2-server]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/server.mjs
[s2-package]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/package.json
[s2-all]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/vendor/scramjet_bundled.js
[s67-config]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/config.js
[s67-index]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/index.html
[s67-sw]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/sw.js
[s67-server]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/server.mjs
[s67-package]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/package.json
[s67-core]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/vendor/scramjet.js
[s67-api]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/vendor/controller.api.js
[s67-sw-bundle]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/vendor/controller.sw.js
[bm-index]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/vendor/baremux/index.js
[bm-worker]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/vendor/baremux/worker.js
[epoxy-umd]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/vendor/epoxy/index.js
[curl-umd]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/vendor/libcurl/index.js
[wisp-license]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/node_modules/@mercuryworkshop/wisp-js/LICENSE
[r1]: https://registry.npmjs.org/@mercuryworkshop/scramjet/1.1.0
[r0]: https://registry.npmjs.org/@mercuryworkshop/scramjet/2.0.0-alpha
[r2]: https://registry.npmjs.org/@mercuryworkshop/scramjet/2.0.2-alpha
[r67]: https://registry.npmjs.org/@mercuryworkshop/scramjet/2.0.67-alpha.2
[rcontroller]: https://registry.npmjs.org/@mercuryworkshop/scramjet-controller/0.0.14
[rbm]: https://registry.npmjs.org/@mercuryworkshop/bare-mux/2.1.9
[re]: https://registry.npmjs.org/@mercuryworkshop/epoxy-transport/2.1.28
[rcurl]: https://registry.npmjs.org/@mercuryworkshop/libcurl-transport/1.5.2
[r1-tar]: https://registry.npmjs.org/@mercuryworkshop/scramjet/-/scramjet-1.1.0.tgz
[r0-tar]: https://registry.npmjs.org/@mercuryworkshop/scramjet/-/scramjet-2.0.0-alpha.tgz
[r2-tar]: https://registry.npmjs.org/@mercuryworkshop/scramjet/-/scramjet-2.0.2-alpha.tgz
[rbm-tar]: https://registry.npmjs.org/@mercuryworkshop/bare-mux/-/bare-mux-2.1.9.tgz
[rcurl-tar]: https://registry.npmjs.org/@mercuryworkshop/libcurl-transport/-/libcurl-transport-1.5.2.tgz
[zip1]: file:///Users/tinlaplee/Downloads/scramjet-1.1.0.zip
[zip67]: file:///Users/tinlaplee/Downloads/scramjet-2.0.67-alpha.2.zip
[uv-zip]: file:///Users/tinlaplee/Downloads/Ultraviolet-main.zip
[uv-sw-source]: https://raw.githubusercontent.com/titaniumnetwork-dev/Ultraviolet/main/src/uv.sw.js
[uv-cookie-source]: https://raw.githubusercontent.com/titaniumnetwork-dev/Ultraviolet/main/src/rewrite/cookie.js
[mdn-idb]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
[mdn-sw]: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
[mdn-sharedworker]: https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker
[mdn-postmessage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
[audit-script]: file:///var/folders/d1/1ykss2fs7_v0nx_r_8qd0_9c0000gn/T/opencode/proxy2-audit.py
[focused-script]: file:///var/folders/d1/1ykss2fs7_v0nx_r_8qd0_9c0000gn/T/opencode/proxy2-focused.py
[provenance-script]: file:///var/folders/d1/1ykss2fs7_v0nx_r_8qd0_9c0000gn/T/opencode/proxy2-provenance.py
[checks-script]: file:///var/folders/d1/1ykss2fs7_v0nx_r_8qd0_9c0000gn/T/opencode/proxy2-checks.py
[runtime-probe]: file:///var/folders/d1/1ykss2fs7_v0nx_r_8qd0_9c0000gn/T/opencode/proxy2-runtime-probe.mjs
[audit-output]: file:///Users/tinlaplee/.local/share/opencode/tool-output/tool_131efe33f001qqD7X5z7XcMdhS
[old-report]: file:///Users/tinlaplee/Desktop/Desktop%20Jonas/ojjyProxy/reports/ojjyProxy%20implementation%20research.md
