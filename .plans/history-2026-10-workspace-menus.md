# History: workspace menus, pinned tabs, folders, remote improvements (2026-10)

Chronological record for future sessions. Written after the work merged (PR #1 →
merge commit `a2b912e`) and the production deployment was completed and verified.
Companion to `context-menus-workspace-features-plan.md` / `-spec.md`, which hold
the design and evidence tables.

## Timeline

### Earlier merged work (context)
- `6dcdc7c` — quiet modern shell UI, expanding navigation, background themes.
- `b046529` + `65cf643` — the headless engine (sixth engine, `id: "headless"`):
  server-side Chromium streaming JPEG frames over a WebSocket; runtime file
  serving from repo and container layouts.
- `61eaffa` — neutral public branding: `ojjy` identity, generic engine labels,
  `/runtime/content/` prefix, vendor renames, `/credits.html`, no filter/monitoring
  claims in copy.
- `88c6c14` — settings categories via explicit `data-category` (replaced
  heading-text classification that misfiled relay settings).
- `2e68aa6` (upstream `main`, integrated into this branch) — CloudFront origin
  correction: use the browser-facing CloudFront origin in `HEADLESS_SELF/ORIGINS`,
  leaner Debian image installing `chromium-headless-shell`, honest wording that
  origin allowlists are not authentication.

### The feature branch (`feat/workspace-menus-remote`)
Interview-backed spec (`.plans/context-menus-workspace-features-spec.md`) and plan
were written first, per the user's request for a detailed plan before
implementation. Implementation then ran in phases, each gated on tests:

1. `public/menus.js` menu host: manual popovers (reparented into the topmost
   `dialog:modal` or fullscreen subtree), keyboard nav, one submenu level,
   long-press for touch, suppression of the synthetic click after long-press,
   viewport clamping, reduced-motion/motion-off variants.
2. Shell surfaces: delegated `contextmenu` + `Shift+F10`/`ContextMenu` handlers;
   per-surface builders (shortcut/tab/bookmark/history/collection/default);
   notify() extended with an action button → 6s undo toasts; bulk confirm dialog
   (`#menu-confirm`) with explicit counts; ⋯ buttons on shortcut cells and library
   rows.
3. Pinned tabs: additive `pinned` field, pinned-first visual order via
   `orderedTabs()`, icon-only rendering, drag constrained within groups,
   pin-aware close-neighbor selection and keyboard navigation.
4. Folders: `sanitizeFolder` (trim/collapse/bound 40), `<datalist>` suggestions,
   collapsible `<details>` sections (state preserved across re-renders), drop
   targets with highlight, "Move to folder" submenu.
5. Remote: DPR-aware bounded capture (2.4MP/2400px, quality 78 default,
   `HEADLESS_QUALITY` authoritative), actual-JPEG-dimension check with a
   serialized device-scale screenshot fallback, coalescing frame decoder that
   closes bitmaps, hidden-textarea IME/paste, physical-key forwarding with
   `event.code` tracking (Shift-before-letter releases correctly),
   server-OS accelerator mapping, deferred touch activation (long-press cannot
   complete a remote click), local zoom 0.5–3× with scrollbar panning, fullscreen
   on the view container, honest clipboard failure notices, cache-clear preserving
   cookies, receive-ordered non-blocking navigation with epoch-suppressed stale
   errors, panic-key forwarding, open-with-another-engine message.

### The Firefox hang (root-caused, do not rediscover this)
Symptom: after browsing a runtime, `page.reload()`, then trusted right-click
input or `page.evaluate`, Firefox stalled to the 60s timeout. Synthetic
`dispatchEvent("contextmenu")` worked; the sequence without prior browsing
worked.

Investigation traps that wasted time and must not be repeated:
- Blaming the Popover API (disabling popovers changed nothing).
- HTML bisects via `page.route(...)` interception — **invalid**: `route.fulfill`
  without `fetch()` dropped the real response headers, including COOP; early
  "the new HTML is the trigger" conclusions were artifacts of missing headers.
- Suspecting the app's menus: a stubbed `menus.js` still hung.

Real cause: Playwright ≤1.63 Juggler reused a process-scoped SimpleChannel uid
after COOP-triggered browsing-context replacement; stale buffered responses
answered the new channel's restarted message ids (upstream
[microsoft/playwright#42731](https://github.com/microsoft/playwright/issues/42731)).
Fix: pin `@playwright/test` and `headless`'s `playwright-core` to **1.64.1**.
No app headers or Firefox prefs were changed. Regression tests are now mandatory
suite members (`runtime browsing and reload retain trusted input and page
evaluation`, plus the restored full browse→pin→middle-close→re-pin→reload
sequence), 20/20 across repeated runs.

### CI failure round (post first PR push)
- `compat (firefox)`/`compat (webkit)` lanes lacked a server-side Chromium — the
  headless E2E needs one regardless of client browser. Fixed in
  `.github/workflows/check.yml` (install `${{ matrix.browser }} chromium`),
  plus unique artifact names per matrix lane.
- Chromium's lane then failed remote selection-copy. A forced probe reproduced a
  real defect: `release-input` emitted mouse-up for **all three buttons even when
  none were held** (observed `ups:3`, expected `ups:0`). Fixed with held-button
  tracking in `headless/server.mjs`; the regression asserts zero unheld releases
  plus exactly one release for an actually-held button. Linux clipboard went green
  afterwards; diagnostics logging retained in the test.
- Commit `1d5f068`; all three CI lanes green on it.

### Merge and Deno deployment
- PR #1 merged → `a2b912e`. All test jobs green on `main`.
- **All six Deno deploys then failed**: plan quota (15 deployments/hour) —
  repeated earlier in the session by manual rebuild/redeploy attempts. Not a code
  issue. Resolved by the operator manually clicking "Deploy Default Branch" per
  app in the Deno console once the window cleared.
- Verified live from here: all five engine runtimes serve the new build
  (`/menus.js` 200 on each origin; `/health` roles correct). The shell is
  password-gated so its content was verified by the operator in-browser.

### Headless service deployment (operator-assisted, click-by-click)
The service is a Docker container on the operator's EC2 relay host — Deno deploys
do not touch it. Sequence of incidents:
1. SSH address rotated (EC2 public IP changes on stop/start). The DuckDNS name
   `ojjyproxy-jonas-relay.duckdns.org` tracks it; found via the operator's shell
   history (`ssh -i ~/Downloads/ojjyproxy-relay-key.pem ubuntu@…duckdns.org`).
2. First container swap attempt had a mangled double-paste → image name
   `ojjyproxy-headlesssudo` error; old container already stopped+renamed. Recovered
   with a single-line `docker run`.
3. New container crash-looped: `ERR_MODULE_NOT_FOUND /app/helpers.mjs`. Root cause:
   the **Dockerfile on the server was stale** (pre-`helpers.mjs` COPY list) — the
   update runbook had copied source files but not the Dockerfile. Fixed by writing
   the current Dockerfile (see `headless/README.md`), rebuild, `docker rm -f` the
   crash-looping container, rerun. Container then stable.
4. `/workspace.css` 404 through CloudFront: Caddy's remote matcher predated the
   file. Added the path via sed; `caddy reload` **silently failed to apply**
   (validated fine; behavior unchanged until `docker restart ojjyproxy-caddy`).
   Prefer restart over reload for this setup.
5. `/session/` 404 (would have broken all remote sessions): the new service moved
   the WebSocket path to `/session/` while the server's Caddyfile still routed
   only the old `/headless /headless/*`. Caught by reading `headless/server.mjs`
   (`path: "/session/"`) and `adapter.js` (`location.host + "/session/"`), not by
   user reports. Added `/session /session/*` to the matcher + restart.
6. CloudFront requires no per-path behavior: single Default(\*) behavior,
   CachingDisabled, `Managed-AllViewerExceptHostHeader`; the origin secret is a
   CloudFront **origin custom header** applied to all paths. (An earlier
   hypothesis about per-path behaviors was wrong — checked in the console.)
7. Final live verification from here: real WebSocket to
   `wss://d11zfagyzg18az.cloudfront.net/session/` with the CloudFront origin →
   `hello-ok`, navigation to example.com, `loaded`, and binary JPEG frames
   received. `/runtime/menus.js`, `/workspace.css`, `/runtime/headless-helpers.mjs`
   all 200.

## Final state (2026-10-16)

- Production fully updated: shell + 5 runtimes (Deno) and the headless service
  (Docker) all serving the new build; remote sessions verified end-to-end.
- Local verification at merge time: 149/150 browser cases (one pre-existing
  WebKit alpha67 skip), 37 check tests, build reproducible; CI green on `main`.
- Stopped backup containers remain on the host (`ojjyproxy-headless-old`,
  `ojjyproxy-headless-before-origin-fix`) as rollback insurance; delete once
  comfortable.
- Pre-existing security gaps remain open by design scope: no authenticated
  admission to the headless service, no DNS-aware private-network egress guard.
- Live checks (`npm run test:live`) still unrun from this machine — needs
  `LIVE_SITE_PASSWORD`.

## Lessons (reusable)
- `route.fulfill` without `fetch()` drops upstream headers; any header-sensitive
  bisect must pass `response` through or re-add headers explicitly.
- A "flaky" automation hang can be a tool bug: check the tool's upstream tracker
  with the exact symptom (trusted-input-only, post-reload) before rewriting app
  code. The unsupported popover/automation theories cost hours.
- Deployment runbooks must version the **Dockerfile** with the sources; copying
  new sources into a stale Dockerfile produces crash loops that look like code
  bugs.
- `caddy reload` inside this container silently failed once; `docker restart
  ojjyproxy-caddy` is the reliable apply. Verify externally (curl the public
  domain) after every proxy change.
- EC2 public DNS names rot; the DuckDNS origin name is the durable address.
