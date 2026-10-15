# Neutral public surface — evidence and limits

## Implemented

- Shell, PWA, login, default tab title and runtime titles use `ojjy` / workspace wording.
- Engine picker metadata uses stable/A0/A2/A67/legacy labels while exact versions, IDs and defaults
  stay unchanged. `workspace-data.json` exports retain the backwards-compatible format marker.
- Encoded-content routes and all first-party adapters use `/runtime/content/`.
- Alpha67's configurable virtual WASM script uses `core.wasm.js` rather than its upstream name.
- The runtime waits for a policy acknowledgement with a matching route prefix, avoiding premature
  navigation through a previous active worker during updates. The delayed-policy regression sends a
  stale-prefix acknowledgement first and verifies the blocked destination receives no request.
- Direct vendor directories and source maps return 404. Engine-scoped runtime assets remain
  available; server checks compare served JS/WASM bytes against the original files.
- Original author acknowledgements, upstream credits, project source and asset manifest are linked
  from About through `/credits.html`. Required attribution is not stripped or disguised.

## Rebase integration

origin/main advanced with the concurrent headless-engine work after this task branched; these
changes were rebased onto it (no conflicts) and extended to cover that engine's public surface:
engine picker label `Remote session (isolation)`, neutral client wording/messages, the service
health label, and a `/session/` WebSocket path (server, adapter fallback, Caddy guide and E2E
diagnostic hook renamed together; the service hosts the client files, so both sides ship together).
The engine ID `headless`, `config.engine` checks and saved settings values are unchanged. The
headless service's served runtime config now also uses the `/runtime/content/` prefix.

## Scope limits

This is not comprehensive obfuscation. Native `Proxy`, upstream executable symbols and injected
code, package metadata, source repositories, legal notices, stored format markers, authentication
cookie name and internal message IDs remain unchanged intentionally. Common technical terms in
honest privacy explanations remain. No vendor/WASM bytes or destination content are rewritten.

Configured public hosts and relay URLs are not changed. They may identify the project independently
of UI names. No school/managed-device accessibility test, classification test or invisibility claim
is made. An already open runtime may require reload after deployment; old encoded content URLs
without an appropriate service worker still fail closed with 503, not forwarding from the server.
Existing saved destinations use real URLs and are not renamed or cleared.

## Checks

Pre-rebase run (five-engine base, isolated worktree):

- `npm run check`: Deno type checking, **9 server tests and 18 Node tests pass**.
- Server regression checks include neutral shell/PWA/config labels, traversal/encoded paths,
  direct-vendor/source-map rejection, exact engine asset bytes, source/credits/notices availability,
  compact mode and the unchanged persisted app key.
- Final deep three-browser matrix: **94 passed, one failed, one existing skip**. All public-name,
  engine-route, stale-prefix ACK and data/appearance checks passed. The failure was Firefox waiting
  for the home page's `load` event before the palette test began. An earlier run had the same class
  of timeout at the standalone login page instead. Root cause remains unresolved; this is not
  represented as a fully passing matrix or fixed by increasing timeouts/skipping assertions.
- Focused Firefox login and palette tests repeated twice: **4 passed**. These follow-up passes do
  not erase the full-suite failure.
- Chromium Libcurl with deep checks: **5 engine cases passed**, including route-name assertions.
- Browser assertions verify `/runtime/content/` frames, no raw `/vendor/` requests, no emitted
  upstream tool-name request paths in the owned fixture flow, and access to full credits/source.
- Existing WebKit alpha67 skip and existing deep-worker/socket exclusions remain unchanged.
- In-place upgrade from an old deployment and actual managed-school-device access are not verified.

## Post-rebase matrix

After rebasing onto the headless-engine commits and extending naming coverage to that engine, the
server/Node checks and the full deep three-browser matrix were re-run; results here supersede the
pre-rebase counts above.

- `npm run check` on the rebased tree: Deno type checking, **9 server tests and 22 Node tests pass**
  (the headless-engine commit added 4 more Node checks).
- First post-rebase full matrix: **95 passed, 3 failed, 1 existing skip**. All three failures were
  one stale test assertion still expecting the old brand-specific domain-filter message in the
  headless E2E test; the received text was already the new neutral message, so the product was
  correct and only the test string was outdated. The assertion was updated and the headless E2E
  passes on Chromium, Firefox and WebKit.
- Final post-rebase full matrix: **97 passed, 1 failed, 1 existing skip**. The single failure was
  Firefox `page.goto` waiting for the home page's `load` event in the wallpaper test — the same
  intermittent stall class previously seen on two different tests (palette gallery, login gate). It
  lands on a different test each time and the page snapshot shows a rendered app; the root cause
  remains unresolved and is not claimed as fixed.
- Focused rerun of the wallpaper test on Firefox, twice: **2 passed**. Follow-up passes do not erase
  the full-suite failure.
- The headless E2E (remote pixel stream, link click through real coordinates, history navigation,
  blocklist enforcement with the neutral message) passes on all three browsers on the rebased tree.
- Existing WebKit alpha67 skip and existing deep-worker/socket exclusions remain unchanged.
- In-place upgrade from an old deployment and actual managed-school-device access are not verified.

Changes are isolated in the `neutral-public-assets` worktree; the headless-engine commits on
origin/main were rebased underneath, not authored or modified beyond the public-surface renames
listed above.
