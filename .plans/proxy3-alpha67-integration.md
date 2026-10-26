# Proxy3 → ojjyProxy: alpha67 integration update

**Started: 2026-10-26.** User-supplied **Proxy3** (`proxy-extract`, in Downloads) is the new
engine-integration reference. It contains one standalone browser-window example per Scramjet
release, extracted from AIO's hybrid proxy integration and cross-checked against MercuryWorkshop's
official examples (scramjet-app for v1-era, packages/demo for the controller architecture).
This plan ports what is new into ojjyProxy.

## What Proxy3 actually changes

Hash comparison (md5) of every Proxy3 `vendor/` bundle against ours: **the pinned artifacts are
byte-identical** — `scramjet.js`/`scramjet.wasm` = our `main.js`/`main.wasm`, `controller.api.js`,
`controller.inject.js` identical; `controller.sw.js` and `baremux/index.js` differ only by our own
build patches (Firefox body-buffering). Our `sj-1.1.0`/`sj-2.0.0-alpha` `app.js` copies differ from
Proxy3's `scramjet.all.js` only by our body-carry + singleton-guard + socket-bridge patches.
**There is nothing new to vendor.** The update is integration glue:

- **stable (1.1.0), alpha0 (2.0.0-alpha), alpha2 (2.0.2-alpha):** our runtime already matches the
  Proxy3 examples, and exceeds them where we fixed upstream gaps (alpha0 destination-WebSocket
  bridge; alpha2 cookie persistence, worker ports, worker inject scripts). No changes.
- **alpha67 (2.0.67-alpha.2):** two real deltas, both from AIO:
  1. **Transport.** The Controller now drives a **BareMux `BareClient`** (epoxy or libcurl over
     Wisp through the BareMux SharedWorker) instead of a transport module instantiated directly
     in the page. Upstream fetches use `redirect: "manual"` and streaming bodies get
     `duplex: "half"`; destination WebSockets go through `bare.createWebSocket`. This is the same
     path our stable/alpha2/UV engines already take through the same patched vendored BareMux.
  2. **URL-guard plugin** (`guard.js`, ported from AIO's
     `src/lib/scramjet-search-url-guard.ts`). Stock 2.0.67-alpha.2 coerces missing route values
     into real navigations: `location = undefined` → `/undefined` (TikTok lands on its own 404),
     `?q=${undefined}` → garbage queries. The guard intercepts `client.rewriteUrl` and the
     client `url` setter, aborts or sanitizes those navigations (recovering the visible search
     query where possible), and reinstates a minimal Navigation API stub because Scramjet deletes
     `window.navigation`, which DDG-style SPA search depends on.

API notes verified against our pinned bundles before coding:

- `$scramjetController` (controller.api.js) exports `ManagedPlugin`; `ManagedPlugin extends
  $scramjet.Plugin`, whose `tap(hook, callback)` registers into the frame's
  `hooks.init.post` Tap hook — so Proxy3's plugin works against our stock (patched-only-for-bodies)
  bundles unmodified.
- `Controller.createFrame(iframe, { plugins })` exists in 0.0.14 and installs each plugin
  (`install(frame)`), checking `plugin.dependencies` (guard passes `[]`).
- `new BareMux.BareClient()` with no args reconnects via the `bare-mux-path` localStorage entry a
  prior `BareMuxConnection` set — valid in the runtime page after `bareMux()` runs.
- `bare.createWebSocket(url, protocols, options, headers)` takes headers as the **4th** argument;
  Proxy3's example passes them 3rd (silently dropped). We keep our alpha2-style 4-arg call so
  destination WebSocket headers are preserved.

## Decisions

- **Full port** (transport + guard) so alpha67 matches the new reference. If the BareMux transport
  regresses the deep matrix, fall back to keeping the direct transports and shipping only the
  guard; record the outcome here either way.
- `guard.js` is app code under `/runtime/` (not vendor), so it is outside the build fingerprint;
  its URL is neutral (no tool names — covered by the neutral-URL unit test).
- Provenance is documented in the file header, README and this plan (AIO/Proxy3 port), matching
  the repo's existing source-credit practice. Upstream bundles stay untouched.

## Checklist

- [x] Port `guard.js` into `public/runtime/guard.js` — done 2026-10-26 (test: alpha67 engine test green; negative control failed with the plugin disabled).
      Neutral marker symbols, AIO credit in the header, logic otherwise identical to the Proxy3
      original.
- [x] `adapter.js` alpha67: replace the direct UMD transports with the BareMux `BareClient` wrapper — done 2026-10-26 (test: alpha67 deep matrix on Chromium and Firefox × epoxy/libcurl, all green).
      4-arg `createWebSocket`, `redirect: "manual"`, `duplex: "half"`, reusing the existing
      `bareMux()` helper so engine transport selection stays identical.
- [x] `adapter.js` alpha67: load the guard and pass it via `createFrame(website, { plugins })` — done 2026-10-26 (test: garbage-nav regression check; disabling the plugin fails it).
- [x] Browser regression check: fixture page runs `location = undefined`; alpha67 must stay on the page — done 2026-10-26 (test: "sj-2.0.67-alpha.2 loads through the owned Wisp relay" garbage-nav assertions).
- [x] Add `public/runtime/guard.js` to the neutral-URL unit test sources — done 2026-10-26 (test: `npm run check` → 9 Deno + 28 Node tests pass).
- [x] Docs: README (Proxy3 as the primary reference; alpha67 transport + guard), ROADMAP Phase 3, CLAUDE.md repo map — done 2026-10-26 (verified: docs read back after editing).
- [x] Verify: `npm run build` zero vendor diff, `npm run check`, alpha67 deep on Chromium + Firefox, full default Chromium suite, WebKit compat lane — done 2026-10-26 (test: 51/51 Chromium; 50 passed + 1 pre-existing WebKit skip; alpha67 deep × {Chromium, Firefox} × {epoxy, libcurl} green).
- [~] Commit locally, update the AI board, ask Jonas about pushing (push to `main` deploys all
      six Deno apps; Deno Deploy limit is 15/hour) — local commit made 2026-10-26; push awaiting
      Jonas's explicit yes

## Outcome

Full port shipped — no fallback needed. One deliberate fix over the Proxy3 example was required:
BareMux response headers are flattened into repeated `[name, value]` pairs (`flattenHeaders`)
because the libcurl transport reports each header name as an **array**; with the example's plain
`Object.entries`, server-set cookies never applied on that transport (caught by the deep matrix's
`servercookie` check, fixed and re-verified). The example also passes destination-WebSocket headers
as `createWebSocket`'s 3rd argument (options) instead of the 4th (headers), silently dropping
them; we keep the 4-arg form our alpha2 glue uses.

## Fallback / rollback

The change is confined to `public/runtime/adapter.js`, the new `public/runtime/guard.js`, tests and
docs. Reverting `adapter.js`'s alpha67 branch restores the old transport; the guard plugin is
inert without being passed to `createFrame`.
