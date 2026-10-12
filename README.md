# ojjyProxy

A standalone, hub-blue browser workspace using **your own Wisp relay**, four Scramjet releases, and Ultraviolet. Built for a Deno-served website, with the navy theme from [ojjy’s game hub](https://github.com/jo-jo-home/ojjys-game-hub) and screenshot-inspired pill controls.

**Scramjet 1.1.0 stable is the default.** The primary engine integration reference is the supplied **Proxy2** examples. Dependencies are pinned; `npm install` includes `@mercuryworkshop/wisp-js@0.4.1`.

## Run locally

Install [Deno 2](https://deno.com/) and Node 22 or newer (Node 24 recommended), then:

```sh
npm ci
npm run build
npm run dev
```

Open **http://localhost:8000**. The dev command starts the Deno shell, five isolated Deno runtimes, and your local Wisp server at **ws://localhost:9000/wisp/**. No third-party public relay is chosen automatically.

| Browser selection | Local runtime | Networking |
|---|---|---|
| **Scramjet stable (1.1.0)** — default | `localhost:8100` | BareMux → Epoxy or Libcurl |
| Scramjet 2.0.0-alpha | `localhost:8200` | Built-in Epoxy |
| Scramjet 2.0.2-alpha | `localhost:8300` | BareMux → Epoxy or Libcurl; custom compatibility glue |
| Scramjet 2.0.67-alpha.2 | `localhost:8400` | Matched controller 0.0.14 → direct Epoxy or Libcurl |
| Ultraviolet 3.2.10 — legacy | `localhost:8500` | BareMux → Epoxy or Libcurl |

Epoxy is the default and is covered by the main browser tests. Libcurl is an alternative transport; browser coverage is recorded separately from engine availability.

**Development is split into phases:** see [ROADMAP.md](ROADMAP.md). Phase 1 is the locally verified foundation; Phase 2 is configuring your live Deno website and owned relay, followed by compatibility, browser features, advanced tools and release polish.

## Included

- Exact default hub palette: `#0a1628`, `#111d2e`, `#162a42`, `#1e3a5f`, `#2e6bbd`.
- App-managed tabs, lazy session restoration, real destination addresses, back/forward/reload.
- Desktop floating pill controls, optional docked controls, responsive mobile layout and settings.
- Five engine/version choices, five search providers, and your configurable owned Wisp endpoint.
- Bookmark creation, editing, favorites, shortcuts, import/export, local history, local suggestions.
- Theme selection, reduced-motion/performance mode, browser-tab title/icon customization, fullscreen.
- Hostname filtering, supported target-blank link capture, scoped cache clearing, relay WebSocket check.
- A bounded, in-memory connection event log. A full website request inspector, Tor routing, wrapper modes, accounts and developer playground are specified as later work in the blueprint.

Changing engine reopens the canonical address; it does **not** transfer cookies, unsaved forms, or live sockets. Existing tabs keep their selected engine when the default changes. Use **reload active page with selected engine** to explicitly switch.

## Deploy the website from GitHub to Deno

The current `deno.json` uses Deno Deploy’s **dynamic runtime** configuration with `server.ts`. Built browser assets are committed, so a deployment needs no install or build command. The frontend only serves assets/configuration; destination connections go directly from the browser to your external Wisp relay.

1. Connect **[jo-jo-home/ojjyProxy](https://github.com/jo-jo-home/ojjyProxy)** to a new Deno Deploy application, using the repository root and `main` branch.
2. Deploy the owned relay separately using [the relay instructions](#deploy-your-owned-wisp-relay).
3. Configure a distinct HTTPS origin for each runtime. With a custom domain, attach the app hostname and five runtime subdomains to **the same Deno application**. The server selects the runtime from the hostname; six codebases are unnecessary.
4. Set `PUBLIC_APP_ORIGIN`, `WISP_URL`, and `RUNTIME_ORIGINS` in Deno’s production environment. Example values below are **placeholders**:

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

Paste that JSON as the value of **`RUNTIME_ORIGINS`**. Each value must be a unique HTTPS origin, with no path. These must be actual assigned domains, not invented names. Set the same configuration on every runtime deployment if using separate apps.

**Without a custom domain:** connect the same repository to five additional Deno applications and set each app’s **`RUNTIME_ENGINE`** to the appropriate engine ID. Use their real Deno production URLs in the outer app’s `RUNTIME_ORIGINS`, and set `PUBLIC_APP_ORIGIN` to the outer app’s URL on each runtime. App-count limits depend on your Deno plan.

5. Add the outer and five runtime origins to the relay’s `ALLOWED_ORIGINS`, then deploy/restart it.
6. Open the website, test the relay in Settings, and load a page with each engine. Preview URLs also need their own matching parent/runtime configuration; production origins are not interchangeable with preview origins.

### Why five runtime origins?

Stable and alpha0 hardcode the same cookie/config database, while BareMux discovery and several website storage hooks are origin-wide. Different service-worker paths alone do not separate that data. The outer shell owns app data; each engine owns a separate origin and `/runtime/` service-worker scope. The supplied alpha0 bundles receive a documented cross-origin singleton guard during the build.

### Deno hosting boundary

[Deno Deploy’s current policy lists forward proxies as unacceptable use](https://docs.deno.com/deploy/acceptable_use_policy/). **The Wisp relay is therefore an external service, not a Deno Deploy endpoint.** The policy does not explicitly approve this frontend-only arrangement. Provider acceptance remains an unresolved deployment condition; the same Deno server can also run on a host that permits the whole use case.

## Deploy your owned Wisp relay

The included Node server is `relay/server.mjs`, using the same pinned Wisp dependency as Proxy2. Choose a host with persistent WebSockets and permitted outbound TCP forwarding.

Example container deployment, from the repository root:

```sh
docker build -f relay/Dockerfile -t ojjyproxy-wisp .
docker run -d --name ojjyproxy-wisp --restart unless-stopped \
  -p 127.0.0.1:9000:9000 \
  -e ALLOWED_ORIGINS='https://proxy.example.com,https://stable.proxy.example.com,https://alpha0.proxy.example.com,https://alpha2.proxy.example.com,https://alpha67.proxy.example.com,https://uv.proxy.example.com' \
  ojjyproxy-wisp
```

Replace those domains. Terminate TLS with Caddy using `relay/Caddyfile.example`, replacing `wisp.example.com` with your relay hostname. Caddy forwards WebSocket upgrades to the relay. Set the website’s `WISP_URL` to **`wss://your-relay-host/wisp/`**.

The relay exposes `/health` and `/wisp/`, accepts configured browser origins, blocks private/loopback destinations by default, and uses Wisp’s total per-connection stream limit. Origin checking is not user authentication. The 0.4.1 per-host stream limiter is disabled because its upstream implementation iterates a non-iterable object.

For development, `npm run relay` starts the relay alone on `127.0.0.1:9000`. `WISP_TEST_MODE=1` permits the loopback fixture only in nonproduction tests bound to `127.0.0.1`; it is never enabled for production.

## Verify

```sh
npm run check
npx playwright install chromium
npm run test:browser
```

Browser tests cover all five engines through the owned relay using a controlled destination: rewritten JavaScript, dynamic fetch, client/server cookies, links, canonical address updates, back navigation, domain filtering and the responsive interface. They are Chromium checks, not a guarantee for all websites or browsers.

Optional external HTTPS smoke tests:

```sh
LIVE_PROXY_TESTS=1 npm run test:browser -- --grep 'HTTPS destination'
```

Alternative-transport fixture checks:

```sh
PROXY_TEST_TRANSPORT=libcurl npm run test:browser -- --grep 'loads through'
```

Local verification completed with 3 Deno server tests, 6 Node tests, all five default-engine Chromium fixtures, the responsive UI check and external HTTPS checks for stable/alpha67. Libcurl fixture behavior was additionally verified on its four supported adapters; alpha0 always uses built-in Epoxy.

## Source, credits and the extensive blueprint

- **[Current final-project blueprint](reports/ojjyProxy%20multiversion%20project%20blueprint.md)** — approximately 10,000 words explaining screens, behavior, source contributions, architecture, deployment and future features.
- [Proxy2 version audit](research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md).
- [Screenshot-inspired design specification](research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md).
- Earlier research files are historical; their alpha67-default recommendation is superseded.
- Primary examples: user-supplied **Proxy2**. Other references: Mercury Workshop Scramjet, Epoxy, BareMux, Wisp and templates; Titanium Network Ultraviolet; InvisiProxyLTS; ojjy’s game hub.

Original application code is published under **AGPL-3.0-only**. Upstream components retain their own terms and notices. `public/notices/` preserves available package notices, and `public/asset-manifest.json` records versions, hashes and the alpha0 adaptation. Old Scramjet and the installed UV package have metadata/license-text inconsistencies; the blueprint records those conflicts rather than treating every artifact as MIT. Corresponding upstream source repositories/tarballs are identified in the research and notices.

Local bookmarks/history live under `ojjyproxy-app-v1`. Disabling local history only stops this app’s visit records. Title/icon changes are cosmetic, and the relay still sees destination connection metadata. Cache clearing leaves website cookies and bookmarks intact.
