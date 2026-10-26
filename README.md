# ojjyProxy

A standalone, hub-blue browser workspace using **your own Wisp relay**, four Scramjet releases, and
Ultraviolet. Built for a Deno-served website, with the navy theme from
[ojjy’s game hub](https://github.com/jo-jo-home/ojjys-game-hub) and screenshot-inspired pill
controls.

**Scramjet 1.1.0 stable is the default.** The primary engine integration reference is the supplied
**Proxy3** examples (extracted from AIO’s hybrid proxy integration and cross-checked against
MercuryWorkshop’s official examples), which supersede the earlier Proxy2 set. Dependencies are
pinned; `npm install` includes `@mercuryworkshop/wisp-js@0.4.1`.

## Run locally

Install [Deno 2](https://deno.com/) and Node 22 or newer (Node 24 recommended), then:

```sh
npm ci
npm run build
npm run dev
```

Open **http://localhost:8000**. The dev command starts the Deno shell, five isolated Deno runtimes,
and your local Wisp server at **ws://localhost:9000/wisp/**. No third-party public relay is chosen
automatically.

| Browser selection                     | Local runtime    | Networking                                            |
| ------------------------------------- | ---------------- | ----------------------------------------------------- |
| **Scramjet stable (1.1.0)** — default | `localhost:8100` | BareMux → Epoxy or Libcurl                            |
| Scramjet 2.0.0-alpha                  | `localhost:8200` | Built-in Epoxy                                        |
| Scramjet 2.0.2-alpha                  | `localhost:8300` | BareMux → Epoxy or Libcurl; custom compatibility glue |
| Scramjet 2.0.67-alpha.2               | `localhost:8400` | Controller 0.0.14 → BareMux BareClient (Epoxy or Libcurl) + URL-guard plugin |
| Ultraviolet 3.2.10 — legacy           | `localhost:8500` | BareMux → Epoxy or Libcurl                            |
| Remote session (isolation)            | `localhost:9100` | Remote pixel stream (`HEADLESS_SERVICE=1`)            |

The **headless engine** is remote browser isolation: the page renders in a server-side headless
Chromium (see [headless/README.md](headless/README.md)) and the client drives it by mouse and
keyboard over a pixel stream. Destinations are contacted by the service host, never by the client,
and content crosses the network as images. Start it in dev with `HEADLESS_SERVICE=1 npm run dev`; in
production it runs on the relay host and its origin is registered as the engine's runtime origin.

-Epoxy is the default and is covered by the main browser tests. Libcurl is an alternative transport;
browser coverage is recorded separately from engine availability. +Epoxy is the default and is
covered by the main browser tests. Libcurl is a fully tested alternative: every engine passes the
same deep checks through both transports, including POST requests, workers, destination WebSockets,
redirects, and cookies. + +Two transport findings from this work, since both are pinned legacy
releases: + +- **2.0.0-alpha destination WebSockets** bypass that release's unfinished embedded
socket hook. They run through a bridge on the runtime page — Libcurl first (its curl-based sockets
deliver immediately), modern Epoxy 3.0.1 as the automatic fallback (its wasm send queue drains on
incoming relay traffic and can stall on an idle connection). Pages on this release still use its
built-in Epoxy for HTTP. +- **Libcurl sends HTTP/2 upgrade headers** (`Upgrade: h2c`,
`Connection: Upgrade, HTTP2-Settings`) on every request. Node-based destination servers that divert
upgrade-classified requests away from their normal request handler will not serve Libcurl traffic;
ordinary sites that ignore or gracefully reject the `h2c` offer are unaffected. The test fixture
runs its WebSocket endpoint on a separate port for exactly this reason.

**Proxy3 port (2026-10-26):** the engine integration reference moved from the Proxy2 examples to
the supplied **Proxy3** set (same pinned Scramjet artifacts — hashes verified byte-identical;
the glue is what changed, extracted from AIO's hybrid integration). For the 2.0.67-alpha.2
engine this brought two changes, both verified through the full deep matrix on Chromium and
Firefox with both transports:

- The Controller now drives a **BareMux BareClient** (epoxy or libcurl over Wisp) instead of a
  transport module instantiated directly in the page — the same path the other engines already
  take. Upstream fetches use `redirect: "manual"` with `duplex: "half"` streaming. One fix over
  the upstream example: response headers are flattened into repeated `[name, value]` pairs,
  because libcurl's transport reports each name as an array — without this, server-set cookies
  never applied on that transport.
- A **URL-guard plugin** (`public/runtime/guard.js`, ported from AIO) is attached to every
  proxied frame. Stock 2.0.67-alpha.2 coerces undefined route values into real `/undefined`
  navigations (TikTok shows its own 404 instead of the feed) and deletes `window.navigation`,
  which DuckDuckGo-style SPA search depends on. The guard blocks or sanitizes those navigations
  and reinstates a minimal Navigation API stub. A browser test drives `location = undefined` on
  a fixture page and asserts the engine stays put.

**Development is split into phases:** see [ROADMAP.md](ROADMAP.md). Phase 1 is the locally verified
foundation; Phase 2 is configuring your live Deno website and owned relay, followed by
compatibility, browser features, advanced tools and release polish.

## Included

### Workspace actions

- Right-click shortcuts, tabs, saved bookmarks, history rows, collection entries or empty shell
  areas for context-specific actions. Focus a shortcut/tab/row and press **Shift+F10** for the
  same menu. Arrow keys navigate, Right/Left enter/leave a submenu, Escape dismisses. Native
  text-input menus remain available. Menus do not reach inside third-party rewriting-engine pages.
- Shortcut options include Edit, Favorite, Copy address, Open in new tab, Open with engine,
  Move to folder, and Remove with a six-second **undo**. Shortcut and library-row options buttons
  provide a direct click/touch path; touch and pen users can also long-press.
- Pin tabs from their menu for compact icon-only entries at the strip's start. Pins are restored
  with the session; drags stay within the pinned/unpinned group. Close Others and Close to the
  Right show counts and ask for confirmation. Existing Reopen restores closed browsing tabs.
- Type a folder name in Edit shortcut to create a group. Home renders collapsible folder sections;
  drag shortcuts onto a folder or move them through the menu. Sorting works inside each group.
- **Remote session** adds a local context menu, view zoom (Ctrl/Cmd+wheel or menu, 50–300%), scrollbar
  panning, fullscreen, selection copy, paste and text composition. Browser-reserved window/tab
  shortcuts cannot reliably be forwarded. Clipboard/fullscreen failures are reported, not hidden.
  Capture defaults to JPEG quality 78 with bounded DPR-aware rendering and a pixel budget; actual
  capture dimensions are checked. If CDP supplies smaller frames, a capped screenshot fallback
  favors readable text over frame rate. Cache clearing now preserves remote website cookies.

The remote service must be rebuilt with its updated client, `headless/helpers.mjs`, `menus.js`, and
`workspace.css`; changing the frontend alone does not update an already-running EC2 container.
See [the service deployment and control guide](headless/README.md),
[the feature plan](.plans/context-menus-workspace-features-plan.md), and
[streaming research](reports/Remote%20session%20streaming%20improvements.md).

### Public naming

The interface/PWA use **ojjy** and generic engine labels (stable, A0, A2, A67, legacy, remote
session). Engine versions and saved IDs are unchanged; [credits and source](public/credits.html)
document the corresponding upstream projects. Content routes use `/runtime/content/`; engine
downloads retain the existing neutral runtime aliases, and the remote-session service's WebSocket
path is `/session/`. Raw `/vendor/` trees and source maps are not served. Existing saved bookmarks,
settings, website storage, and older JSON exports are not reset or renamed.

These are cosmetic/publication changes, **not concealment or a guarantee against filtering**.
Configured hostnames, relay URLs, source repositories, legal notices, native JavaScript APIs and
upstream executable identifiers remain identifiable. Required licenses and attribution are retained.
Do not blanket-replace names in vendor JavaScript/WASM: doing so can break RPC, generated scripts,
database names, and native APIs such as `Proxy`. After updating, reload existing runtime tabs to
allow the service worker to update; restored destinations are real URLs, not old encoded paths.

- Exact default hub palette: `#0a1628`, `#111d2e`, `#162a42`, `#1e3a5f`, `#2e6bbd`.
- App-managed tabs, lazy session restoration, real destination addresses, back/forward/reload.
- Desktop floating pill controls, optional docked controls, responsive mobile layout and settings.
- Search-first home with compact destination cards, a native sort picker, and secondary tools under
  **More**. The immediate **Exit** action is separate from tab controls.
- Six engine choices (five rewriting engines plus the headless remote-isolation browser), five
  search providers, and your configurable relay endpoint with one-click **use default** / **use
  backup relay** switching.
- Optional site password gate: set `SITE_PASSWORD` on the outer app to serve a password page first.
- Appearance controls: eighteen built-in themes — the original twelve plus OLED, Polar slate, Mauve
  mocha, Sandstone, Signal high contrast and Mint porcelain — plus a fully custom eleven-color
  editor with shareable theme codes; an accent color that overrides any theme (buttons re-pick
  readable ink automatically); corner-radius, motion-level, glass-blur and home-background-pattern
  options; six workspace layouts; twelve interface fonts; eight cursor styles (accent-tinted shapes
  or a custom image). Frequent actions and keyboard interactions are instant; occasional dialogs use
  interruptible, reduced-motion-aware fades.
- Searchable settings with All, Appearance, Home, Connection, Privacy and Data categories.
- Six visual workspace presets and eighteen palette previews. Closing or pressing Escape cancels
  previews; **save settings** commits them. Reset appearance never clears browsing data or changes
  connection settings. Preview galleries are folded by default and expand for matching searches.
- Optional dashboard sections, three shortcut densities, and a favourite-bookmarks bar.
- Named tab collections: save, rename, append lazily, export/import and confirm removal. These save
  URLs/engine choices, **not independent website sessions or cookie profiles**.
- Local home wallpapers: validated PNG/JPEG/WebP, up to 3 MB and 16 million pixels, rasterized to at
  most 1920×1080. Upload/removal is staged until Save. Stored separately in IndexedDB, never
  uploaded, fetched remotely, or included in JSON exports. Browser storage can be evicted.
- **Backgrounds** on home opens image/theme customization directly: eight static scenes (Clean,
  Aurora, Dusk, Mesh, Night sky, Coast, Blueprint, Dot paper) follow your palette. Switching to a
  generated scene preserves your saved image; switch **Background source** back to My image to use
  it again. Like other appearance settings, previews are reversible until saved.
- Panic exit: a recorded non-typing key or the labelled **Exit** header button instantly replaces
  the site with a cover page of your choice.
- Address-bar suggestions, bookmark folders, per-engine history chips, day clearing, a live
  connection status panel, stalled-page notices, middle-click tab close and a tab overflow menu.
- Bookmark creation, editing, favorites, shortcuts, import/export, local history, local suggestions.
- Theme selection, reduced-motion/performance mode, browser-tab title/icon customization,
  fullscreen.
- Hostname filtering, supported target-blank link capture, scoped cache clearing, relay WebSocket
  check.
- A bounded, in-memory connection event log. A full website request inspector, Tor routing, wrapper
  modes, accounts and developer playground are specified as later work in the blueprint.

Changing engine reopens the canonical address; it does **not** transfer cookies, unsaved forms, or
live sockets. Existing tabs keep their selected engine when the default changes. Use **reload active
page with selected engine** to explicitly switch.

### Workspace layouts and controls

Settings → Appearance offers Original top tabs, Expanded sidebar, Compact icon rail, Classic
browser, Bottom controls and Focus workspace. Sidebar collapse/expand does not restart websites.
Classic and Bottom reserve space for docked controls. Desktop sidebars become readable top tabs on
screens at or below 700 px. Focus retains a visible **restore workspace** button; Escape exits when
the shell has focus and no dialog is open. Websites in cross-origin frames cannot be expected to
forward their keyboard events to this shell.

On a fine-pointer desktop with Full motion, hovering a floating navigation segment expands it while
its neighbours share the remaining space. The pill's outer width and the icons' proportions stay
constant; rapid pointer changes retarget a 150 ms transform transition. Docked controls,
mobile/touch input, keyboard navigation, reduced/subtle motion and performance mode remain static.
Notifications use reversible fades; a newer notification cancels an earlier one's pending hide.

Collections are available through **tab collections** on the home footer, or an optional dashboard
section. Limits are 12 collections and 20 tabs per collection; the overall live-tab cap stays 20.
Opening never closes your current tabs, and unavailable engines/capacity skips are reported. Exports
include validated collections; imports merge bookmarks and collections but do not automatically
apply imported traffic-routing settings. Wallpaper bytes remain local.

Design research used the supplied Obsidian, Nebula, Daydream and Space source archives for
interaction ideas, implemented with ojjyProxy's existing native controls and palette tokens; no
third-party UI framework, branding assets, account integration or animation library was added.
Research, interview decisions and acceptance criteria are in
[the workspace implementation spec](.plans/proxy-workspace-ui-spec.md). The later screenshot-driven
simplification, expanding navigation and background choices are specified in
[the quiet modern UI spec](.plans/quiet-modern-ui-spec.md).

## Deploy the website from GitHub to Deno

The current `deno.json` uses Deno Deploy’s **dynamic runtime** configuration with `server.ts`. Built
browser assets are committed, so a deployment needs no install or build command. The frontend only
serves assets/configuration; destination connections go directly from the browser to your external
Wisp relay.

1. Connect **[jo-jo-home/ojjyProxy](https://github.com/jo-jo-home/ojjyProxy)** to a new Deno Deploy
   application, using the repository root and `main` branch.
2. Deploy the owned relay separately using [the relay instructions](#deploy-your-owned-wisp-relay).
3. Configure a distinct HTTPS origin for each runtime. With a custom domain, attach the app hostname
   and five runtime subdomains to **the same Deno application**. The server selects the runtime from
   the hostname; six codebases are unnecessary.
4. Set `PUBLIC_APP_ORIGIN`, `WISP_URL`, and `RUNTIME_ORIGINS` in Deno’s production environment.
   Optionally set `SITE_PASSWORD` on the outer app only to require that password before the website
   loads. Example values below are **placeholders**:

```text
PUBLIC_APP_ORIGIN=https://proxy.example.com
WISP_URL=wss://wisp.example.com/wisp/
```

```json
{
  "sj-1.1.0": "https://stable.proxy.example.com",
  "sj-2.0.0-alpha": "https://alpha0.proxy.example.com",
  "sj-2.0.2-alpha": "https://alpha2.proxy.example.com",
  "sj-2.0.67-alpha.2": "https://alpha67.proxy.example.com",
  "uv-3.2.10": "https://uv.proxy.example.com"
}
```

Paste that JSON as the value of **`RUNTIME_ORIGINS`**. Each value must be a unique HTTPS origin,
with no path. These must be actual assigned domains, not invented names. Set the same configuration
on every runtime deployment if using separate apps.

**Without a custom domain:** connect the same repository to five additional Deno applications and
set each app’s **`RUNTIME_ENGINE`** to the appropriate engine ID. Use their real Deno production
URLs in the outer app’s `RUNTIME_ORIGINS`, and set `PUBLIC_APP_ORIGIN` to the outer app’s URL on
each runtime. App-count limits depend on your Deno plan.

5. Add the outer and five runtime origins to the relay’s `ALLOWED_ORIGINS`, then deploy/restart it.
6. Open the website, test the relay in Settings, and load a page with each engine. Preview URLs also
   need their own matching parent/runtime configuration; production origins are not interchangeable
   with preview origins.

### Why five runtime origins?

Stable and alpha0 hardcode the same cookie/config database, while BareMux discovery and several
website storage hooks are origin-wide. Different service-worker paths alone do not separate that
data. The outer shell owns app data; each engine owns a separate origin and `/runtime/`
service-worker scope. The supplied alpha0 bundles receive a documented cross-origin singleton guard
during the build.

### Deno hosting boundary

[Deno Deploy’s current policy lists forward proxies as unacceptable use](https://docs.deno.com/deploy/acceptable_use_policy/).
**The Wisp relay is therefore an external service, not a Deno Deploy endpoint.** The policy does not
explicitly approve this frontend-only arrangement. Provider acceptance remains an unresolved
deployment condition; the same Deno server can also run on a host that permits the whole use case.

## Compact single-origin deployment (restrictive-network mode)

For networks that block known hosting domains or multi-origin layouts, ojjyProxy can run as **one
origin**: the shell, one runtime, and the Wisp relay all behind a single domain — the same
architecture used by proxies that survive school and workplace filtering. Your multi-origin Deno
setup stays as it is; this is an additional deployment shape.

All runtime asset URLs are already **filter-hygienic**: no engine or transport file is named after
the tools it embeds (`/runtime/vendor/app.js`, not `scramjet.all.js`), because school keyword
filters block URLs containing known proxy-tool names. A unit test keeps those URLs neutral, and
vendor downloads retry before surfacing an error that names filtering as a possible cause.

On one VPS (Fly.io, Railway, Hetzner, any host permitting outbound TCP):

1. **Frontend + runtime** — run the same Deno server with:

```sh
SINGLE_RUNTIME=1 RUNTIME_ENGINE=sj-1.1.0 \
WISP_URL=wss://your-domain.example.com/wisp/ \
deno task start
```

`SINGLE_RUNTIME=1` serves the shell at `/` and the Scramjet 1.1.0 runtime under `/runtime/` on this
origin, and the engine selector honestly offers only the engine that is actually deployed.

2. **Relay** — start the owned relay beside it: `npm run relay` (port 9000).

3. **Reverse proxy** — terminate TLS and route the two services with the included
   [compact.Caddyfile.example](relay/compact.Caddyfile.example): everything to the Deno server,
   `/wisp/*` (WebSocket upgrades included) to the relay.

4. **CDN front (recommended)** — create a free AWS CloudFront distribution pointing at your domain.
   The site becomes a random `*.cloudfront.net` address — a plain CDN subdomain with no proxy
   category, reachable on 443 only, with no separate relay host for a filter to flag.

Two client-side options help on monitored screens: **Discreet input** (Settings → More options)
masks the address bar with dots, and the existing tab title/icon appearance controls rename what
observers see in tab lists.

## Deploy your owned Wisp relay

The included Node server is `relay/server.mjs`, using the same pinned Wisp dependency as Proxy2.
Choose a host with persistent WebSockets and permitted outbound TCP forwarding.

Example container deployment, from the repository root:

```sh
docker build -f relay/Dockerfile -t ojjyproxy-wisp .
docker run -d --name ojjyproxy-wisp --restart unless-stopped \
  -p 127.0.0.1:9000:9000 \
  -e ALLOWED_ORIGINS='https://proxy.example.com,https://stable.proxy.example.com,https://alpha0.proxy.example.com,https://alpha2.proxy.example.com,https://alpha67.proxy.example.com,https://uv.proxy.example.com' \
  ojjyproxy-wisp
```

Replace those domains. Terminate TLS with Caddy using `relay/Caddyfile.example`, replacing
`wisp.example.com` with your relay hostname. Caddy forwards WebSocket upgrades to the relay. Set the
website’s `WISP_URL` to **`wss://your-relay-host/wisp/`**.

The relay exposes `/health` and `/wisp/`, accepts configured browser origins, blocks
private/loopback destinations by default, and uses Wisp’s total per-connection stream limit. Origin
checking is not user authentication. The 0.4.1 per-host stream limiter is disabled because its
upstream implementation iterates a non-iterable object.

Settings can also fill the endpoint with one click: **use default** restores the server’s `WISP_URL`
(the operator may point this at another site’s relay, whose operator then sees those destination
connections), and **use backup relay** switches to ojjyProxy’s own CloudFront relay. Switching is
always manual.

For development, `npm run relay` starts the relay alone on `127.0.0.1:9000`. `WISP_TEST_MODE=1`
permits the loopback fixture only in nonproduction tests bound to `127.0.0.1`; it is never enabled
for production.

## Keep it running

The relay lives on your own server, so these small habits keep the whole site alive:

1. **Updating the frontend** — pushing to `main` redeploys the Deno apps automatically.
2. **Updating the relay (EC2)** — pull and rebuild in one step:
   ```sh
   ssh <your-ec2-host> /opt/ojjyproxy/update-relay.sh
   ```
   The script recreates the container with the origins from `/opt/ojjyproxy/relay.env`.
3. **DuckDNS keepalive** — a five-minute cron at `/opt/ojjyproxy/duckdns.sh` keeps the hostname
   pointed at EC2 once `/opt/ojjyproxy/duckdns.token` contains your DuckDNS token. Preferably assign
   an Elastic IP so the address never changes at all.
4. **Origin lock (recommended)** — add a custom origin header (`X-Ojjy-Origin-Secret`) to the
   CloudFront distribution, then require it from Caddy so only your distribution can reach EC2.
5. **Before your hosting credits expire** — move the relay (the same Docker image, or compact mode
   on one VPS) to a host you pay for, or the site keeps serving but stops browsing.

Optional live production check after any deployment change:

```sh
LIVE_SITE_PASSWORD=your-site-password npm run test:live
```

## Verify

```sh
npm run check
npx playwright install chromium
npm run test:browser
```

The browser suite runs its dev stack on **port 8700** (`DEV_PORT`), keeping it clear of port 8000,
where a sibling project's dev server tends to respawn whenever the port is free. `npm run dev` for
manual browsing still defaults to port 8000.

Browser tests cover all five rewriting engines through the owned relay using a controlled
destination: rewritten JavaScript, dynamic fetch, client/server cookies, links, canonical address
updates, back navigation, domain filtering, POST bodies, dedicated workers, destination WebSocket
echo, redirects with query and fragment, the responsive interface, and the appearance studio
(themes, accent override, radius, motion, glass, patterns, theme codes, fonts and cursors). The
headless engine has its own end-to-end check (remote render, pixel assertions, link clicks, history
and the blocklist). The full deep matrix passes on **Chromium and Firefox**, and on **WebKit for
stable, 2.0.0-alpha, and 2.0.2-alpha with every deep check**. These are controlled-fixture checks,
not a guarantee for all websites or browsers.

Firefox required four compatibility fixes, each recorded in the build manifest:

- **No cross-origin isolation anywhere.** Nothing in the stack uses SharedArrayBuffer. A
  require-corp shell forced COEP onto proxied documents, and Firefox then rejected their same-origin
  worker and blob scripts, so the shell ships without COEP and proxied documents have the engine's
  COEP removed while keeping CORP/COOP for embedding.
- **Buffered request bodies.** Firefox does not expose fetch bodies through `Request.body` and drops
  stream bodies at `Request` construction. The runtime service worker buffers each non-GET body once
  via `clone().arrayBuffer()` and shadows the getter; the vendored and embedded BareMux clients and
  UV's bundled client carry bodies from the fetch init across the worker boundary instead of
  re-reading that getter, with transfer lists restricted to ArrayBuffers.
- **Destination WebSocket bridging** for 2.0.0-alpha (Libcurl first, modern Epoxy fallback) also
  covers Firefox, whose embedded socket hook previously sent nothing.
- **Known gap:** dedicated workers rewritten through the `?dest=worker` service-worker path load but
  never deliver their first message on Firefox for stable, 2.0.0-alpha, 2.0.67-alpha.2, and UV;
  2.0.2-alpha workers (inline data URLs) work. Tests record this as an annotation instead of
  asserting it.

WebKit adds two engine-specific gaps, both recorded in the test matrix rather than hidden:

- **2.0.67-alpha.2 is skipped on WebKit.** Its wasm rewriter emits arrow-comment chains
  (`=>/*scramtag*/{`) that WebKit's parser rejects, and its controller RPC hits a DataCloneError
  inside the service worker. Both live in runtime-generated, wasm-driven code that a build patch
  cannot reach.
- **UV 3.2.10 POST bodies never deliver on WebKit.** Pages, scripts, cookies, and navigation pass;
  the deep block is annotated and skipped there.

Optional external HTTPS smoke tests:

```sh
LIVE_PROXY_TESTS=1 npm run test:browser -- --grep 'HTTPS destination'
```

Alternative-transport fixture checks:

```sh
PROXY_TEST_TRANSPORT=libcurl npm run test:browser -- --grep 'loads through'
```

Local verification completed with 3 Deno server tests, 6 Node tests, all five default-engine
Chromium fixtures, the responsive UI check and external HTTPS checks for stable/alpha67. Libcurl
fixture behavior was additionally verified on its four supported adapters; alpha0 always uses
built-in Epoxy.

## Source, credits and the extensive blueprint

- **[Current final-project blueprint](reports/ojjyProxy%20multiversion%20project%20blueprint.md)** —
  approximately 10,000 words explaining screens, behavior, source contributions, architecture,
  deployment and future features.
- [Proxy2 version audit](research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md).
- [Screenshot-inspired design specification](research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md).
- Earlier research files are historical; their alpha67-default recommendation is superseded.
- Primary examples: user-supplied **Proxy2** (historical) and now **Proxy3** (current engine
  integration reference, extracted from AIO's hybrid proxy integration), shared by **The Fool**,
  who also helped with UI development. Other references: Mercury Workshop Scramjet, Epoxy,
  BareMux, Wisp and templates; Titanium Network Ultraviolet; InvisiProxyLTS; ojjy’s game hub.

Original application code is published under **AGPL-3.0-only**. Upstream components retain their own
terms and notices. `public/notices/` preserves available package notices, and
`public/asset-manifest.json` records versions, hashes and the alpha0 adaptation. Old Scramjet and
the installed UV package have metadata/license-text inconsistencies; the blueprint records those
conflicts rather than treating every artifact as MIT. Corresponding upstream source
repositories/tarballs are identified in the research and notices.

Local bookmarks/history live under `ojjyproxy-app-v1`. Disabling local history only stops this app’s
visit records. Title/icon changes are cosmetic, and the relay still sees destination connection
metadata. Cache clearing leaves website cookies and bookmarks intact.
