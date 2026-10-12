# ojjyProxy — screenshot-inspired multiversion design blueprint

Research/design revision: 2026-10-12. **Research notes and wireframes only; no application implementation or runtime/browser testing.**

Decision baseline supplied by the user: **`/Users/tinlaplee/Downloads/Proxy2` is the most important proxy-integration source; Scramjet stable (1.1.0) is the default; all four supplied Scramjet versions plus Ultraviolet (3.2.10) must be selectable.** This revision replaces earlier recommendations to choose a single generation or default to the newest controller alpha. Earlier hub-theme and feature-inventory notes remain background for visual tokens and feature provenance, not the authority for this revised engine default.

Evidence vocabulary throughout: **Observed** = visible in a supplied screenshot; **Verified—Proxy2** = present in newly inspected first-party example files; **Verified—background** = documented source inspection in the earlier research, linked here; **Proposed** = intended final-project design/behavior. Source-wired does not mean runtime-tested. A screenshot selection is a captured state, not proof of a factory default or working handler.

## 1. What do the screenshots actually establish, and how should their composition translate into hub blue?

### Takeaway

Keep the screenshots' two distinctive compositions: a **large, sectioned settings modal** and a **floating URL/Go capsule above a six-segment navigation pill**. Translate their purple/pink, monospace, hard-shadow treatment into the hub's exact navy surfaces, restrained royal-blue accent, Segoe UI stack, thin outlines and gentle corners. The composition is screenshot-inspired; the final colors and typography are source-derived from the hub. [S1][S1] [S2][S2] [S3][S3] [Hub theme][HT]

### Cited Findings

#### Screenshot source register

All three original PNGs were opened directly. Their filenames contain **U+202F NARROW NO-BREAK SPACE** immediately before `PM`; the links below encode it as `%E2%80%AF`. Screenshot dimensions/zoom are not treated as CSS measurements.

| ID | Exact original filename / evidence scope |
|---|---|
| S1 | `Screenshot 2026-10-12 at 4.58.04 PM.png`: lower settings content, disguise fields, transport and cloak choices, complete More options group, cache action, footer. [Original PNG][S1] |
| S2 | `Screenshot 2026-10-12 at 4.58.16 PM.png`: upper settings composition, Customization, selected stable version, Pill bar style, themes, Tab disguise, transport/cloak groups, footer. [Original PNG][S2] |
| S3 | `Screenshot 2026-10-12 at 4.58.26 PM.png`: unobscured floating address/Go capsule and segmented navigation toolbar over a destination page. [Original PNG][S3] |

#### Visually observed controls and hierarchy

| Observed feature | What is actually visible | What the screenshot does not establish |
|---|---|---|
| Large modal | Dark-purple rectangular panel with rounded corners, purple outline, offset hard shadow; Settings header, upper-right ×, horizontal separators and lower-right Close. Underlying destination is darkened. [S1][S1] [S2][S2] | Modal DOM, focus trap, exact CSS width, keyboard behavior, or whether scrolling is internal. |
| Customization | Search engine shows DuckDuckGo; Protocol shows **Scramjet stable (1.1.0)**; Style shows **Pill bar**; Themes shows **Pink Falling Pattern (High RAM)**. [S2][S2] | Other version/provider/theme menu entries, default values, memory use, successful engine initialization. |
| Tab disguise | Presets `(none)`, Tab title text field with Apply, Icon URL field with Apply; two independent apply buttons. [S1][S1] [S2][S2] | Preset contents, validation, persistence, fetching route for remote icons. |
| Protocol transport | Compatibility badge reads `Cross-Browser (Firefox)`; Standard badge reads `Default · fastest (Chromium, Apple)`; Standard appears selected. [S1][S1] [S2][S2] | Which transport library each label uses, measured speed, tested Firefox/Safari compatibility. |
| Tab cloaking | None / Blank / Blob, with Normal browser tabs / about:blank window / Blob URL page descriptions. None appears selected. [S1][S1] [S2][S2] | Popup success, browser-history removal, network privacy or anonymity. |
| More options | Notifications, Performance mode (`Turn on to disable animations`), Hide from history (`Experimental`), Double ad-block (`AdGuard`), Tor network (`Bypass geo-blocking`), Autocomplete (`Search suggestions`), Prevent new tab leaks (`Less compatible with some websites`). [S1][S1] | Working implementation or the scope/effect of these names. |
| Captured switches | Notifications, Hide from history, Double ad-block, Autocomplete appear on; Performance mode, Tor network and Prevent new tab leaks appear off. These are visual states only. [S1][S1] | User preferences versus application defaults. |
| Cache action | `Clear cache & reload` sits below More options and above the footer. [S1][S1] | Which caches/storage it deletes or whether it preserves account data. |
| Floating bars | Separate, horizontally centered address/Go capsule above a wider pill segmented into **home / back / forward / reload / settings / collapse**. Address shows a meaningful DuckDuckGo URL. [S3][S3] | Back/forward isolation, address synchronization, drag behavior, collapsed-state appearance. |
| Toolbar appearance | Rounded outer ends; five vertical dividers; outlined icons; forward icon visually muted; very bright pink button surface with dark glyphs. [S3][S3] | Why forward is muted, its actual disabled attribute, measured hit-area size. |

No screenshot shows an account panel, bookmark library, in-app tab strip, sidebar or transport diagnostics. Such components in the earlier blueprint are proposals, not newly observed screenshot elements. [S1][S1] [S2][S2] [S3][S3] [Feature inventory][FI]

#### Exact hub tokens to use

The commit-pinned `public/theme.css` was fetched again in this revision and confirms the following default values. These are exact source tokens, not sampled colors from the purple screenshots. [Hub theme source][HT]

| Token | Exact value | Desired shell role |
|---|---|---|
| `--bg` | `#0a1628` | Home canvas, inset fields, shell background |
| `--bg2` | `#111d2e` | Settings panel, cards and toolbar base |
| `--bg3` | `#162a42` | Hover/selected surfaces, secondary controls |
| `--border` | `#1e3a5f` | 1px outlines and dividers |
| `--accent` | `#2e6bbd` | Selection edge, focus foundation, loading accent |
| `--text` | `#e2e8f0` | Headings, typed values, primary labels |
| `--text2` | `#c8d6e5` | Supporting explanations, ordinary control text |
| `--dim` | `#64748b` | Nonessential metadata; assess contrast by role |
| `--faint` | `#475569` | Decorative/disabled detail |
| `--star` | `#f0c040` | Bookmark/favorite emphasis |
| `--ok` / `--warn` | `#4ade80` / `#e0a355` | Ready / partial or experimental state, with text |
| `--danger` | `#e05555` | Error/destructive emphasis |
| `--danger-bg` / `--danger-bd` | `#2a1a1a` / `#4a2020` | Destructive-action treatment |
| `--overlay` | `rgba(10,22,40,.55)` | Existing background-image scrim token, **not** the ordinary hub modal scrim recipe |
| `--onaccent` | `#0a0a0a` | Existing filled-accent foreground token; not automatically suitable for small text |

The more detailed hub-theme notes establish the corrected modal recipe: navy at **88% opacity plus 10px backdrop blur**, distinct from the 55% image scrim. They also establish the Segoe UI/system font stack, 16px cards, 999px search pills, 10–11px small control corners, 15px line SVG navigation icons and final centered/wrapping header actions. This corrects the earlier feature-inventory table's use of the 55% token as a dialog backdrop. [Hub-theme notes, sections 1 and 3][HN]

### Inferences

- **Proposed visual translation:** replace the modal's purple base with `--bg2`, input wells with `--bg`, magenta selection with `--accent`, pink text with `--text`/`--text2`, and hard offset shadows with a soft navy/black shadow. Preserve the screenshot's section grouping and toolbar order. [S1][S1] [S2][S2] [S3][S3] [HT][HT]
- **Proposed hierarchy:** give Settings a light-weight heading; make Customization, Tab disguise, Network transport, Launch wrapper and More options distinct readable sections. Maintain generous space between groups and compact space within a labeled control. This borrows the screenshots' structure without copying their unusually large monospace controls. [S2][S2] [HN][HN]
- **Proposed palette fidelity:** default theme name should be **Hub blue** with internal theme ID `default`. Ocean/cyan and midnight/purple are optional separate hub presets, not substitutes for this baseline. Default background is still navy; Pink Falling Pattern is only an observed inspiration entry. [HT][HT] [HN][HN] [S2][S2]

### Gaps

- The screenshots' application/revision is unidentified. Its Settings UI must not be attributed to Proxy2: the newly inspected Proxy2 README and examples explicitly provide a minimal address form and frame without settings/CSS/cloaking. [Proxy2 README][P2] [Stable page][I110]
- No screenshot interaction was performed. Exact computed dimensions, popup results, screen-reader behavior, background rendering cost and screenshot-to-CSS pixel parity are unknown.
- The hub's actual deployed appearance and any saved theme were not rendered here. Exact source-token matching is established; live visual parity remains a later acceptance task. [Hub-theme notes][HN]

## 2. What does the highest-priority Proxy2 source verify, and how should engine, version and transport be named?

### Takeaway

Proxy2 verifies **four distinct integration examples**, not a finished settings/browser UI. Use it first for version-specific bootstrap/navigation/worker behavior; layer the screenshot-inspired blue shell around separately adapted runtimes. The five-choice menu is **Engine & version**, while **Network transport**, **Relay endpoint**, and **Launch wrapper** are different settings. [Proxy2 README][P2] [Stable page][I110] [Alpha 0 page][I200] [Alpha 2 page][I202] [Controller page][I267]

### Cited Findings

#### Newly inspected Proxy2 paths and implications

The four folders' `index.html`, `config.js` and `sw.js` were read directly. References identify the supplied local sources; version descriptions follow their labels and bootstrap code, not an independent byte-for-byte vendor-package audit. [Proxy2 README][P2]

| Required entry | Verified supplied example | What the future UI may truthfully explain |
|---|---|---|
| **Scramjet stable (1.1.0)** | `$scramjetLoadController()`, `ScramjetController`, `controller.init()`, BareMux connection/setTransport, SW registration and `createFrame(iframe).go(...)`. Worker loads config and calls `route`/`fetch`. Config chooses `/vendor/epoxy/index.mjs`. [Page lines 36–72][I110] [Config lines 14–27][C110] [Worker][W110] | User-required default; supplied transport path is Epoxy through BareMux. Stable is the release label, not a tested guarantee that every site works. |
| **Scramjet 2.0.0-alpha** | Same loader/controller-style API, but `wisp` is passed in controller config and the example has no BareMux initialization. Config/worker describe built-in Epoxy. [Page lines 37–67][I200] [Config lines 6–20][C200] [Worker][W200] | Experimental older alpha with built-in Epoxy; do not offer an apparently working libcurl swap based on other versions' snippets. |
| **Scramjet 2.0.2-alpha** | BareMux initialized in page; iframe navigation is `origin + prefix + encodeURIComponent(target)`. Worker manually assembles runtime fetch handler, transport shim and cookie jar; config lists injected runtime/client scripts. [Page lines 35–59][I202] [Config][C202] [Worker lines 17–104][W202] | Experimental alpha needing its own hand-assembled adapter. Do not invoke a controller class merely because another Scramjet version has one. |
| **Scramjet 2.0.67-alpha.2** | Core and controller API scripts; Controller construction and awaited handshake; explicit Epoxy/libcurl load branch; response-header flattening adapter. Config defaults `transport: "epoxy"`; worker uses controller `shouldRoute`/`route`. [Page lines 42–111,123–133][I267] [Config][C267] [Worker][W267] | Experimental controller generation; source identifies controller 0.0.14. Transport is passed directly through an adapter rather than configured through BareMux. |
| **Ultraviolet (3.2.10)** | Not one of the four Proxy2 examples. The earlier engine inventory documents UV 3.2.10; the commit-pinned InvisiProxy dev lockfile was fetched again and resolves the registry artifact at 3.2.10, with BareMux dependency. [Earlier engine research][EN] [Exact locked package][UVLOCK] | Required legacy choice, sourced separately. Do not label it as supplied by Proxy2 or silently substitute the production branch's custom `3.2.10-headers` artifact. [Networking background][NN] |

All four inspected Proxy2 configurations use the same example prefix `/network/` and root `/vendor/...` asset URLs. They were designed as independent examples; putting their folders side-by-side is not sufficient to make four safe, coexisting runtimes on one origin. [Configs][C110] [C200][C200] [C202][C202] [C267][C267] [Proxy2 README][P2]

All four inspected address parsers normalize bare domains to **HTTPS** and fall back to **Google search**, while the screenshot shows DuckDuckGo. Selecting DuckDuckGo as the proposed product default requires a new provider preference; it is not Proxy2's existing default. [Stable parser lines 75–85][I110] [Alpha 0 parser][I200] [Alpha 2 parser][I202] [Controller parser][I267] [Screenshot][S2]

#### Source-verified controls versus screenshot-only controls

These rows preserve the earlier feature-inventory evidence while giving Proxy2 priority. Background findings concern the referenced InvisiProxy/hub snapshots, not the unknown screenshot application's exact handlers. [Feature inventory][FI]

| Control family | Observed | Source verification / reuse boundary | Proposed final treatment |
|---|---|---|---|
| URL + Go + visible frame | S3 | **Verified—Proxy2:** present in all four example pages. [I110][I110] [I200][I200] [I202][I202] [I267][I267] | Unified omnibox over each version adapter. |
| Four-version selector | S2 shows only selected stable label | **Proxy2:** four examples exist; no selector UI. [P2][P2] | Build exact five-entry selector below. |
| Home/back/forward/reload/collapse | S3 | **Verified—background:** InvisiProxy frame handlers exist, but back/forward use outer history and hide-bar is distinct from fullscreen. Not present in Proxy2's minimal pages. [FI, Browser shell][FI] | Adapt navigation/status through selected runtime; collapse the shell without implying fullscreen. |
| Search engine selection | S2 | **Background:** provider menus/parsers exist with version/branch conflicts; **Proxy2:** Google fallback only. [FI, Omnibox][FI] [I110][I110] | One provider registry, DDG initial product choice. |
| Title/icon Apply | S1/S2 | **Background:** modern sources wire title/icon forms and local persistence. [FI, Settings][FI] | Explicit apply/reset; cosmetic browser-tab appearance. |
| None/Blank/Blob | S1/S2 | **Background:** `LaunchType` wrappers are wired but popup-dependent. [FI, Browser shell][FI] | Explicit shell launch action, precise failure state. |
| Transport selection | S1/S2 | **Proxy2:** version-specific transport configuration; no settings UI. [C110][C110] [C200][C200] [C202][C202] [C267][C267] | Show actual library, available choices and selected-version support. |
| Hide from history | S1 | **Background:** upstream `HistoryHide` uses cookie/preference and document HTTP-404 tactics; not a visit library or native-history deletion. [FI, Settings][FI] | Replace semantics with **Don't save local history**. |
| Double ad-block / AdGuard | S1 | **Background:** real but partial filters, format/readiness defects, shell CSS hiding; no established complete AdGuard feature here. [FI, Adblocking][FI] | Proposed network + cosmetic filter layers with actual readiness/coverage labels. |
| Tor | S1 | **Background:** routing controls depend on operator SOCKS/backend setup; no real egress tested. [FI, Settings and conflicts][FI] | Backend-advertised capability, off/unavailable until real route exists. |
| Autocomplete | S1 | **Background:** provider requests/parsers exist, partial keyboard UX. [FI, Omnibox][FI] | Version-adapted suggestions with full keyboard behavior. |
| Prevent new tab leaks | S1 | **Background:** sandbox omits popup permissions, with reload and compatibility consequences. [FI, Browser shell][FI] | Name **Restrict website popups**; do not promise elimination of all leaks. |
| Notifications / Performance mode | S1 | **Screenshot only for these exact proxy switches.** Hub has motion preferences; no corresponding Proxy2 controls. [P2][P2] [HN][HN] | In-app notices and a narrowly defined reduced-effects mode. |
| Clear cache & reload | S1 | **Screenshot-only exact action.** Background hub storage manager clears origin data broadly, which is unsuitable for blind reuse. [HN, Storage][HN] | Proxy-cache-scoped operation with explicit preserved data. |
| Account/privacy claims | Not shown | **Background:** hub account/session exists, but no account-backed URL history/bookmark schema is established; proxy examples are not an identity system. [HN, Account and gaps][HN] [FI, Settings][FI] | Real integration only; account identity does not imply private/anonymous browsing. |

### Inferences

#### Required full selector — proposed exact entries

Label: **Engine & version**. Short help: “Choose the rewriting engine and its release. Network transport is configured separately.” Do not call this selector Protocol; that word conflicts with HTTP/HTTPS and transport terminology. Keep these exact entry strings in this order:

1. **Scramjet stable (1.1.0)** — **default**; default badge/help is separate from the entry string.
2. **Scramjet 2.0.0-alpha**
3. **Scramjet 2.0.2-alpha**
4. **Scramjet 2.0.67-alpha.2**
5. **Ultraviolet (3.2.10)** — **legacy**; legacy badge/help is separate from the entry string.

All five are required runtime choices in the final-project blueprint, not “latest Scramjet” aliases. Selecting a release must bind its exact adapter/assets; no automatic alpha upgrade or hidden UV substitution. Native select is preferred for ordinary keyboard/touch access; a custom menu is justified only if it fully implements equivalent selection/focus behavior.

Below the selector, show a compact, readable summary with separated fields:

> Engine: **Scramjet** · Version: **1.1.0 stable** · Transport: **Epoxy** · Relay: **not checked**

The combined menu is a convenience over an engine/version pair. Keep separate conceptual preference fields: engine family, exact version, network transport, relay endpoint, launch wrapper and browsing-bar style. Never describe Epoxy/libcurl as engine versions, BareMux as the selected rewriting engine, or Wisp as the rewriting protocol.

#### Transport labels and initial selection — proposed

- Section title: **Network transport**. If retaining screenshot-friendly names, use **Compatibility — Epoxy** and **Standard — libcurl**, with actual library names always visible. This mapping is a proposed product label, **not a mapping proven by the screenshots**.
- Initial stable session uses **Epoxy**, matching Proxy2's 1.1.0 example. The screenshot's selected Standard state does not override this source baseline. “Standard” is a friendly mode name, not a universal default or performance ranking.
- 1.1.0 / 2.0.2-alpha: source comments describe libcurl substitution through BareMux, but bundled availability and compatibility must be validated before enabling it. 2.0.0-alpha: show built-in Epoxy as the only supported choice for the supplied integration. 2.0.67-alpha.2: source wires the two-name load branch; enable libcurl only with the correct available bundle and tested adapter. UV: independently validate its BareMux/transport bridge. [C110][C110] [C202][C202] [C200][C200] [I267][I267] [EN][EN]
- Browser-specific help should say **“Not tested in this browser”**, **“Capability check passed”**, or identify a dated tested browser/version. A startup capability check is narrower than end-to-end website compatibility. Do not retain “fastest”, “Cross-Browser (Firefox)” as an unconditional guarantee, or assume all Apple devices are one capability class.
- A transport preference can persist per engine/version. If a newly selected release cannot use it, show “This release uses built-in Epoxy” and preserve the user's other-release preference; never silently run a different library while displaying libcurl.
- Version selection sets the default for future browsing. During an active session, offer **Use for next navigation** and **Reload this page with selected version**. Default to the former; the latter reconstructs the current canonical destination and explains that page state/site sessions may differ. Do not replay a POST or silently migrate cookies.
- Isolate version assets, worker routing and runtime globals. Plan version-specific origins/contexts or verified independent workers/scopes/storage namespaces before combining the samples. Root vendor paths and the shared `/network/` prefix must be remapped deliberately. A claim of concurrent multiversion tabs requires additional validation, not merely five menu entries. [Configs][C110] [C200][C200] [C202][C202] [C267][C267] [Engine scope background][EN]

### Gaps

- No runtime test established browser/site compatibility, speed, memory cost, navigation event coverage, libcurl asset availability or popup success for any selected version.
- Version identity is evidenced by supplied source labels/README and bootstrap shape; untouched-vendor-byte provenance is stated by the README but was not independently rehashed against package tarballs. [P2][P2]
- UV is sourced outside Proxy2. Stock registry 3.2.10 is the intended entry; the earlier production headers fork must be separately identified if ever evaluated. [UVLOCK][UVLOCK] [NN][NN]
- Earlier InvisiProxy controls are reusable patterns only. No screenshot proves they are the unknown screenshot app's exact implementation. [FI][FI] [S1][S1] [S2][S2]

## 3. What concrete final UX, dimensions, responsive layouts and wireframes are recommended?

### Takeaway

**Proposed final direction:** desktop defaults to **Pill Bar**, with the URL/Go pill above Home / Back / Forward / Reload / Settings / Collapse; a docked variant is available and becomes the initial mobile presentation. Settings is a large blue modal on desktop and a one-column, safe-area-aware dialog on mobile. Scramjet stable (1.1.0), Hub blue, still background and built-in/source-configured Epoxy are the starting baseline.

### Cited Findings

The composition basis is S1–S3; the style basis is the commit-pinned hub palette and hub component research; the integration basis is Proxy2; background control limitations come from the earlier inventory. All dimensions, defaults, copy, state transitions and wireframes below are **proposals**, unless explicitly identified as exact inherited tokens. [S1][S1] [S2][S2] [S3][S3] [HT][HT] [HN][HN] [P2][P2] [FI][FI]

### Inferences — detailed proposed design specification

#### A. Visual system and component dimensions

Use CSS-pixel targets, not the screenshot's apparent display-pixel scale. Preserve the exact token values listed above.

| Component | Proposed geometry and treatment |
|---|---|
| Shell canvas | `--bg`; destination keeps its own styling. No global theme CSS injected to restyle remote content. |
| Settings scrim | Navy at 88% with 10px backdrop blur, matching corrected hub modal recipe; opaque fallback when blur is unavailable. |
| Settings panel | Desktop width up to **1000px**, minimum **24px viewport gutters**, max-height **min(900px, viewport height − 48px)** using dynamic viewport sizing. Opaque `--bg2`, 1px `--border`, **16px radius**, soft `0 16px 48px` black/navy shadow. |
| Settings header/footer | Header min-height **64px**, 24px side padding; footer min-height **64px**. 1px separators. Header/footer stay visible; only body scrolls. Close icon/button has at least **44×44px** hit area. |
| Settings body | **24px** padding; groups **24–32px** apart; control/column gap **16–24px**. Two equal lower columns above the mobile breakpoint. |
| Typography | `'Segoe UI', system-ui, -apple-system, sans-serif`; Settings **24px/300**, section headings **18px/500**, control labels **14px/500**, field values **16px**, explanatory copy **14px** with approximately **1.5** line-height. Monospace only in optional technical diagnostics. |
| Inputs/selects | Minimum **44px** height, **10px** radius, 1px border, `--bg` inset surface, 12–14px horizontal padding. Labels remain above fields; placeholders are not labels. |
| Ordinary buttons | Minimum 44px hit height; **10–11px** radius; `--bg2`/`--bg3`, `--text`, outlined border. Apply/Go are emphasized by accent edge/selected surface, not fluorescent fill. |
| Badges/help | Wrapping pill/10px chip, 12–13px text. Helpful semantics remain normal readable text; badges do not need the screenshot's heavy outlined boxes. |
| Toggle/radio rows | Minimum **60px** row, expanding for help; label/help left, control right, divider below. Entire labeled row is clickable without duplicating the control. |
| Switch | **44×26px** track, **20px** knob; accent track when on, navy/steel track when off, pale knob and visible edge. Expose programmatic checked state; position/text convey state in addition to color. |
| Focus | Start from hub's 2px accent outline / 2px offset; add a pale outer edge where accent alone lacks contrast, especially on `--bg3`. Rings are not clipped by toolbar rounded overflow or modal scroll containers. |
| Motion | 150–200ms hover/selection; at most subtle 4–8px modal entrance. Reduced motion disables translation, animated backgrounds and nonessential transitions. Performance mode can additionally disable blur/decoration. |

**Contrast-derived refinement:** calculation from the exact source tokens gives `--text` on `--bg2` ≈ **13.75:1**, `--text2` ≈ **11.47:1**, `--dim` ≈ **3.56:1**, `--faint` ≈ **2.24:1**. Pale `--text` on filled `--accent` is ≈ **4.31:1**; existing `--onaccent` on accent is ≈ **3.73:1**. Accent against `--bg3` is ≈ **2.74:1**. These are calculated solid-color ratios, not rendered/translucent contrast measurements. Consequently use `--text2` for small essential descriptions and outlined navy Go/Apply/Close buttons with pale text; retain dim/faint for nonessential or disabled detail. Add a high-contrast edge for selected controls/focus rather than changing the brand palette wholesale. Validate actual composited surfaces later. [Token inputs][HT] [Contrast method][WCAG]

#### B. Desktop Pill Bar — recommended default

Default **Browsing bar style: Pill Bar** on a new desktop visit. Alternatives: **Docked Bar** (space-reserving top chrome) and the responsive mobile dock. A user's saved style remains a preference; the initial mobile default is Docked Bar. At ≤600px, an explicit desktop Pill preference may use the compact dock geometry with help saying “Compact layout on small screens”; restore the preference when enough room returns.

- Place the address capsule at **16px** from the top of the content workspace, centered, width **min(480px, available width − 32px)**, height about **56px**, 999px outer radius, 8px inner padding. Flexible address field plus **56–64px** Go button; field can shrink without pushing Go offscreen.
- Navigation pill sits **10px below** the address capsule, width **min(600px, available width − 32px)**, height **52px**, six equal flexible segments (about **100px** wide at full size). Rounded ends **26px**, 1px dividers, `--bg2` surface. This deliberately preserves the screenshot's **narrower address capsule above a wider navigation pill**, while scaling it into normal desktop CSS dimensions. Hover/active segment uses `--bg3`; selected/open Settings gets accent edge and pale icon. Do not color every segment bright blue.
- Exact screenshot order: **Home, Back, Forward, Reload, Settings, Collapse**. Use line SVGs, 24×24 viewBox, 18–20px displayed glyph, stroke 2, round joins/caps. Larger than the hub's 15px navigation glyph is a deliberate browser-control extension; hit areas remain at least 44px.
- Home opens the local ojjyProxy start view. A Games Hub link belongs on that home view, not behind the same Home icon. Keep current browsing session metadata available for return.
- Back/Forward availability comes from actual adapter navigation state. If a version cannot report/implement a command, expose its limitation rather than operating outer-shell history or pretending to have a per-tab stack.
- Reload becomes Stop only if cancellation exists for that adapter. Otherwise keep a separate loading status; do not show a fake Stop action.
- Floating chrome can obscure site content: keep Docked Bar immediately accessible in settings, and preserve a persistent Show controls handle when collapsed. No full-page invisible hit-test overlay; empty space around pills passes pointer events to the destination.
- Expanded/collapsed is session-local; do not persist a completely undiscoverable hidden toolbar across first load. Collapse leaves a **44px-high Show controls capsule** near the top center. It expands both address and navigation pills without triggering destination navigation.
- Add a quiet status/engine chip beneath or alongside the capsule only when needed: `Scramjet 1.1.0 · Epoxy` plus real Loading/Failed status. Five-entry release selection stays fully visible in Settings; a compact chip may link there.
- The field displays canonical destination URLs, not encoded proxy routes. Do not overwrite edits with redirects. Go and Enter share submission. Empty input gets a local message; do not unexpectedly launch example.com because the sample parser does so.
- On a brand-new home view focus the omnibox when appropriate; during browsing avoid stealing focus from destination forms. Autocomplete panel anchors under the URL capsule, above the navigation pill, with opaque navy background and bounded height.

#### C. Settings modal information architecture

The modal opens over the current page, preserves browsing state and does not restyle the destination. Proposed groups, in order:

1. **Customization** — Search engine, **Engine & version**, Browsing bar style; second row Theme and Background. Desktop first row uses roughly **1fr / 1.8fr / 1fr** so full version labels fit. Theme: **Hub blue**; Background: **None**. Keep font/motion/density in an Appearance details group if desired. Density affects home/library cards, not smaller-than-44px touch targets.
2. **Tab disguise** — Preset, Tab title + Apply, Icon URL + Apply. Desktop proportions roughly **0.8fr / 1.3fr / 1.3fr**, with each Apply adjacent to its field. Preset fills draft fields; Apply performs the change explicitly. Show current preview and Reset appearance. Text: **“Changes this browser tab's title and icon only.”** Browser-tab disguise is distinct from remote page titles or app-managed tabs.
3. **Network transport / Launch wrapper** — two side-by-side panels. Left shows actual Epoxy/libcurl choices and selected-version capabilities; relay endpoint under Advanced with Apply/Test. Right offers **None / Blank / Blob** with Normal window / about:blank wrapper / Blob URL wrapper help. Below choices, an explicit **Open wrapped window** action is enabled for Blank/Blob. None is initial default. Help: **“Changes how the page opens; does not hide browsing from the network.”** Do not auto-open on dropdown change.
4. **More options** — two-column rows, preserving the screenshot's recognizable families but correcting ambiguous claims. Order: Notifications, Performance mode, Don't save local history, Ad blocking, Tor routing, Autocomplete, Restrict website popups.
5. **Cache & data** — Clear proxy cache & reload, with a sentence about what survives; expandable separate local-history and engine/site-data actions. Do not hide destructive storage semantics behind a generic broom icon.
6. Footer — status at left (`Saved locally` / `Could not save` / `Runtime change pending`), **Close** at right. A runtime Apply/reload action appears only when needed; no global Save button if ordinary preferences already save immediately.

Version selection should display all five full labels without truncation in the opened menu. At constrained width place Engine & version on its own line rather than abbreviating release numbers. On desktop, the summary separates engine, version, transport and actual connection state; on mobile it wraps naturally.

#### D. Exact control semantics and proposed initial states

These are recommended product defaults, not screenshot or inherited-source defaults.

| Control | Proposed initial value | Interaction and truthful copy |
|---|---|---|
| Search engine | **DuckDuckGo** | Searches use one provider registry. URL entry remains independent. Offer only providers with configured URL/parser support. Proxy2's Google fallback is replaced deliberately. |
| Engine & version | **Scramjet stable (1.1.0)** | Exact five-entry selector; future-navigation selection and explicit active-page reload behavior described above. |
| Browsing bar style | **Pill Bar desktop; Docked Bar mobile** | Changes shell presentation only. Preserve destination frame and typed address. |
| Theme/background | **Hub blue / None** | Apply locally before paint on next visit. Optional backgrounds are explicit, paused while browsing/hidden and suppressed by reduced motion. No High RAM label without measurement. |
| Tab disguise | **None; ojjyProxy title/icon** | Apply independently, persist locally, reset independently; validate icon URL and preserve old icon on failure. Never claim network masking. |
| Transport | **Epoxy via selected adapter** | Choices depend on exact release; no unverified fastest/Firefox guarantee. Relay starts “Not checked”. |
| Launch wrapper | **None** | Blank/Blob opens from a direct user action. If blocked, show “Window did not open” and an Open here option, preserving the current page. Revoke Blob URL when its wrapper no longer needs it. |
| Notifications | **On for in-app status notices** | “Show connection and save messages.” Errors remain available when off. OS/browser notification permission is a separate explicit opt-in if ever added. |
| Performance mode | **Off; OS reduced motion always respected** | “Reduce visual effects and optional background work.” Disables decorative animation/blur; no unmeasured speed/RAM claim. Does not alter engine correctness settings. |
| Don't save local history | **On** | “Stops recording visits in ojjyProxy on this browser. Does not erase browser, device or network history.” Disable URL-bearing automatic session restore/recent lists while on; back/forward remains session navigation. Existing recorded visits require a separate clear action. |
| Ad blocking | **Off until validated filters are ready** | Preserve two-layer idea as Network filtering + Cosmetic filtering, each with real readiness/support. Cosmetic toggle can remain unavailable for an unsupported adapter. Do not call it Double ad-block/AdGuard unless that exact configured integration is established. |
| Tor routing | **Off / unavailable without backend support** | “Uses the operator's configured Tor route.” Requires actual supported transport/backend and health signals. No cosmetic flag, anonymity guarantee or unconditional geo-block bypass claim. |
| Autocomplete | **Off initially; explicit opt-in** | “Send typed queries to the selected suggestion provider.” Local bookmark suggestions can be a separate preference. Turning it off never blocks Go/Enter. Source defaulting is a different question. |
| Restrict website popups | **Off** | “Limit website-created windows; some sign-ins may stop working.” User-initiated shell wrapper/launch actions are separate. No assertion of total new-tab-leak prevention. |
| Clear proxy cache & reload | **Action, not toggle** | “Removes ojjyProxy cached shell/engine files; keeps bookmarks, settings and hub sign-in.” Only promise scopes the final storage implementation can actually enforce. |

The local-history and autocomplete defaults are explicit design recommendations for the user's desired project; their implementation is new work. **Do not call this incognito** unless destination cookie/site-storage isolation is actually implemented and tested. Turning recording off must not imply removal of earlier visits, remote logs or engine cookies.

**Account boundaries:** account login identifies a user; it does not make the route private. Matching hub visuals does not confer SSO across origins. Label storage **Saved on this browser** until real authenticated sync exists. Proxy URLs/history must not be placed in public game-favorite/profile/playtime endpoints. If settings/bookmarks later sync, describe the actual sync scope separately from local-history controls. [Account background][HN] [Feature conflicts][FI]

**Cache boundaries:** inventory proxy-owned cache namespaces first. A generic `localStorage.clear()`, origin-wide cache deletion, unregister-all-workers action or delete-every-IDB-database routine is not acceptable as the cache button. Engine/site data can log users out and must be a separate scoped action with explicit copy. If exact per-site isolation is unavailable, describe engine-wide scope honestly. During reset show Clearing → Reloading; on failure retain settings/page and show retry/details. After reload verify the selected adapter is ready; reloading alone is not success. [Hub storage background][HN]

#### E. Persistence, loading and failure states

- Ordinary shell preferences save immediately with nonintrusive status. If persistence fails, show **Applied for this session; could not save**. Runtime-changing values use pending state until actually activated; no mismatched “selected” versus running version.
- Preserve canonical typed URL, selected release and transport when initialization fails. Show a blue error card with Try again / Choose another version / Home; details contains actual error, engine, release and transport.
- Distinguish worker starting, transport starting, relay checked and page loading only when real events supply those states. Initial label is **Not checked**, not Connected. Do not hide the loading spinner on a fixed timer and infer success.
- All five selector choices remain part of the final project even if a particular browser fails a capability check. Show an unavailable reason/diagnostic and allow selecting another release; do not silently fall back and retain the failed release's label.
- Avoid automatic engine/version substitution. When a user chooses a manual retry on another release, keep the same canonical URL, acknowledge fresh frame/page state, and update the displayed running engine/version after actual initialization.
- Suggestions use debounce/cancellation/request ordering, ArrowUp/Down, Enter, Escape and listbox semantics. Submission works independently. No late result overwrites ongoing address edits.

#### F. Responsive rules and safe areas

| Available viewport | Proposed layout |
|---|---|
| **≥1000px** | Full desktop modal first-row columns and three-part disguise row; transport/wrapper and More options in two columns; full Pill Bar default. |
| **601–999px** | Modal remains inset, max available width; upper forms use two columns with version field spanning when needed. Disguise preset on own row if text cannot fit. Transport/wrapper can stack before causing overflow. |
| **≤600px** | Full-width/nearly full-height dialog with one column, 16px body padding, 12–16px group gaps, min 44px controls. Docked bar initially; all labels/help wrap. No nested two-column toggle grid. |

Mobile dock: space-reserving **top** bar, address + Go row about **56px** high; second row six equal navigation segments at least **44px** high. At 320px width with 16px side gutters, 288px accommodates six 48px segments. When the software keyboard opens, use dynamic viewport/visual-viewport constraints so address and current modal field remain visible; do not pin a giant floating pill behind the keyboard. A saved expanded bar returns after editing without losing the destination.

Mobile modal: sticky top header, one scrollable body, sticky action footer. Top padding accounts for the top safe area; footer padding is **16px + bottom safe-area inset**. Long last rows must scroll fully above the footer; reserve matching body scroll padding. Close/Apply must remain reachable in portrait, landscape and with keyboard visible. Fields use ≥16px text; prevent horizontal clipping of the longest release label. At extreme text zoom, allow document/modal vertical reflow rather than trapping content behind fixed heights.

Do not use viewport width alone as browser capability detection. Layout breakpoints decide geometry; transport support comes from actual runtime capability checks and later browser testing.

#### G. Keyboard, focus and reduced-motion contract

- Dialog has an accessible name from Settings, modal semantics, inert/noninteractive background (including the destination frame), and no background scroll while open. Initial focus goes to the heading or Close, not a field that immediately opens a mobile keyboard.
- Tab/Shift+Tab remain within the dialog, including expanded details and selection popups; Escape closes the innermost popup first, then dialog. Restore focus to the invoking Settings button, or Show controls if the old trigger disappeared. Keep focus visible and scrolled clear of header/footer.
- DOM order follows the mobile reading order: Customization → Tab disguise → Network transport → Launch wrapper → More options → Cache & data → footer. CSS columns must not create an unpredictable visual/keyboard zigzag.
- Labeled native radio groups/selects and real buttons are preferred. Icon buttons have accessible names/tooltips; toggles expose checked state; disabled controls expose their reason in nearby text. No color-only selection/error status.
- Enter in title/icon fields applies that field only; Enter in omnibox navigates only. Merely changing a select never causes a surprise new window. Keyboard shortcuts operate when the shell has focus; do not intercept typing inside proxied pages.
- OS reduced motion suppresses nonessential motion even if Performance mode is off. Motion preference can additionally disable effects; setting Performance mode on cannot override OS reduction. Maintain clear instantaneous state changes without animated translation/popping.
- Announce save/failure/connection state changes politely; avoid announcing every spinner tick. Destructive-action failure remains visible. Notifications off suppresses optional notices, not actionable errors.

#### H. Wireframes — proposed geometry and content

These sketches specify hierarchy, not implemented HTML, exact pixel rendering or proof of engine capability. Brackets denote controls; `(●)` denotes selected radio; ON/OFF are readable switch states.

**Desktop browsing — Pill Bar default**

```text
┌──────────────────── destination viewport ─────────────────────┐
│             ╭───────────────────────────────────╮             │
│             │ [URL or search................] Go│  top 16px   │
│             ╰───────────────────────────────────╯             │
│        ╭───────┬───────┬───────┬────────┬────────┬───────╮    │
│        │ Home  │ Back  │Forward│ Reload │Settings│ Hide  │    │
│        ╰───────┴───────┴───────┴────────┴────────┴───────╯    │
│                 Scramjet 1.1.0 · Epoxy · loading               │
│                                                               │
│           actual website content; retains its own style       │
│                                                               │
└───────────────────────────────────────────────────────────────┘

Collapsed:                  [ Show controls ▾ ]
Docked alternative: same controls in reserved top chrome,
                    destination begins below it.
```

**Desktop settings — upper body**

```text
┌────────────────────── Settings ────────────────────── [×] ────┐
│ Customization                                                 │
│ Search engine       Engine & version              Bar style   │
│ [DuckDuckGo ▾]      [Scramjet stable (1.1.0) ▾]     [Pill Bar ▾]│
│ Engine: Scramjet · Version: 1.1.0 stable · Transport: Epoxy     │
│ Theme [Hub blue ▾]                    Background [None ▾]     │
│ ───────────────────────────────────────────────────────────── │
│ Tab disguise                                                  │
│ [Preset ▾]   [Tab title........] [Apply]   [Icon URL..] [Apply] │
│ Changes this browser tab's title and icon only. [Reset]        │
│ ───────────────────────────────────────────────────────────── │
│ Network transport                │ Launch wrapper             │
│ (●) Compatibility — Epoxy         │ (●) None — normal window    │
│ ( ) Standard — libcurl [reason]   │ ( ) Blank — about:blank     │
│ Support: Not tested here          │ ( ) Blob — URL wrapper     │
│ [Advanced relay settings ▸]       │ [Open wrapped window]      │
│                                  │ Cosmetic; network visible. │
│ ───────────────────────────────────────────────────────────── │
│ More options ...                       ↓ body scroll          │
├───────────────────────────────────────────────────────────────┤
│ Saved on this browser                                 [Close] │
└───────────────────────────────────────────────────────────────┘
```

**Opened Engine & version menu — full exact labels**

```text
Engine & version
┌────────────────────────────────────┐
│ ✓ Scramjet stable (1.1.0)           │  Default badge/help
│   Scramjet 2.0.0-alpha              │
│   Scramjet 2.0.2-alpha              │
│   Scramjet 2.0.67-alpha.2           │
│   Ultraviolet (3.2.10)              │  Legacy badge/help
└────────────────────────────────────┘
Network transport is a separate group below.
```

**Desktop settings — lower body / semantic corrections**

```text
│ More options                                                  │
│ Notifications                 ON │ Performance mode       OFF │
│ In-app notices                   │ Reduce visual effects      │
│ ──────────────────────────────── │ ────────────────────────── │
│ Don't save local history      ON │ Ad blocking            OFF │
│ ojjyProxy local visit log only    │ Network / cosmetic layers  │
│ ──────────────────────────────── │ ────────────────────────── │
│ Tor routing           Unavailable│ Autocomplete           OFF │
│ Requires a configured backend    │ Sends queries to provider  │
│ ──────────────────────────────── │ ────────────────────────── │
│ Restrict website popups       OFF│                            │
│ Some sign-ins may stop working   │                            │
│ ───────────────────────────────────────────────────────────── │
│ Cache & data                                                  │
│ [Clear proxy cache & reload]                                  │
│ Keeps bookmarks, settings and hub sign-in.                    │
│ [Local history ▸]   [Engine/site data ▸]                       │
├───────────────────────────────────────────────────────────────┤
│ Saved on this browser                                 [Close] │
```

**Mobile settings — single-column body, persistent actions**

```text
┌──────────── Settings ─────── [×] ┐ ← top safe area + header
│ Customization                   │
│ Search engine                   │
│ [DuckDuckGo                  ▾] │
│ Engine & version                │
│ [Scramjet stable (1.1.0)      ▾] │
│ Engine: Scramjet                │
│ Version: 1.1.0 stable           │
│ Transport: Epoxy                │
│ Bar style [Docked Bar        ▾] │
│ Theme [Hub blue              ▾] │
│ Background [None             ▾] │
│ ────────────────────────────── │
│ Tab disguise                    │
│ [Preset                      ▾] │
│ [Tab title............] [Apply] │
│ [Icon URL.............] [Apply] │
│ Cosmetic title/icon only.       │
│ ────────────────────────────── │
│ Network transport               │
│ (●) Compatibility — Epoxy       │
│ ( ) Standard — libcurl [reason]  │
│ ────────────────────────────── │
│ Launch wrapper: None/Blank/Blob  │
│ More options: one row per switch│
│ Cache & data                    │
│       ↓ independent body scroll│
├────────────────────────────────┤
│ Saved locally          [Close] │ ← bottom safe-area padding
└────────────────────────────────┘

Mobile dock (reserves space above website):
┌────────────────────────────────┐
│ [URL or search..........] [Go] │
│ Home│Back│Fwd│Reload│Set│Hide   │
├────────────────────────────────┤
│ destination page               │
└────────────────────────────────┘
```

**Home/start view — connects the screenshots to the real hub**

```text
                         ojjyProxy
                light Segoe UI title on navy
        [games hub] [bookmarks] [local history] [settings]
               [enter a URL or search…] [go]
      Scramjet stable (1.1.0) · Epoxy · not checked

        [favourites] [a–z]        [filter saved sites]
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │ 64px icon ☆ │ │ 64px icon ☆ │ │ + shortcut  │
        │ site title  │ │ site title  │ │             │
        │ domain      │ │ domain      │ │             │
        └─────────────┘ └─────────────┘ └─────────────┘
                 saved on this browser
```

Use the hub's centered/wrapping action row, 900px home container, 16px launch cards, roughly 220px minimum card width and 1.2rem gap as the home baseline. Local history links show the real recording-off/empty state; do not manufacture recents. The Pill Bar is for active browsing; do not duplicate two equally dominant address fields over the home hero. Bookmarks/history/account integration remain proposed functional work. [Hub home geometry][HN] [Placeholder inventory][FI]

#### I. Later design/runtime acceptance criteria

These are future validation requirements, **not tests completed by this research revision**:

1. Verify fresh opening selects **Scramjet stable (1.1.0)**; each of the five exact menu entries selects a distinct correct runtime, with the active summary updated after initialization.
2. Compare hub/proxy shell under identical default theme: exact token values, Segoe stack, thin borders and outlined controls; no default purple/pink/cyan or mandatory animated background.
3. Check desktop expanded/collapsed Pill Bar, docked alternative and narrow/mobile dock; Show controls remains keyboard/touch reachable and content is not unexpectedly blocked.
4. Check modal at 320/375/600/768/1024px widths, short landscape heights, text zoom, mobile keyboard and safe-area devices. Last row and all Close/Apply actions remain reachable.
5. Keyboard-only open, full Tab/Shift+Tab cycle, Escape layering, focus return, select/radio operation, address suggestions and background-frame inertness; verify with a screen reader.
6. Reduced-motion and performance-mode behavior must affect shell decoration without breaking browsing. Verify focus/selection/essential small text on actual composited backgrounds.
7. Test each supported engine/version/transport combination in identified Firefox, Chromium and Safari versions; record capability and end-to-end results separately. No fastest claim without controlled benchmarks.
8. Test canonical URL updates, redirects, in-page navigation, Back/Forward availability and failure recovery. Outer shell history must not substitute for destination navigation.
9. Validate history-off scope, session restore, cache deletion boundaries, wrapper popup-blocked states, real Tor unavailability/health, filter readiness and provider autocomplete opt-in. Account identity remains separate from these behaviors.

### Gaps

- This file specifies desired final behavior and wireframes; no settings dialog, Pill Bar, selector, account sync, history model, filter implementation or runtime adapter was built here.
- Final backend capabilities, destination-site test set, version/worker coexistence strategy, exact transport package pins and storage namespaces still need implementation research/validation.
- Geometry targets are design decisions. No rendered screenshot comparison, browser usability test or accessibility audit has been performed. Calculated contrast does not replace measuring the final composited UI.

[S1]: file:///var/folders/d1/1ykss2fs7_v0nx_r_8qd0_9c0000gn/T/TemporaryItems/NSIRD_screencaptureui_GG3CBh/Screenshot%202026-10-12%20at%204.58.04%E2%80%AFPM.png
[S2]: file:///var/folders/d1/1ykss2fs7_v0nx_r_8qd0_9c0000gn/T/TemporaryItems/NSIRD_screencaptureui_5ld9ar/Screenshot%202026-10-12%20at%204.58.16%E2%80%AFPM.png
[S3]: file:///var/folders/d1/1ykss2fs7_v0nx_r_8qd0_9c0000gn/T/TemporaryItems/NSIRD_screencaptureui_R3ReCh/Screenshot%202026-10-12%20at%204.58.26%E2%80%AFPM.png
[HT]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/theme.css#L4
[HN]: ../ojjyProxy%20implementation%20research/hub-theme.md
[FI]: ../ojjyProxy%20implementation%20research/feature-inventory.md
[EN]: ../ojjyProxy%20implementation%20research/engines.md
[NN]: ../ojjyProxy%20implementation%20research/networking.md
[P2]: file:///Users/tinlaplee/Downloads/Proxy2/README.md
[I110]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/index.html
[C110]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/config.js
[W110]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/sw.js
[I200]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/index.html
[C200]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/config.js
[W200]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/sw.js
[I202]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/index.html
[C202]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/config.js
[W202]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/sw.js
[I267]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/index.html
[C267]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/config.js
[W267]: file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/sw.js
[UVLOCK]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/4482b3cbc3387c2de1209d5bf3832688ca000534/package-lock.json
[WCAG]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
