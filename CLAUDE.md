# CLAUDE.md — ojjyProxy repo context

Personal web workspace ("ojjy"): a browser-in-browser shell with tabbed proxied
browsing, bookmarks/folders, pinned tabs, context menus, appearance themes, and a
remote headless-browser engine that streams JPEG pixels. Public branding is
neutral; legal credits and source links stay in `public/credits.html`. License:
AGPL-3.0-only. Author: Jonas Lee.

## Live topology

| Piece | Where | Notes |
| --- | --- | --- |
| Shell | https://ojjyproxy.ojjy.deno.net | `SITE_PASSWORD` gate; auto-deploys from `main` |
| 5 engine runtimes | `ojjyproxy-stable/alpha0/alpha2/alpha67/uv .ojjy.deno.net` | One Deno Deploy app each, auto-deploy from `main` |
| Headless service | https://d11zfagyzg18az.cloudfront.net | Node/Docker on the operator's EC2 relay host, behind Caddy + CloudFront |
| Wisp relay | Same EC2 host | Backup relay: `wss://d11zfagyzg18az.cloudfront.net/wisp/` |
| Game hub link | ojjys-game-hub.ojjy.deno.net | Separate project |

Deno Deploy plan limit: **15 deployments/hour** across all apps — one push to
`main` triggers 6. Batch pushes; if deploys fail with quota errors, redeploy each
app from the Deno console later ("Deploy Default Branch").

## Repo map

| Path | Purpose |
| --- | --- |
| `server.ts` | Deno shell/runtime server: static files, `/api/config`, password gate, per-engine routing, security headers (COOP `same-origin` — do not remove; a Playwright≤1.63 Firefox bug keyed off it, fixed upstream #42731) |
| `public/app.js` | Shell logic: tabs (pinned support), navigation, menus, notifications/undo, folders, library, settings |
| `public/menus.js` | Shared menu host (`createMenuHost`): popovers, keyboard nav, one submenu level, long-press, modal reparenting. Also imported by the headless runtime |
| `public/workspace.js` | Sanitizers/settings (`sanitizeFolder`, collections, presets); `public/workspace.css` all shell styling |
| `public/shared.js` | `ENGINES` list (ids, labels, ports, warm assets) |
| `public/runtime/` | Engine runtime pages: `adapter.js` (engine dispatch), `headless-client.js` (canvas/input/zoom/fullscreen), `index.html`, `websocket.js` |
| `headless/` | Remote-session service (Node, port 9100): `server.mjs`, `guards.mjs` (navigation/origin guards), `helpers.mjs` (capture budgets, JPEG sizing, frame decoder), own `package.json` (pinned `playwright-core`) |
| `relay/server.mjs` | Wisp relay (Node, port 9000) |
| `scripts/build.mjs` | Builds `public/vendor/*` from pinned npm dists, renames files to neutral names, patches body-carry bugs, writes `public/notices` + `public/asset-manifest.json`. CI asserts no drift |
| `scripts/dev.mjs` | Dev stack (port 8000; set `WISP_TEST_MODE=1` to allow loopback destinations) |
| `scripts/live-check.mjs` | Live smoke test of all engines through production (`LIVE_SITE_PASSWORD` required; not CI) |
| `tests/` | Deno `server.test.ts`; Node unit `*.test.mjs`; Playwright `tests/browser/{proxy,menus,workspace,quiet-ui,public-surface}.spec.mjs` |
| `.plans/` | Feature specs/plans + session history (see `history-2026-10-workspace-menus.md`) |
| `research_notes/`, `reports/` | Pre-implementation notes (historical, partially superseded) and the corrected synthesis report |

Persisted client data: localStorage key `ojjyproxy-app-v1`; export marker
`ojjyproxy-v1`. `folder` (bookmarks) and `pinned` (tabs) are additive fields;
loaders must stay tolerant. Only these keys/formats — never rename them.

## Commands

```sh
npm run check          # deno check + Deno tests + Node unit tests (fast, always run)
npm test               # Node unit tests only
npm run build          # vendor build; must produce zero diff (CI enforces)
npm run dev            # local stack on port 8000 (WISP_TEST_MODE=1 for fixtures)
npm run test:browser -- --browser=all          # local Playwright suite (port 8700)
DEEP_PROXY_TESTS=1 npm run test:browser -- --browser=all   # + per-engine relay matrix
LIVE_SITE_PASSWORD=… npm run test:live        # production smoke (never in CI)
```

## Testing facts future agents must know

- `playwright.config.mjs`: 1 worker; shell 8700, runtimes 8100–8500, relay 9000,
  headless service 9100; `menus/proxy` specs own fixture port 8899 while running.
- **`@playwright/test` is pinned at 1.64.1 on purpose** (and `playwright-core`
  1.64.1 in `headless/package.json`): 1.58–1.63 Firefox/Juggler reused a
  process-scoped channel id after COOP-triggered context replacement, hanging
  `page.goto`/`evaluate` nondeterministically (microsoft/playwright#42731). Do not
  downgrade; do not strip COOP to "fix" Firefox flakes.
- Both `compat` CI lanes must install **chromium** too — the headless engine's
  E2E tests spawn a server-side Chromium regardless of client browser.
- One **pre-existing skip**: WebKit + `sj-2.0.67-alpha.2` relay test. Not introduced
  by recent work; do not "fix" by deleting it.
- Firefox automation may ignore `deviceScaleFactor`; the DPR test pins
  `devicePixelRatio` via init script on purpose.

## Headless service deployment (operator runbook)

Host: EC2 (Ubuntu) reached via
`ssh -i ~/Downloads/ojjyproxy-relay-key.pem ubuntu@ojjyproxy-jonas-relay.duckdns.org`
(the EC2 public IP rotates; the DuckDNS name tracks it — check it when SSH times out).

- Containers: `ojjyproxy-caddy`, `ojjyproxy-wisp`, `ojjyproxy-headless`
  (+ stopped backups `-old`, `-before-origin-fix` until removed).
- Build context: `/opt/ojjyproxy-headless/` **flat** — `server.mjs`, `guards.mjs`,
  `helpers.mjs`, `package.json`, `runtime/` (contents of `public/runtime/`),
  `shared.js`, `menus.js`, `workspace.css`, `Dockerfile`. The Dockerfile must
  `COPY` **all three** of `server.mjs guards.mjs helpers.mjs` (a stale Dockerfile
  once caused an `ERR_MODULE_NOT_FOUND` crash loop).
- Full procedure incl. rollback: `headless/README.md`. In short: rebuild image →
  `docker stop` + `rename` old → `docker run` new with the same env
  (`HEADLESS_PARENT=https://ojjyproxy.ojjy.deno.net`,
  `HEADLESS_SELF`/`HEADLESS_ORIGINS` = the CloudFront domain).
- Caddyfile: `/opt/ojjyproxy-caddy/Caddyfile`. The remote matcher must route
  **`/runtime/* /shared.js /workspace.css /headless /headless/* /session /session/*`**
  to `127.0.0.1:9100`. The new service's WebSocket path is `/session/`.
  `caddy reload` has silently not applied once — prefer `docker restart
  ojjyproxy-caddy` after edits.
- CloudFront: single distribution, one Default(\*) behavior, CachingDisabled,
  origin request policy `Managed-AllViewerExceptHostHeader`; the
  `X-Ojjy-Origin-Secret` header is a **CloudFront origin custom header** (value
  not stored in this repo). Do not put the secret value in any repo file.
- Verify after deploy: `curl` the CloudFront domain for `/runtime/menus.js`,
  `/workspace.css`, `/runtime/headless-helpers.mjs` (expect 200), then open a real
  WebSocket to `wss://…/session/` (origin = the CloudFront domain), send
  `{"type":"hello",…}`, expect `hello-ok` + binary JPEG frames.

## Honest limits / open items

- Pre-existing (documented in `headless/README.md`, not introduced by recent work):
  the headless service has **no authenticated admission** (origin checks are
  forgeable by non-browsers) and **no DNS-aware private-network egress guard**.
  Do not describe the service as hardened public isolation.
- Clipboard/fullscreen/IME behavior varies by browser/device; failures are
  reported in-app honestly. Automated tests dispatch events; physical-device IME
  and touch remain manual checks.
- Browser-reserved shortcuts (Ctrl/Cmd+T/W/N) stay local by design.
- No claim that any of this changes filtering, monitoring, or anonymity.
- `README.md` still contains literal diff-marker debris around lines 41–54 and
  stale verification counts near 398–401 (pre-existing; flagged by docs audit).

## Session history

Chronological record of the 2026-10 workspace-menus/remote effort — decisions,
incidents (Firefox hang, CI failures, deployment), and evidence — lives in
`.plans/history-2026-10-workspace-menus.md`. Read it before reworking menus,
remote input, or deployment.
