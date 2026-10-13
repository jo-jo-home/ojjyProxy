# ojjyProxy development phases

**Current stage: Phase 1 — working local foundation.** The project is standalone. Scramjet **1.1.0 stable remains the default in every phase**; all four supplied Scramjet releases and Ultraviolet stay available. Proxy2 is the primary engine reference. The game hub supplies the blue identity, and the screenshots supply the pill-bar/settings composition.

The [extensive blueprint](reports/ojjyProxy%20multiversion%20project%20blueprint.md) explains the finished product. This roadmap turns that vision into ordered, verifiable deliveries.

## Phase 0 — research and product specification · completed

- Audit Proxy2, engine distributions, transports, templates, InvisiProxy branches and demo tools.
- Extract the game hub’s actual colors, typography and component patterns.
- Define the five release choices and version-specific APIs.
- Identify origin-wide cookie/transport collisions and the Deno/relay hosting boundary.
- Specify the final screens, behavior, future tools and compatibility expectations.

**Completion check:** sourced version audit, screenshot design note and roughly 10,000-word current blueprint are in the repository. Earlier research is retained as historical material.

## Phase 1 — working standalone foundation · implemented and locally verified

- Deno frontend and five isolated engine runtimes.
- Scramjet 1.1.0 default; 2.0.0-alpha, 2.0.2-alpha, 2.0.67-alpha.2 and UV selectable.
- Owned Wisp server, local development launcher, container and TLS configuration example.
- Hub-blue home, floating/docked controls, mobile layout and sectioned settings dialog.
- App tabs, canonical addresses, navigation, bookmarks, local history and saved preferences.
- Search providers, local autocomplete, themes, title/icon appearance and fullscreen.
- Hostname filtering, scoped cache clearing, relay check and bounded connection log.
- Pinned assets, notice/provenance inventory, source repository and CI checks.

**Verified checks:** 3 Deno server tests, 6 Node tests, 8 Chromium checks with default Epoxy including two external HTTPS checks. Controlled-page checks cover all five releases, rewritten JavaScript, dynamic fetch, server/client cookies, links, address updates, back navigation and filtering. Additional fixture runs cover Libcurl on the four adapters that support it; alpha0 remains built-in Epoxy.

**Boundary:** local verification is complete for those cases. Production Deno, DNS and the public owned relay still need configuration. Complex sites, other browsers, workers and longer sessions belong to subsequent gates.

## Phase 2 — your owned relay and live Deno website · next

1. Deploy `relay/server.mjs` on your chosen forwarding-capable host.
2. Assign its real hostname and HTTPS/WSS certificate.
3. Connect `jo-jo-home/ojjyProxy` to Deno Deploy using `server.ts`.
4. Assign the outer app and five runtime origins—custom domains on one app, or separate runtime apps using the same repository.
5. Set `WISP_URL`, `PUBLIC_APP_ORIGIN` and `RUNTIME_ORIGINS`.
6. Configure the relay’s `ALLOWED_ORIGINS` with those exact origins.
7. Exercise each engine from the actual deployed website and check a relay restart.

**Completion check:** the public UI loads over HTTPS, the owned WSS connection opens, all five configured runtime origins load their pinned release, and website traffic uses your relay. Real addresses replace all placeholders. Deployment instructions are in [README.md](README.md).

## Phase 3 — browser compatibility and reliability · in progress

- Verify Firefox and Safari capability paths and expose accurate unsupported-state messages.
- Test redirects, fragments, SPA navigation, forms/POST bodies, streaming, destination WebSockets and workers.
- Test persistent cookies after reload, multiple same-version tabs and simultaneous different-version tabs.
- Exercise service-worker termination/revival and the alpha67 live-controller lifecycle.
- Add request-aware errors, relay disconnect/reconnect states and explicit alternate-engine recovery.
- Never automatically replay a form submission or claim engine switching transfers sessions.
- Validate target-blank and scripted popups individually; distinguish supported capture from unsupported cases.
- Expand CI with stable, controlled fixtures rather than relying on changing third-party pages.

**Verified so far:** the full deep fixture matrix passes on Chromium (Epoxy and Libcurl), Firefox
(Epoxy and Libcurl), and WebKit for stable, 2.0.0-alpha, and 2.0.2-alpha. Firefox needed the
shell's cross-origin isolation removed, request bodies buffered past its absent `Request.body`
getter, engine document COEP normalized away, and 2.0.0-alpha sockets bridged. Recorded gaps:
`?dest=worker` rewritten workers deliver only on 2.0.2-alpha under Firefox; 2.0.67-alpha.2 is
skipped on WebKit (wasm rewriter arrow-comment output plus a controller-RPC DataCloneError);
UV POST bodies never deliver on WebKit.

**Completion check:** a release/browser/feature matrix identifies passes and limitations; failed cases give actionable errors; version data stays isolated; returning tabs recover without frozen controllers or accidental POST replay.

## Phase 4 — complete the everyday browser experience · in progress

- Reorder/pin/duplicate tabs, reopen a closed tab and improve tab overflow/navigation boundaries.
- Add bookmark folders, home filtering, real recently-opened sorting and richer history controls.
- Refine screenshot parity: six navigation segments and adjacent bookmark action.
- Expose per-engine transport capabilities and live session/default-setting distinctions.
- Improve keyboard shortcuts, focus cycling, screen-reader labels and small/landscape layouts.
- Add optional appearance presets, background modes, density controls and a configured live game-hub link.
- Add deliberate new-window modes only after testing their worker, isolation and popup behavior.

**Verified so far:** the browsing bar matches the reference layout (six-segment pill, bookmark star
inside the address capsule); every icon is a clean consistent vector including tab close, strip
buttons, dialog close, and star toggles; closed tabs reopen from a strip button or Alt+Shift+T;
"recent" tracks real last-opened order; a shortcuts reference dialog lists the four reliable
bindings; the address capsule highlights during navigation; cookie persistence across reload and
simultaneous stable-plus-Ultraviolet tabs are covered by the matrix. Remaining: tab
reorder/pin/duplicate, bookmark folders, and transport capability surfacing.

**Completion check:** bookmark/tab operations persist correctly; keyboard and touch journeys work; controls remain reachable with an onscreen keyboard; appearance settings never overstate privacy.

## Phase 5 — advanced tools and combined reference features

- Adapter-specific request inspector with searchable metadata and opt-in, bounded body capture.
- Explicit request composer and response viewer inspired by Epoxy.
- Rewriter playground with saved projects and clear separation from live browsing sessions.
- Proper filter-list parsing, update/version metadata, exceptions and compatible cosmetic filtering.
- Separate controls for app history, runtime cookies, site storage, caches and diagnostic data.
- Optional region/Tor routes only when your relay actually provisions and validates those services.
- Optional profile isolation and account sync using explicit data models and distinct runtime origins.

**Completion check:** every exposed tool has a real handler and a stated scope; diagnostics are bounded and clearable; filters are parsed rather than compared as raw strings; optional network routes prove their egress behavior; profile data cannot leak between profiles.

## Phase 6 — release polish and maintenance

- Profile loading, WASM startup and memory with realistic tab counts.
- Verify accessibility, reduced motion, contrast, zoom and mobile safe areas.
- Complete public-origin transport checks and a controlled rollback/release process.
- Review dependency updates per adapter and preserve license/source notices.
- Publish the compatibility matrix, setup/troubleshooting guide and release notes.
- Optionally add a launcher to ojjy’s game hub while keeping this website independent.

**Completion check:** a tagged release passes its documented gates, has reproducible assets, clear setup instructions and a maintained limitations list. Existing users keep stable 1.1.0 unless they deliberately choose another default.
