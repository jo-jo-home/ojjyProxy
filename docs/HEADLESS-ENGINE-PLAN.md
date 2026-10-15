# Headless Browser Engine — Implementation Plan

Status: planned → implemented in this working tree (explicitly **not committed**, per
instruction). Everything is new code layered onto the existing engine model; no existing
engine behavior changes.

## 1. What this engine is

A sixth engine, `headless`, powered by **remote browser isolation**: the destination page
is loaded and rendered by a **server-side headless Chromium**, and the user watches a live
pixel stream and drives it with their real mouse and keyboard. The client network never
contacts the destination — only the headless service does — and page content reaches the
client as compressed image frames, which URL- and content-keyword filters cannot read the
way they read rewritten HTML. This is the strongest answer to restrictive networks, and it
reuses every shell feature (tabs, titles, history, bookmarks, error card, engine switching)
because the runtime speaks the existing shell message protocol.

## 2. Architecture

```
shell (ojjyproxy.ojjy.deno.net)
  └─ iframe: runtime origin #6 (RUNTIME_ENGINE=headless) → /runtime/index.html
       └─ headless-client.js
            ├─ WSS → headless service (EC2 / local dev, port 9100)
            │    ├─ Playwright Chromium, one BrowserContext per session
            │    ├─ CDP Page.startScreencast → JPEG frames (binary WS)
            │    ├─ input: CDP Input.dispatchMouseEvent / page.keyboard
            │    └─ guards: origin allowlist, SSRF host blocklist, blocklist, caps
            └─ postMessage → shell (existing protocol: ready/navigate/loaded/…)
```

- The destination is fetched and rendered **on the service host**, not the client.
- The wisp relay is untouched; headless does not use it (the shell still requires a relay
  setting to exist before browsing — unchanged gating, documented).
- Production placement: the same EC2 host as the relay, behind Caddy (`/headless/` →
  `127.0.0.1:9100`, WebSocket passthrough) and the existing CloudFront; Deno Deploy stays
  out of the data path entirely.

## 3. Components and files

### 3.1 `headless/server.mjs` (new, Node + playwright-core + ws)

- **HTTP**: `GET /health` → `{ok, service, sessions, max}`; all else 404.
- **WS**: path `/headless/`. Upgrade checks `Origin` against `HEADLESS_ORIGINS` (exact
  match list). Optional shared secret `HEADLESS_TOKEN` checked in the first hello message.
- **Session** = one WS connection:
  - singleton browser (`chromium.launch({headless:true, args:[--no-sandbox,
    --disable-dev-shm-usage, --disable-gpu]})`), one fresh **BrowserContext per session**
    (isolated cookies/storage), one page.
  - viewport from hello `{width,height}`; `resize` messages call `page.setViewportSize`
    and restart the screencast with new caps.
  - screencast: `context.newCDPSession(page)` → `Page.startScreencast({format:"jpeg",
    quality:HEADLESS_QUALITY(60), maxWidth:1600, maxHeight:1200, everyNthFrame:1})`;
    every `Page.screencastFrame` is forwarded as a **binary WS frame**
    (`0x01` + JPEG bytes) and **acknowledged** (`Page.screencastFrameAck{sessionId}`) —
    unacked frames stall the compositor.
  - control messages are JSON text frames: hello-ok, navigating, loaded, popup, links,
    error, closed, pong.
  - input: `mouse move/down/up` → `Input.dispatchMouseEvent` (buttons bitmask,
    clickCount); `wheel` → `Input.dispatchMouseEvent{type:"mouseWheel"}`; keyboard →
    `page.keyboard.down/up` with a typed-char set so printable keys never double-fire;
    modifiers tracked from explicit modifier key down/ups.
  - navigation: `navigate` (guard → `page.goto(url,{waitUntil:"commit",timeout:45000})`),
    `back`/`forward` (`page.goBack/goForward`), `reload`, `clear-cache`
    (`context.clearCookies()` + `Network.clearBrowserCache` → reply `cache-cleared`).
  - events: frame navigated → `navigating{url}`; page `load` → `loaded{url,title}`;
    `context.on("page")` → `popup{url}` (kept alive, not streamed); page crash → error.
  - `inspect` → visible anchor list `{text, x, y, w, h}` (drives the E2E click test and
    enables future UI affordances).
- **Guards** (exported for unit tests):
  - `assertNavigatable(url, blockedDomains)`: http/https only; length ≤ 2048; hostname
    blocklist: localhost/`*.localhost`, 127/8, 10/8, 172.16/12, 192.168/16, 169.254/16
    (cloud metadata!), 0.0.0.0, ::1, fc00::/7, fe80::/10, plus the shell's per-tab
    blocked-domain list (reject message matches the shell filter wording).
  - `context.route("**/*")` aborts requests whose hostname is private/blocked (literal
    hostnames; DNS-rebinding is a documented v1 limitation).
  - caps: `HEADLESS_MAX_SESSIONS` (default 2) — over capacity gets a clear error;
    idle timeout 120s (any client message resets); hard session age 30 min; SIGTERM
    graceful shutdown.

### 3.2 `public/runtime/headless-client.js` (new, ES module)

- Hides the `#website` iframe, creates a full-bleed `<canvas id="screen" tabindex="0">`.
- Connects `new WebSocket(config.remote)` (URL injected by `/runtime/config.js` only for
  this engine), sends `hello{width,height,blocked,capture}`, waits `hello-ok`.
- Binary frames → `createImageBitmap` → `drawImage`; keeps the last frame across resizes.
- Input: pointerdown/move/up + wheel + keydown/keyup on the canvas (`preventDefault`),
  forwarded in the server protocol; ResizeObserver → debounced `resize`.
- Shell protocol bridge: `ready` (after hello-ok) via the adapter's existing terminal
  `send("ready")`; `navigating`/`loaded` carry `{url,title}` exactly like rewritten engines
  so tabs, the address bar, history, and bookmark stars keep working; `popup` forwarded
  (the shell gates on its captureWindows setting); `cache-cleared` forwarded.
- Reconnect: unexpected close → retry twice (0.8s, 2s), re-hello + re-navigate to the last
  URL; then surface a failure so the shell error card takes over ("try again" recreates the
  session).
- Exposes `self.__headless = { links() }` for diagnostics and the E2E test.

### 3.3 `public/runtime/adapter.js` (modify)

- New first branch in `initialize()`: `config.engine === "headless"` → error if
  `config.remote` missing; dynamic-import the client; skip wisp validation, skip the
  service worker, skip all vendor loads. Fall through to the shared terminal `send("ready")`.
- Module-level `headlessSession` used by the shell-command message handler
  (navigate/back/forward/reload/clear-cache route to the client).
- Guard the policy `postMessage` (`navigator.serviceWorker.controller?.…`) — headless has
  no service worker.

### 3.4 `public/shared.js` (modify)

- `ENGINES` gains `{ id:"headless", label:"Headless browser (remote)", short:"Headless",
  port:8610, warm:[] }` (last position). Warm-list test updated: warm assets are optional
  and must stay empty for the remote engine.

### 3.5 `server.ts` (modify)

- `runtimeConfig()` gains `remote: environment("HEADLESS_SERVICE_URL")` — included **only
  when `engine === "headless"`** so other runtime origins never expose the service URL.
- Env allowlists in `deno.json` (`start` task) and `package.json` (`check` deno-test line)
  gain `HEADLESS_SERVICE_URL`.

### 3.6 Dev & test harness

- `scripts/dev.mjs`: the ENGINES loop auto-spawns the headless runtime (8610). When
  `HEADLESS_SERVICE=1` it also spawns `node headless/server.mjs` (port 9100, origins
  `http://localhost:8610,http://localhost:8700`) and passes
  `HEADLESS_SERVICE_URL=ws://127.0.0.1:9100/headless/` to the 8610 runtime only
  (undefined env values are never passed through).
- `playwright.config.mjs`: webServer env gains `HEADLESS_SERVICE=1` and the service URL,
  so CI and local runs always have a working engine.
- Dev selector: the local registry is derived from `ENGINES`, so the headless engine appears
  automatically; in production it appears only after the operator registers its origin in
  `RUNTIME_ORIGINS`.

### 3.7 Tests

- `tests/server.test.ts`: `config.js` for a headless runtime includes `remote` when the env
  is set and omits it otherwise; vendor/URL tests updated for neutral names (already done).
- `tests/shared.test.mjs`: warm-asset rule updated (headless has none, by design).
- `headless/server.mjs` exports the guards; `tests/shared.test.mjs` (node run) unit-tests
  `assertNavigatable`: rejects `file:`, localhost, 127.0.0.1, 10.x, 172.16.x, 192.168.x,
  169.254.169.254, `::1`, blocked list members; accepts public http/https URLs.
- `tests/browser/proxy.spec.mjs` — new E2E: select headless → navigate fixture →
  `#address` shows the fixture URL and status shows loaded → canvas painted (pixel-variance
  check) → `__headless.links()` finds "next page" → synthetic pointer click at its box
  center → address becomes `/next` → shell back button → address returns → blocked-domain
  flow (`localhost` in the blocklist via the switch-engine path) produces the filter error.

### 3.8 Docs

- `headless/README.md`: protocol, env vars, local run, EC2 Docker deployment
  (`mcr.microsoft.com/playwright` image or node+deps, swap recommendation for 1 GiB),
  Caddy `/headless/` reverse-proxy snippet, CloudFront note, limits (pixel rendering: no
  text selection, host-reserved shortcuts stay local, popups are reported not streamed,
  DPR 1).
- `README.md` "Included" bullet + `ROADMAP.md` Phase 3 note.

## 4. Ports, names, limits

| thing | value |
|---|---|
| headless runtime (Deno) | port **8610** (8600 is the gate-test spawn) |
| headless service (Node) | port **9100** (9000 is the wisp relay) |
| WS path | `/headless/` |
| engine id / short label | `headless` / "Headless" |
| max sessions | 2 (env-tunable) |
| idle / max age | 120 s / 30 min |
| frame format | JPEG q60, binary WS, everyNthFrame 1, caps 1600×1200 |

## 5. Risks & mitigations

- **Screencast stalls without acks** → ack every frame in a catch-guarded call.
- **Server-side Chromium memory on 1 GiB EC2** → session cap 2, idle reaper, hard age
  limit, `--disable-dev-shm-usage`; README recommends 1 GiB swap; sessions are queueless —
  over capacity is a clear, immediate error.
- **SSRF from the EC2 browser** → literal-host blocklist incl. cloud metadata, request
  routing abort for private hosts, http/https only; DNS-rebinding documented as a known v1
  limitation.
- **Filtering of the service origin itself** → same mitigation as the relay: it rides the
  existing CloudFront + neutral naming; pixels cannot be keyword-matched.
- **Shell protocol drift** → the client reuses `send()`/existing message shapes; the E2E
  test drives the real shell UI end-to-end.
- **Playwright browser availability in CI** → the webServer env enables the service only
  where Chromium is installed; CI installs Chromium.

## 6. Done when

Unit suites green (guards, warm lists, config plumbing), full browser matrix green
(Chromium + Firefox + WebKit) including the new headless E2E, live-style local run
demonstrated with a screenshot, and **nothing committed**.
