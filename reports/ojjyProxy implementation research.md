if you do npm install on the basic example it should auto get @mercuryworkshop/wisp-js# Build ojjyProxy Into One Coherent Browser

## Executive recommendation

**Build ojjyProxy as one original, hub-blue browser workspace with Scramjet 2.x as its default rewriting engine and Ultraviolet as a deliberately bounded legacy fallback.** Use the source-identified **Scramjet 2.0.67-alpha.2/controller 0.0.14** pair, an initialized direct Epoxy transport, and an independently managed UV/Bare-Mux compatibility adapter; package a complete, pinned distribution instead of mixing tutorial generations. Match the current game hub's exact navy palette, typography, cards, pill inputs and centered navigation, then extend that vocabulary into real app tabs, bookmarks, local history, recovery, filtering and useful developer tools. Deliver the frontend through a dedicated HTTPS origin using a Deno server, with browsers connecting directly to an owned external Wisp relay; the requested Deno deployment must distinguish the Deno runtime from Deno Deploy's hosting policy. Current Deploy policy disallows forward proxies, and acceptance of a frontend-only application with external forwarding remains unresolved, so a provider permitting the whole use case is the release contingency. Later integrate through a familiar hub launch card opening the proxy as a top-level, separate-origin page; matching appearance does not require sharing the hub's service worker, credentials or storage. The newly added x8rr templates corroborate the 2.x architecture but contain the older **alpha.1/0.0.13** generation and incomplete frontend behavior, so they are setup references rather than the project foundation. This report specifies the finished product and its engineering contracts; **no application, deployment, browser rendering or compatibility benchmark was executed**. ([1]; [4]; [7]; [15]; [27]; [28])

**Evidence date: October 12, 2026.** “Current” means the versions and snapshots recorded in the supplied research notes or the new template inspection on this date. Branch presence, lockfile resolution and source wiring are not runtime validation. Official documentation and unpinned branch URLs remain rolling sources; commit links below identify the inspected application snapshots.

### Clickable contents

| Chapter | What it decides |
|---|---|
| [1. Combine the references through one deliberate product](#1-combine-the-references-through-one-deliberate-product) | Evidence legend, feature-source matrix, template findings and product boundaries |
| [2. Make every screen recognizably part of the blue hub](#2-make-every-screen-recognizably-part-of-the-blue-hub) | Exact tokens, component rules, journeys, desktop/mobile wireframes and all screens |
| [3. Separate browser state from engine and transport state](#3-separate-browser-state-from-engine-and-transport-state) | Tabs, URLs, history, search, persistence, capability limits and failover |
| [4. Pin the network architecture and resolve Deno hosting](#4-pin-the-network-architecture-and-resolve-deno-hosting) | Engine generations, migration, SW/assets, isolation, deployment and integration |
| [5. Ship through compatibility gates rather than feature labels](#5-ship-through-compatibility-gates-rather-than-feature-labels) | Filtering, tools, privacy, performance, licenses, milestones and testing |
| [Conclusion](#conclusion) | Implementation-ready first actions and remaining unknowns |
| [Evidence index](#evidence-index) | Seven local notes and numbered external primary sources |

## 1. Combine the references through one deliberate product

### Source-found behavior and proposed behavior have different meanings

The right synthesis is **a new shell around two adapters**, not a concatenation of reference websites. The notes establish a useful union: simple URL/search launchers, a framed browser, real-URL watching, engine and transport selection, configurable relay addresses, shortcut catalogues, persistent settings, request inspection, rewriter experiments and network diagnostics. They also expose attractive-looking features that are placeholders, version-specific mechanisms or outright source conflicts. The finished product should preserve the useful intent while implementing missing behavior explicitly. Its organizing principle is that the user sees one consistent browser, while the code retains separate concepts for website tabs, operating-browser windows, rewriting engines, transports, relays, local data and hub identity. ([4]; [5]; [9]; [12]; [22])

| Legend | Meaning throughout this report |
|---|---|
| **F — source-found** | Source includes a relevant implementation or handler. It was inspected, not executed. |
| **L — limited/legacy** | Implementation exists but has a stated boundary, older dependency generation or backend prerequisite. |
| **P — proposed** | New ojjyProxy specification, including adaptations and fixes. Not an inherited completed feature. |
| **U — unresolved** | A compatibility, policy or implementation question requiring a focused proof. |

Every description of the “finished project” below is **P unless explicitly identified as source evidence**. This distinction matters particularly for app-managed tabs, actual bookmark CRUD, searchable visits, private-session isolation, automatic fallback and account sync. None becomes available merely because a reference menu names it. The existing hub is the authoritative appearance reference; its account favorites are game IDs, and its public profiles are not a place to publish browsing destinations. ([3]; [9]; [13])

### The source matrix shows what each resource contributes

The six InvisiProxy archives were matched in the notes to their branch-head ZIP comments. Production is the strongest dual-engine integration reference, while master is the newer Scramjet-only rewrite. “Newest” is therefore not synonymous with “feature superset.” The engine source archives, captured deployed site, official apps, Epoxy showcase and new templates contribute different evidence and must remain identifiable. ([4]; [5]; [6]; [8]; [9]; [10])

| Resource or snapshot | Source-found contribution | What ojjyProxy should take; important contrast |
|---|---|---|
| Hub `91be48d…` | Exact default blue theme; cards, favorites/recent/A–Z, local preferences, accounts/KV, offline games | **F → P:** shared visual vocabulary and persistence patterns; new URL schemas and separate-origin integration |
| InvisiProxy production `eac37e3…`, 7.0.2.1 | SJ2 + UV, explicit startup, suggestions, plugins, separate worker paths | Dual-engine wiring and resolved artifact reference; its one frame and bookmark placeholder do not supply tabs/library |
| InvisiProxy master `242386f…`, 8.1.0 | TypeScript/Solid/Vite; SJ-only; improved settings, data-driven sites/icons, FAQ, mirrors | Settings/catalogue/lifecycle lessons; UV must be added deliberately, not assumed present |
| InvisiProxy dev `4482b3c…`, 6.9.8 | SJ1/UV, Bare-Mux/Epoxy2, Rammerhead sessions, older games/Flash/emulator navigation | Legacy comparison and migration boundary; Rammerhead records are not SJ/UV profiles |
| InvisiProxy soap `ea4b862…`, 6.9.8 | SJ alpha.1/UV combined worker; editable Wisp; real-window launch; partial network/cosmetic filter | Relay Apply/Reset, explicit new-window commands, parser lessons; implement readiness and limited grammar honestly |
| InvisiProxy soap-rewrite `65efd0b…`, 6.9.8 | Early SJ2/UV combined worker and domain filtering | Dispatcher precedent; lacks soap's endpoint/new-window additions |
| InvisiProxy archive `6e15e96…`, holyub 4.5.0 | MIT-era Express/Alloy launchers, title/icon cloak, utilities and vibeOS | Historical chooser/windowing inspiration; no requested modern engine stack or reusable current relay configuration |
| Scramjet main `b14b709…` and main source ZIP | Core alpha.2/controller model; demo Browser/Requests/Playground/Settings | Current engine contract and diagnostic hooks; source ZIP lacks built distributions |
| Scramjet scramgel source ZIP | Separate shared/client/worker/sync bundles, global controller | **L:** pre-all-bundle API despite `1.0.2-dev` label; not a drop-in alpha.2 or 1.1.0 setup |
| Scramjet legacy source ZIP | 1.1.0 all-bundle, Bare-Mux, IndexedDB config; toolbar and transport dialog | Documented old-generation comparison; do not transplant its bootstrap or fake isolation override |
| Captured `scramjet.mercurywork.shop` ZIP | Built developer UI, editor, request details, transport preferences | UX evidence; ~7.48 MB main JS and a missing physical inject asset make it a poor production shell bundle |
| Scramjet-App `f6f83cb…` | Simple URL/search launcher; **still SJ1**, Bare-Mux/libcurl; COOP/COEP reference | Search/asset-header lessons; repeated submit appends frames in inspected code |
| Ultraviolet main/source ZIP, 3.2.10 | Rewriting, cookie DB, Bare-Mux interface, engine build | Legacy adapter; upstream says unmaintained/superseded, not an equally maintained default |
| Ultraviolet-App / UV-Static | Working search parser pattern, one iframe, UV asset configuration, repair/error affordance | Consolidate parser/configuration; improve bare-domain HTTP default, startup waiting and error classification |
| Current create-proxy-app starter | Bootstrap/controller frame, cache/URL/escaped-link plugins | Modern sequence reference; dynamic package selection requires tighter production pinning |
| Epoxy showcase, commit `0c11678…`, deployed client 2.1.19-1 | Request composer, response viewer, outer Wisp logs, persisted endpoint/theme | Tools workspace; replace auto-send, unbounded body/log arrays and simplistic CORS prediction |
| x8rr HTML template `ab24688…` | Vendored alpha.1 core/WASM/controller 0.0.13, classic scripts, direct Epoxy3, one iframe | Small initialization reference and complete inject asset; visible back/forward/reload are unwired |
| x8rr React template, same commit | One `App.tsx`, one public SW, setup README | Component lifecycle lessons; no full scaffold/lock/build, no assets, floating controller install |
| browser.js reference | README describes configurable browser-in-browser | **U:** UI source not inventoried; do not attribute tabs/bookmarks/failover to README claims |

The detailed attribution is preserved in [feature-inventory.md](../research_notes/ojjyProxy%20implementation%20research/feature-inventory.md), [demo-ux.md](../research_notes/ojjyProxy%20implementation%20research/demo-ux.md), [engines.md](../research_notes/ojjyProxy%20implementation%20research/engines.md), and [templates.md](../research_notes/ojjyProxy%20implementation%20research/templates.md). Primary snapshot links and version evidence are provided in the [evidence index](#evidence-index). The matrix describes inspected resources, not successful access to every live reference service.

### The new templates simplify setup without changing the recommendation

The added ZIP comment matches upstream commit **`ab246887ba1003add1cd3e178d157b79e0f6a7f4`**, “Create LICENSE,” July 24, 2026. Read-only inventory found two directories: `templates/html/2.0.67-alpha.1/` and `templates/react/2.0.67-alpha.1/`. The archive SHA-256 is **`7e2b5086271552874aeb6cfddf6d469966589cc313146eb04d4f2bacbb899343`**. Matching identifiers and inventory do not establish a full byte comparison. The HTML directory includes actual core JS/WASM, controller API/inject/SW bundles, maps and a generated external module stub; the React directory contains only a component, worker and README. ([27]; [28]; [29]; [30])

The HTML controller bundle declares **0.0.13** and rejects any core other than **2.0.67-alpha.1**. It loads core before controller as classic scripts, takes `self.EpoxyTransport.default` from CDN Epoxy transport **3.0.1**, initializes transport, awaits `controller.wait()` and creates a frame. This independently corroborates the soap-era direct-transport model. It does **not** upgrade the recommendation to a newer engine; current notes identify alpha.2/0.0.14. Nor is the template fully self-contained: Epoxy is remote and the default relay is `wss://wisp.mercurywork.shop/`, whose health was not checked. ([28]; [29]; [31])

There are useful defects to learn from. HTML supplies back/forward/reload markup without handlers, sets Ready after submitting navigation rather than after page evidence, and has no real query-search branch. React passes input directly, uses the first frame, leaves asynchronous initialization uncaught, and cleanup only flips an `isMounted` flag. Its documented install pins alpha.1 core but floats controller and transport; today's controller metadata therefore cannot be assumed to match. Neither template implements COOP/COEP headers, Deno hosting, UV, multi-tabs or persistent browsing libraries. Preserve the initialization sequence, replace the grayscale UI, pin all artifacts and own the lifecycle. ([29]; [30]; [31])

### The combined scope should remain a browser tool

The default entry should be a practical new-tab/home screen inside the browser workspace, with a secondary About/Help page. Users should not pass through a marketing page, engine chooser and separate search page before browsing. The useful reference union becomes one omnibox, an explicit engine badge, editable shortcut cards, local libraries, clear loading/errors, structured settings and a Tools area. Games belong behind the **Games Hub** link; duplicating old game catalogues, ROMs, Flash runtimes and vibeOS would make this project less coherent and create unrelated asset responsibilities. ([9]; [12])

Offer title/icon appearance and a deliberate “open in new browser window” action as optional utilities. Treat about:blank/blob wrappers as later compatibility experiments: popup blocking, isolation and storage rules still apply, and changing visible tab branding does not hide network activity. Tor, regional egress and mirror dispensing appear only when operator configuration supplies real routes and support. A flag icon or localhost proxy port is not a provisioned region. A userscript manager, full DOM inspector or operating-system-style terminal would be separate later modules, not features inferred from commented Eruda, copied Chii or archive applications. ([9]; [10]; [12]; [22])

## 2. Make every screen recognizably part of the blue hub

### Exact default tokens are the visual contract

Use the current `/hub` default at commit **`91be48dcf75dbe7d1771eab9aa90b1b233c1a033`**, including the final stylesheet cascade. The baseline is muted navy with accent outlines, not electric cyan, permanent neon glow or the hub's separate ocean preset. The later navigation rule overrides earlier top-right positioning: current home actions are centered and wrap below the heading. Default background preference is none. The more detailed theme note takes precedence over the earlier inventory's loose overlay description: the **55% `--overlay` token is the image scrim; ordinary modal scrim is 88% navy**. ([1]; [2]; [3])

| Token | Exact value | Proxy-owned role |
|---|---|---|
| `--bg` | `#0a1628` | Canvas and inset fields |
| `--bg2` | `#111d2e` | Cards, toolbar and panels |
| `--bg3` | `#162a42` | Hover/selected surfaces |
| `--border` | `#1e3a5f` | Thin outlines and dividers |
| `--accent` | `#2e6bbd` | Focus, selection and progress |
| `--text` / `--text2` | `#e2e8f0` / `#c8d6e5` | Primary and body text |
| `--dim` / `--faint` | `#64748b` / `#475569` | Metadata/decorative or inactive content; contrast-check essential text |
| `--overlay` | `rgba(10,22,40,.55)` | Optional background-image scrim |
| `--star` | `#f0c040` | Bookmarked/favorite star |
| `--danger` | `#e05555` | Errors/destructive text |
| `--danger-bg` / `--danger-bd` | `#2a1a1a` / `#4a2020` | Destructive controls |
| `--ok` / `--warn` | `#4ade80` / `#e0a355` | Success and warning, always with text/icon |
| `--onaccent` | `#0a0a0a` | Existing filled-accent foreground token |
| `--spark` | `#ffffff` | Optional background particles |
| `--ring` | `color-mix(in srgb,var(--text) 22%,transparent)` | Swatch ring, not general focus outline |

These are source CSS values, not measured screenshot pixels. Translucency means the composited surface depends on background. Keep default tokens intact and choose accessible semantic combinations for critical labels; exact brand color does not justify low-contrast operational text. Filled controls should use a deliberate tested foreground recipe rather than copying conflicting welcome/feedback/profile variants indiscriminately. ([1]; [2])

| Component | Exact hub recipe to preserve |
|---|---|
| Font/title | `'Segoe UI', system-ui, -apple-system, sans-serif`; title `2.4rem`, weight 300, `.05em` spacing |
| Home header/content | Header `3rem 1rem 2rem`; content max 900px, `2rem 1.5rem` padding |
| Cards/grid | 16px radius, `2rem 1.5rem` padding; `minmax(220px,1fr)`, `1.2rem` gap; 64px icons |
| Card surface | `color-mix(in srgb,var(--bg2) 88%,transparent)`, 10px backdrop blur, 1px border |
| Search/toolbar | 85% bg2, 8px blur; search 999px radius, `.7rem 1.2rem`, `1rem` text, 400px home maximum |
| Header controls | 11px radius, 9px 15px padding, `.88rem` text; centered wrapping row, 8px gap |
| Chips/rows | Chips 999px, 5px 12px, `.76rem`; rows 12px, `1rem 1.2rem`, `.7rem` separation |
| Icons/stars | 15px SVG, 24-viewBox, stroke 2, rounded caps/joins; favorite `☆/★` gold/faint treatment |
| Focus/hover | 2px accent outline + 2px offset; search 3px accent shadow at 22%; card hover rises 3px |
| Dialog/motion | Ordinary scrim 88% bg, blur 10px; customize panel 520px; `.2s` hover, `.5s` 8px entrance |

The browser workspace deliberately extends the 900px catalogue into a full-width page region. Its tabs and toolbar are new components using these tokens, not an exact inherited hub layout. Optional gradients follow the hub's slow 28-second background recipe; they remain user-selected and pause during browsing. Seasonal birthday overrides, ocean/cyan and midnight/purple are not the base deliverable. A version-pinned design layer should keep appearance changes reviewable when the hub evolves. ([1]; [2]; [3])

### A first journey should feel familiar and immediately useful

A first-time user opens ojjyProxy to the navy canvas, lightweight centered title and concise subtitle. Outlined actions say “hub,” “bookmarks,” “history,” “settings,” and “connection.” The central pill says “enter a URL or search…”; Scramjet is selected beside a quieter “Ultraviolet — legacy” option. Empty shortcuts explain “no saved sites yet” with a small add action. If the operator supplies starter destinations, call them shortcuts, never guaranteed-compatible sites. The footer can retain “made by Jonas Lee” and expose Help, Credits and Source. Standalone state says **“saved on this browser,”** not a fabricated hub login. ([2]; [3]; [9])

Submitting a domain starts the active tab. The shell remains usable while status advances through real asset, worker, controller and request stages. A returned page fills the content region without blue CSS being injected into it. Starring the page opens a small editable bookmark form, then makes a gold-star shortcut available at home. Opening a second site creates an independent app tab. If a rewrite fails, a calm navy error card retains the target and offers retry, legacy engine or diagnostics; switching warns that page state and login session can differ. Returning later offers a saved-session choice and restores background tabs lazily. This journey combines source concepts but requires the new state model specified in chapter 3.

### Desktop and mobile wireframes establish hierarchy

The following are **textual design wireframes, not screenshots or rendered mockups**. Home remains an airy hub-like catalogue; browsing expands to use the viewport. A library panel is optional, normally collapsed, and never substitutes for the centered home action row.

```text
DESKTOP — home/new tab
┌─────────────────────────────────────────────────────────────────────┐
│ [home ×] [example site ×] [+]                              [tabs ▾]  │
│                  ojjyProxy                                          │
│                  browse the web, made by jonas:)                      │
│       [hub] [bookmarks] [history] [settings] [connection]             │
│             ( enter a URL or search…                    ) [go]       │
│                  [Scramjet ✓] [Ultraviolet — legacy]                 │
│                    engine ready · relay not checked                  │
│              [favourites] [recent] [a–z] [filter saved]              │
│        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│        │ icon      ★ │ │ monogram   ☆ │ │      +       │             │
│        │ site name   │ │ site name    │ │ add shortcut │             │
│        │ domain      │ │ domain       │ │              │             │
│        └──────────────┘ └──────────────┘ └──────────────┘             │
│             saved on this browser · help · source                    │
└─────────────────────────────────────────────────────────────────────┘

DESKTOP — browsing with optional library
┌─────────────────────────────────────────────────────────────────────┐
│ [site A ×] [site B ×] [home ×] [+]                         [tabs ▾]  │
│ [←] [→] [↻] [home] ( https://actual-target/path ) [★] [SJ ▾] [⋯]   │
│ [library] ┌───────────────────────────────────────────────────────┐ │
│ bookmarks │ Destination website retains its own styles            │ │
│ history   │ Large independent page region                         │ │
│ tools     │                                                       │ │
│ hub       │                                                       │ │
│           └───────────────────────────────────────────────────────┘ │
│                     quiet contextual status                         │
└─────────────────────────────────────────────────────────────────────┘

MOBILE — browser                       MOBILE — overflow/library sheet
┌────────────────────────────┐         ┌────────────────────────────┐
│ [site A] [site B] [+] [2 ▾]│         │ bookmarks              [×] │
│ [←] ( actual URL… ) [↻][⋯]│         │ ( filter saved sites… )    │
│ ─ loading / retry message ─│         │ icon  site label       [⋯] │
│                            │         │       domain               │
│ Destination responsive     │         │ [add] [import] [export]    │
│ page                       │         │                            │
│                            │         │ engine / history / tools   │
│                            │         │ settings / hub             │
└────────────────────────────┘         └────────────────────────────┘
```

### Home and browser screens prioritize different kinds of space

**Home/new tab** uses the 900px container, 220px-minimum launch cards and familiar favorite/recent/A–Z chips. The main omnibox navigates; a separate optional filter searches saved shortcuts. This resolves the ambiguity of a single field both opening URLs and hiding cards. Keep the exact 400px baseline on desktop home; any wider 520–600px functional variant should be acknowledged as an extension. Missing favicons use stable name-derived monograms, avoiding uncontrolled direct favicon calls merely to decorate the start page. A Continue session row appears only when a real stored snapshot exists. ([2]; [3]; [9])

**Browser** uses 12–24px desktop gutters or a compact edge-to-edge mode. A horizontally scrolling tabstrip shows meaningful titles, active state, close controls and an overflow list. Navigation contains back, forward, reload, home, flexible omnibox, star, engine badge and menu. Stop is offered only to the extent the adapter can actually cancel; a stop-looking button that cannot interrupt rewriting or sockets is misleading. The visible address is the real destination, while encoded routes belong in details. Focus mode hides nonessential chrome with a discoverable return control; genuine Fullscreen is a separate user action with supported/denied feedback. ([9]; [12]; [19])

### Libraries should provide real persistence rather than decorative menus

**Bookmarks** opens as a hub-width page or desktop side panel, with a small-collection overlay option. Rows have an icon/monogram, title, domain, favorite state and open/edit/remove actions. Add/edit collects label, canonical URL, optional description, folder/tags, preferred engine and home-pin flag. Star acts immediately, with undo for removal; bookmark deletion never clears destination cookies. Versioned JSON import/export is the first portable format, with validation, duplicate preview and merge behavior. Browser-bookmark HTML is a later parser, not an implied initial capability. No duplicate title-cloak form IDs or literal “Bookmark” placeholder should survive. ([9]; [13])

**History** groups visits by day, provides label/domain searching and separate item/domain/date-range/all deletion. A record shows time, title, destination and effective engine. Do not reuse the hub's playtime graph to log websites; public game profiles and proxy visits are separate models. Default local retention can be proposed as **30 days or 2,000 visits, whichever limit arrives first**, adjustable and clearly disclosed. Those numbers are product defaults, not measured requirements. Clearing history preserves bookmarks/settings and does not erase native browser, OS or relay records. Session recovery has its own clear action. ([3]; [9]; [12])

### Settings and tools have consistent surfaces but different audiences

**Settings** uses the familiar 520px modal for quick changes and a full page for longer configuration. Sections are Appearance, Browsing, Privacy & Data, Connection, Launch Behavior, Diagnostics, Integration and About. A single preference registry feeds every compact and full control, avoiding contradictory source defaults. Appearance starts at exact default blue, comfortable density, still background and system font. Compact mirrors 150px-minimum cards, 44px icons and 12px radii; roomy mirrors 260px cards and 78px icons. Optional theme import can adapt the hub's `OJT1-` codes, but a theme code is neither full preference transfer nor SSO. Apply safe saved tokens before paint and provide reset/preview. ([2]; [3]; [9])

**Connection** shows selected transport, endpoint, versions, worker scope, initialization evidence and last successful request/check time. “Configured,” “initialized” and “connected” are different labels. Custom relay editing uses Validate, Test, Apply and Reset, with dirty drafts independent of active configuration. Endpoint changes explain their all-tab scope and that old requests/sockets need not migrate. Advanced route options stay absent until actual operator capability data exists. **Tools** has Browser Requests, Request Builder, Transport Log, Playground and Capability Status; heavy editors load only when opened. Tools inherits the hub's blue controls, not the source demos' visual theme. ([9]; [19]; [22]; [23])

### Errors and mobile behavior are part of the normal experience

**Error/recovery** uses the same navy panel and small outline controls. It names the stage when supported by evidence: invalid input, missing asset, worker control, version mismatch, controller handshake, transport failure, filter block or destination response. A valid remote 403/404/500 can be a loaded error page; it is not automatically a broken proxy. Preserve the entered URL, engine and last useful page. Details are expandable and redacted by default. “Try again,” “change transport,” “try Ultraviolet,” “wait,” and “home” appear only when appropriate. Progress is stage text plus an indeterminate thin accent track, never an invented percent or a spinner hidden after five seconds as proof of success. ([9]; [19])

**Mobile** preserves the title, wrapping home actions and cards, with roughly 1rem gutters. At a proposed 600px workspace breakpoint, engine/history/settings move to overflow, while back, address and reload remain visible. Use at least 44px proposed touch hit areas around 15px icons; do not shrink tabs to unreadable slivers. A tab count opens a sheet, library forms stack, and tools' request/response columns stack near the showcase's 850px precedent. Dynamic viewport sizing should account for the on-screen keyboard and safe areas. Destination pages retain their own responsive rules. Test 320px layouts, zoom and long URLs; the hub's auto-fill grid does not automatically solve browser-toolbar overflow. ([2]; [3]; [23])

## 3. Separate browser state from engine and transport state

### A tab owns a destination, not an encoded route

The app tab manager is new work. Each tab needs a stable ID, selected/effective engine, title/icon metadata, input draft, requested target, committed target, display URL, frame generation, navigation ID, status/error, last-active time and recoverable snapshot metadata. Store **absolute canonical HTTP(S) destinations**, never Scramjet controller/frame IDs, UV XOR paths or one shared last-frame URL. The current Scramjet controller generates random controller and frame prefixes and routes through a live page reference; those virtual URLs are not durable bookmarks. UV needs its configured encoder/decoder pair. ([7]; [15]; [16]; [19])

| State domain | Proposed values or contract | Evidence boundary |
|---|---|---|
| Engine readiness | uninitialized → loading assets → worker registration → awaiting control → controller/config init → ready; failed/unsupported exits | SJ2 requires `wait()`; UV requires matching config and ready transport, not only registered SW |
| Transport health | unknown, connecting, ready, degraded, reconnecting, failed | Socket open is not necessarily negotiated Wisp readiness; use exposed events/probe evidence |
| Tab navigation | idle, waiting, navigating, initialized, loaded, degraded, stalled, failed, switching | `frame.go()` does not return a page-success promise |
| Editable address | `inputDraft`, `isEditing`, selected suggestion | Redirect watchers cannot overwrite an active edit |
| Canonical navigation | `requestedTargetUrl`, `committedTargetUrl`, `displayUrl`, `navigationId`, `frameGeneration` | Ignore stale events from replaced navigation/frame |
| Navigation evidence | top-level request/init, URL event, document load, structured error | Hash/SPA updates and iframe load are not identical to successful full-site operation |
| Recovery data | versioned ordered tab metadata + selected tab | Reconstruct new frames from real URLs; not serialized live sessions |

New/select/close/duplicate/reopen-last-closed, keyboard reorder and overflow list belong in the first durable tab design. Pinning and tab search can follow. A duplicated tab copies a destination and preference, not the site's in-memory JavaScript/forms. Closing releases owned frame/listener/capture resources; background tabs initially retain state for continuity, while lazy restore avoids opening every saved website at startup. True suspension destroys a live page and therefore needs an explicit user-visible tradeoff. Separate real-browser-window launch uses a target-bearing shell URL and handles popup rejection without losing the app tab. ([9]; [12])

### URL events require an honest history policy

Use Scramjet's URL watcher and top-level initialization hooks to update the address, redirects and same-document changes. Deduplicate repeated hash notifications, preserve editing, and distinguish push versus replacement where the API actually exposes it. A new requested URL is not immediately a committed successful visit. Title/favicon collection needs adapter-specific proof and fallback to domain labels. UV shell signaling and origin validation need a focused implementation proof; blindly polling and regex-decoding whatever happens to be in an iframe URL should not be the permanent contract. ([19]; [20])

**Recommend engine-native frame back/forward for live tabs**, with application history as a visit ledger rather than a second command stack. Scramjet's `frame.back()`, `forward()` and `reload()` operate the frame's actual history/location; the inspected API has no reliable `canGoBack` query. Therefore toolbar boundaries can reflect confirmed app-tracked traversals only, with capability marked unknown when the adapter cannot prove native position. Do not promise perfectly accurate disabled controls until traversal signals are validated. Calling outer `history.back()` follows the reference shell's global history, and decrementing a guessed index while issuing `.go()` can discard in-page transitions or replay a POST. Both are poor substitutes. ([7]; [9]; [19])

If accurate unified cross-engine navigation later requires a shell-only navigation stack, explicitly define it as **reopen visited destinations**, not native site history. It loses document state and form semantics. Switching engine begins a new native frame history domain while preserving the app's visit ledger. Browser Back at the operating-browser level, iframe history and the app history screen remain separate concepts. On reload, use the committed current frame, not the last edited home preference. History recording being disabled must not disable ordinary live frame back/forward.

### One omnibox policy should replace contradictory parsers

Trim input, preserve the draft, reject malformed explicit HTTP(S) URLs locally, and recognize bare hosts/IPs with an optional port/path before building a search query. Default bare domains to **HTTPS**; allow deliberate `http://` and clearly distinguish its destination encryption. Keep query parsing deterministic, including spaces, internationalized domains and dotted terms. Reject `javascript:`, arbitrary `data:`, `blob:` and local-content shortcuts in normal browsing; provide explicit local examples in Playground instead. The source UV/InvisiProxy heuristic defaults bare hosts to HTTP, while simple Scramjet/template normalization only prepends HTTPS and does not actually search. ojjyProxy must combine the useful intent and replace both limitations. ([9]; [19]; [29])

A single provider registry controls display name, verified query template, suggestion endpoint/parser, enabled state and suggestion-source label. Default **DuckDuckGo** follows actual InvisiProxy source defaults rather than stale Startpage comments. Google, Bing, Brave and Startpage can be selectable when their current parser/endpoints are validated. The inherited Startpage suggestion mapping uses Bing; label that explicitly or disable suggestions for it until a direct alternative is verified. Encode query text through the provider template. Search-provider configuration is global preference; per-tab engine is a separate selection. ([9]; [12])

Suggestions should be **off by default** as a proposed local-first choice, with a clear explanation that enabling them sends partial input to the chosen suggestion source through the configured transport. Combine local bookmarks, optional visits and open-tab matches with tagged remote suggestions. Use debounce, cancellation and monotonically increasing request IDs so late responses cannot replace newer text. Failures leave submission usable. Implement combobox/listbox semantics, ArrowUp/Down, Enter to select/submit, Escape to dismiss, and visible source labels. Focus guards suppress requests during input-method composition. Do not fetch suggestions as a prerequisite to navigating.

Keyboard behavior is scoped to the shell. `/` focuses home search outside editable controls; Escape closes suggestions/dialogs or restores content controls; grid arrows/Home/End/Enter follow the hub pattern. Modifier-Enter can explicitly open a new app tab or real browser window according to the displayed action. Advertise only shortcuts the browser actually delivers: native Ctrl/Meta+L, +T or +W cannot be assumed capturable by a web page. Do not steal typing or shortcuts from destination forms. Tabs use roving focus and proper tab semantics, and dialogs trap/restore focus.

### Bookmarks, visits and recovery have separate lifetimes

Use one versioned IndexedDB application database, proposed as `ojjyproxy-app-v1`, for bookmarks, visit records and recovery snapshots; a small pre-paint preferences record can use `ojjyproxy:preferences:v1` in localStorage. Icon cache, request logs and playground projects remain distinct. Canonicalization should remove internal proxy routes while preserving meaningful destination query/hash; dedup rules must not blindly strip every query parameter. Import has a schema version, bounded item counts, invalid-entry report and merge preview. Corrupt/full/blocked storage falls back to memory with “changes won't be saved” rather than preventing browsing.

Write recovery snapshots after meaningful metadata changes, debounce them and flush opportunistically; **unload is not a reliable cleanup or save guarantee**. Restore tab order, effective/preferred engine and last committed destination, lazily opening background tabs. Explain that cookies can persist separately, while forms, downloads, native back stacks and open sockets are not recovered. Reopen-last-closed is a short metadata list, with excluded-history tabs omitted. A failed restoration retains the destination and offers retry. Session recovery does not convert generated Scramjet routes into portable direct links. ([15]; [19])

Guest/local-first is the initial identity model. Later bookmark/preference sync needs account-specific records, deletion tombstones, revision/conflict rules and retry queues inspired by the hub's favorites, not copied game IDs. History/session sync is a separate explicit choice. Switching hub accounts must not accidentally upload the prior identity's local visits. A separate proxy origin cannot read hub cookies or localStorage; an account shortcut can link to the hub without claiming the proxy itself is authenticated. ([3]; [14])

### Capability and fallback must distinguish the engine from its relay

| Capability | Scramjet 2.x evidence | Ultraviolet evidence | Finished-product rule |
|---|---|---|---|
| HTML/CSS/JS rewriting | Implemented core/controller hooks; experimental upstream characterization | Implemented 3.2.10 rewrites; unmaintained upstream | Test the intended site/browser set; no universal compatibility label |
| Navigation tracking | Frame methods + URL watcher/history/hash hooks | Encoded-route/config path; shell event bridge needs proof | Maintain canonical addresses; report unknown boundaries honestly |
| Cookies/site storage | Shared controller jar in `__scramjet_controller`; emulated namespaces | Cookie DB `__op`; separate emulated storage | No automatic cross-engine session migration or per-tab account isolation |
| Destination WebSockets/workers | Implemented transport bridge and worker rewriting | Bare-Mux-backed bridges | Test protocol/extension/flow-control and worker cases, not just page load |
| Target service workers/offline PWA | Not established by current inspected flags | Explicitly removes navigator serviceWorker in handler | Proxy SW does not imply destination-PWA parity |
| Request hooks/tools | Rich fetch/init/error hooks | Request/beforemod/response hooks | Inspector parity is adapter-specific, initially SJ-first |
| Shared response caching | Optional plugin, pre-rewrite cache with limitations | Different engine path | Defer shared target cache until authenticated-content tests pass |
| DRM/WebRTC/QUIC/CAPTCHA | No runtime proof | No runtime proof | Site-specific results, never blanket support claims |

The source characterizes Scramjet both as experimental and, in documentation, stable enough for many uses; neither is an independent stability measurement. UV's maintenance status is a strong reason to make it secondary, but does not prove Scramjet faster or universally more compatible. WebSocket existence also does not imply native-equivalent buffered amount or protocol reporting; inspected Scramjet implementation contains limitations deserving tests. ([7]; [17]; [19])

Default fallback is **manual**. If a top-level error appears engine-specific, offer “try Ultraviolet” while preserving the real destination and explaining that login, forms and history state can differ. An optional Auto mode can later attempt at most one alternate engine for a confidently classified **safe GET/HEAD navigation**, recording the attempted set per navigation token. Do not trigger it from a missing subresource, ordinary remote 4xx/5xx, CAPTCHA, rejected login, relay auth/rate-limit/egress block or timeout alone. A stalled page stays running with a Wait action. Transport failure calls for reconnect/change transport, not an engine carousel. ([19])

**Never silently replay non-idempotent activity.** POST, uploads, checkout actions, form submissions and unknown navigation methods need user confirmation before retry/reload/engine switch; opening the last known GET URL is a separate action. Even nominally idempotent methods can have practical application consequences, so automated fallback should stay narrower than “all repeatable HTTP.” Once a request has left the browser, cancellation cannot prove the destination did not process it. Preserve error evidence and prevent loops. Reconnect uses exposed lifecycle or a documented reinitialization path, bounded backoff and cancellation; a reopened relay does not resume every established target stream.

## 4. Pin the network architecture and resolve Deno hosting

### Two Scramjet generations cannot share one bootstrap recipe

The notes preserve a consequential split: npm **latest is 1.1.0**, using the all-bundle/Bare-Mux model, while inspected main and its core manifest are **2.0.67-alpha.2**, with controller **0.0.14** and direct `ProxyTransport`. Documentation still teaches `$scramjetLoadController()`, `$scramjetLoadWorker()` and Bare-Mux, while its transport guide now discourages Bare-Mux. The new templates use alpha.1/0.0.13. Package names alone therefore cannot select a coherent API. Root `scramjet-root 1.0.0` is not the main core's version. Controller's permissive peer range does not override its exact core-version assertion. ([7]; [15]; [18]; [28]; [31])

| Generation | Frontend/worker and assets | Integration rule |
|---|---|---|
| SJ scramgel | Global controller; separate shared/worker/client/sync bundles | Historical snapshot; inspect files rather than trusting `1.0.2-dev` label |
| SJ 1.1.0 | `scramjet.all.js`, `scramjet.wasm.wasm`, `scramjet.sync.js`; load-controller/load-worker helpers; IndexedDB config; Bare-Mux | Await engine init/config and transport. Correct worker must pass a Response promise, not an uninvoked async function |
| SJ 2 alpha.1 | Core `scramjet.js`/`scramjet.wasm`; controller 0.0.13 API/inject/SW; direct transport | x8rr/soap reference only; exact matching pair |
| SJ 2 alpha.2 | Core + controller 0.0.14; `new Controller`, `wait`, `createFrame`, `frame.go`; RPC routing | Recommended adapter; core loaded before controller; real WASM distinct from virtual WASM JS |
| UV 3.2.10 | bundle/config/client/handler/engine SW; separate registration wrapper; Bare-Mux | Load bundle before config; distinct prefix and matching encoder; validate header bridge |

Use the production resolved stack as the **source-validated candidate artifact set**, not a runtime-tested guarantee: SJ alpha.2/controller 0.0.14, proxy-transports 1.0.2, Epoxy transport 3.0.1/epoxy-tls 2.1.19-1, Bare-Mux 2.1.9, libcurl transport 2.0.5, Scramjet utils 0.0.3 and the exact **`v3.2.10-headers` UV release tarball, `titaniumnetwork-dev-ultraviolet-3.2.10-headers.tgz`**. That custom UV artifact differs from stock npm 3.2.10 and requires checksum, license, content and raw-header compatibility verification before acceptance. Its binary patch and availability were not inspected. Do not substitute stock UV and declare the same compatibility. If it cannot be reproduced, keep UV disabled in the release candidate while proving a maintained local bridge; preserve the previous known-good whole release for rollback rather than mixing old/new files. ([4]; [6])

For migration experiments only, the dev lock records a coherent legacy comparison set: **SJ 1.1.0, stock UV 3.2.10, Bare-Mux 2.1.9, Epoxy transport 2.1.28/epoxy-tls 2.1.18-1 and libcurl 1.5.2**. It is source-integrated, not runtime-validated. Keep it in a separate adapter fixture/asset release if needed to diagnose the UV header migration; do not downgrade individual production components into that older combination. The recommended shipped engine generation remains SJ2. ([39])

Migration should introduce one application adapter contract for initialize, create/dispose frame, navigate, reload, traversal, URL/title events and structured errors, with explicit unknown capabilities. First prove SJ2 alone and an owned relay; then add UV's separately initialized legacy mux path. Configure both from one endpoint registry but **do not promise a shared socket or per-tab relay isolation**. Keep Bare-Mux only behind UV's bridge; upstream deprecates it in favor of proxy-transports. Upgrade by immutable release sets, comparing event/header semantics and compatibility fixtures, not by replacing import names. ([4]; [6]; [18]; [19])

### The architecture gives each layer one responsibility

```text
Existing Deno game hub ── familiar launch card ──► top-level proxy origin
                                                    │
                         Deno frontend server ───────┤ pinned shell/assets
                         (no forwarding data path)   │
                                                    ▼
                           blue shell + tabs + local persistence
                                          │
                           frames issue virtual-route requests
                                          ▼
                            one namespaced SW dispatcher
                                │                      │
                         SJ2 route via RPC         UV engine SW
                         to live controller        rewriting/fetch
                                │                      │
                         direct transport          Bare-Mux bridge
                                │                      │
                         compatible Epoxy / optional libcurl
                                └──────────┬───────────┘
                                    direct WSS
                                          ▼
                        owned external persistent Wisp host
                                 destination TCP streams
                                          ▼
                                    target websites
```

Epoxy performs destination TLS in browser WASM for compatible HTTPS requests, while Wisp forwards socket bytes and sees destination host/port. Wisp is neither the rewriter nor the bookmark server. A Bare server is a different backend protocol, not a remedy for an unavailable Epoxy Wisp endpoint. Prefer a separately operated Wispurr service for its source-documented authentication/egress/worker controls, with reviewed configuration and a reverse proxy handling TLS/upgrades; do not copy production's enabled loopback destinations. Simple Node wisp-js is a fallback operational choice, not an asserted performance loser. TCP-only/UDP-disabled settings must match transport extension requirements. ([4]; [35]; [36])

| Proposed directory/route | Responsibility |
|---|---|
| `server.ts`, `deno.json`, `deno.lock` | Deno shell/static router, exact MIME/header/cache behavior |
| `src/shell/`, `src/state/`, `src/storage/` | Screens, tab/event reducer and versioned data |
| `src/engines/scramjet2/`, `src/engines/ultraviolet3/` | Generation-specific adapters; optional compatibility proofs |
| `src/transport/`, `src/filtering/`, `src/tools/` | Endpoint/capability registry, filter normalization, diagnostic modules |
| `public/proxy/`, `/proxy/` | Shell/home; `/proxy/bookmarks`, `/proxy/history`, `/proxy/settings`, `/proxy/tools`, `/proxy/help` views |
| `/proxy/sw.js`, scope `/proxy/` | One classic dispatcher; shell itself inside scope |
| `/proxy/assets/<release>/scramjet/`, `controller/`, `uv/`, `baremux/`, `epoxy/`, `libcurl/` | Complete matched distributions, configured absolute asset URLs |
| `/proxy/scramjet/`, `/proxy/ultraviolet/` | Virtual engine prefixes, separate from assets and application views |
| `/proxy/config.json`, `/proxy/launch?url=…` | Operator-safe public config; validated canonical-target launch, not durable engine route |
| External `wss://relay.<owned-domain>/wisp/` | Placeholder endpoint; not a provisioned service |

This chooses the narrower `/proxy/` strategy from the hub-integration notes over an unnecessary root registration. It works conceptually on a dedicated origin and leaves a portable namespace for later integration. Scope, virtual prefix and asset directory are three separate settings. Root `/sw.js` examples are conveniences, not a requirement that the hub's worker be replaced. Redirect `/proxy` to `/proxy/`; supply deliberate recovery for uncontrolled virtual-route loads. ([14]; [16])

### Worker composition and deployment assets need an explicit proof

```text
DESIGN PSEUDOCODE — NOT TESTED RUNNABLE CODE

load pinned Scramjet controller SW support
load UV bundle, then matching UV config, then UV engine SW support
construct UV worker instance for its distinct prefix

on fetch(event):
    if current Scramjet controller predicate recognizes event:
        respondWith(Scramjet controller route(event))
    else if UV predicate recognizes event:
        respondWith(UV engine fetch(event))
    else:
        leave unhandled, or use separately scoped shell-cache policy

invariant: exactly one response branch owns the event
```

Import engine support bundles, not two stock wrappers each installing competing fetch listeners. Soap provides combined-worker precedent; production instead uses root SJ plus narrower UV scopes. Exact imported globals/listeners still require verification against the selected distributions. Registration must wait for activation/control and the current controller channel with a bounded timeout. SJ2's SW revival reestablishes messaging; it differs from SJ1 `loadConfig()`. Root registration replacement or unregister-all logic is not an engine toggle. ([5]; [16]; [19])

Serve JS and `.mjs` as JavaScript, WASM as `application/wasm`; missing assets must return a real 404, never SPA/login HTML. Configure SJ core/inject/WASM and UV handler/client/bundle/config/SW URLs consistently. Use revalidation for worker/config/shell and immutable fingerprinted release assets. `updateViaCache:'none'` covers SW scripts/imports, not every engine JS/WASM. Retain old release assets while existing tabs reference them; stage update notifications before forcing reloads. The inspected bootstrap dynamically downloads packages, has pin fields unused by current selection, an Epoxy route discrepancy and hardcoded Wisp upgrade path; an explicitly packaged deployment is more reproducible. Published bootstrap latest is **0.0.5**, whose development metadata names controller **0.0.13**; do not equate published package behavior with the inspected main bootstrap. ([7]; [15]; [16]; [21]; [38])

Only source-verified commands should enter the build instructions. For **current Scramjet main source**, upstream says recursive clone, root `pnpm i`, then `pnpm rewriter:build` and `pnpm build` in `packages/core`; root `pnpm dev` serves the demo, not the future Deno production app. The supplied workspace pins pnpm 10.12.1; Rust nightly, rust-src, WASM target, wasm-bindgen-cli **0.2.105**, Binaryen and the wasm-snip fork are build prerequisites. UV source documents `npm run build` after dependency installation. The x8rr HTML README documents `python3 -m http.server 3000`, `bunx serve .` or `npx serve .`; these do not configure isolation headers. No React template build command or ojjyProxy task has been verified, so none is invented here. ([7]; [17]; [28]; [30])

### Cross-origin isolation is a deployment constraint, not a Boolean hack

Shared-memory-dependent transport/features need a secure context and actual isolation, normally COOP **`same-origin`** plus COEP **`require-corp`**, with compatible resource and Permissions-Policy behavior. Check `crossOriginIsolated` and SharedArrayBuffer in the relevant page/worker contexts after deployment. Determine requirements for each pinned transport/build; ordinary WASM is not inherently proof of a shared-memory requirement. Archived Firefox overrides explicitly marked unsuitable for production cannot create browser isolation. Failure should produce a capability explanation or tested non-shared-memory alternative, not a fabricated flag. ([7]; [24])

COEP conflicts with unapproved cross-origin scripts, fonts, images and embedded documents. Self-host engine, transport, editor and icon assets; use CORS/CORP-compatible external resources only when tested. Audit rewritten iframe responses and direct passthrough assets against the isolation policy, instead of assuming header rewriting solves every embed. COOP separates opener browsing-context relationships, affecting popup/about:blank/SSO workflows. An isolated proxy embedded in a nonisolated hub raises ancestor/permissions/embedding constraints; the first integration should open top-level. `credentialless` can be investigated for supported browsers but changes resource credential behavior and does not universally repair iframe compatibility. Keep isolation headers on the proxy namespace rather than applying them globally to unrelated hub games. ([14]; [24])

### Deno runtime support does not establish Deno Deploy permission

Deploy Classic supports outbound TCP/TLS and WebSockets, so saying “Deno cannot do sockets” is incorrect. Its documented **raw TCP-to-443 prohibition requires TLS termination**, conflicting with browser-side TLS through standard Wisp. Replacing raw TCP with `connectTls()` changes the expected byte stream, not transparently fixes it. Official docs scheduled Classic/subhosting v1 shutdown for July 20, 2026; this report is later, so Classic is not the new-build target. The hub's checked-in project configuration does not prove its live migration status. ([25]; [26])

New Deploy documents standard Deno in Linux environments, filesystem/subprocess/native support and WebSocket lifecycle. Its page reports Deno **2.5.0** and no custom unstable flags; these are documentation facts, not a deployed probe. Active frames can keep apps alive, yet eviction interrupts connections; inactivity shutdown varies from five seconds to ten minutes. Node Wisp upgrade handlers accept Node request/socket/head, unlike Fetch `Request` in `Deno.serve`, so runtime compatibility still needs proof. The Classic-specific port-443 statement cannot be copied as a verified new-runtime technical ban. ([26]; [32])

The decisive policy fact is narrower and clearer: **current Deno Deploy AUP lists reverse proxies as acceptable and forward proxies/VPNs as unacceptable**. A direct verification of that page for this synthesis confirms its wording concerns **the Deno Deploy service's resources**, not the Deno runtime everywhere; it also lists SPAs/Jamstack as acceptable and shows an October 7, 2025 update date. Wisp's client-selected destination streams fit forwarding; new runtime capability does not grant permission. Browser-to-external-relay frontend delivery is technically distinct, but no explicit carve-out settles acceptance of the broader frontend-only proxy application. Recommend Deno frontend on new Deploy **only when that use is acceptable to the provider**, with direct external WSS rather than tunneling through Deploy. The release contingency is the whole project on a permitted host, retaining Deno for frontend serving and a separate persistent relay process. This satisfies the Deno technology requirement without inventing a blanket policy exemption. ([26]; [32]; [33])

### Hub integration starts with a card and preserves its existing systems

The hub is custom `Deno.serve` HTML rendering with KV-backed accounts, host session cookies, an auth gate, generic head injection and local/GitHub fallback assets. Its root offline worker uses `hub-shell-v9` and `hub-games-v1`, ignores queries in shell lookup and currently has no proxy exclusion. `public/apps` is in deploy exclusions; the fallback MIME map lacks `.mjs`; normal fallback follows moving master. A proxy dropped into that directory can therefore lose assets, receive login HTML, pick up anti-inspect/cloak injection or be cached incorrectly. ([3]; [14])

Add a hub-style ojjyProxy card opening the independent origin top-level. Keep hub profile/account links honest; host-only cookie and KV sessions do not automatically authenticate a sibling origin. Later SSO requires a narrowly scoped, validated, short-lived handoff, not forwarding the long-lived hub query token into browsing. KV sync records need a private URL schema and verified new-platform binding/configuration. Offline support covers the proxy shell and saved libraries, not arbitrary website cloning. ([3]; [14])

If same-origin mounting is later mandatory, dedicated handlers must precede generic auth/fallback/injection; worker/dependency responses need deliberate cold-session delivery, MIME and cache rules. The root hub worker must bypass `/proxy` and its namespace before caching, while the narrower proxy SW controls its documents. Never unregister the hub worker or delete its games cache. Protect only owned storage/cache names, keep auth/API exclusions correct and test existing offline games plus account flows. **Path/SW scope is not an origin-level credential boundary**: arbitrary rewritten code still shares the host's real origin, making separate-origin launch preferable even after routing is repaired. ([14]; [16])

## 5. Ship through compatibility gates rather than feature labels

### Real filtering needs normalized rules and engine-level target URLs

Production/master insert ABP-format lines such as `||ad.001zb.com^` into a hostname Set and compare them with a plain hostname; those common rules cannot match as intended. Dev's UV path references missing blacklist JSON and commented middleware. Soap strips domain syntax and adds selector/substring handling but does not implement full uBO grammar and does not await readiness in the examined path. These are source-level findings, not blanket runtime claims that every filter layer fails. ([9]; [10]; [11])

Build one normalized domain-rule representation with explicit supported syntax, hostname/parent matching, exceptions, asynchronous ready state and atomic list replacement. Filter the **logical target URL in engine fetch hooks**, not the proxy host in an outer SW request. Until rules load, show “starting filter” and follow a defined policy; never display Active prematurely. Test plain domains, ABP anchors, exceptions, parent/subdomain boundaries and false positives. Per-site disable and blocked counters need observable events. Optional cosmetics use tested frame lifecycle injection with a limited grammar, not “uBlock Origin built in.” List licenses/update provenance remain separate from engine licenses. ([10]; [11]; [19])

### Tools should improve the demos' useful ideas and memory limits

The request inspector should begin SJ-first, attach to the selected tab, default to metadata only, and offer pause/clear plus bounded capture. Show method, logical URL, status, request-to-response-hook timing, MIME and pre/post rewrite headers/body when available. That timing is not full page, DNS or TLS timing. Add error/cancel finalization, per-body/total byte budgets and explicit truncation. The demo's 200-row default, 50KiB preview threshold and 12,000-character view limit do not bound captured body bytes. Stream tee/text/blob collection can retain long-lived responses; cancel unused branches and revoke object URLs on eviction. ([19]; [20])

Epoxy-inspired Request Builder uses explicit **Send/Cancel**, method, URL, headers and body, then bounded response text/JSON, status and measured bytes/time. Do not auto-send while editing as the showcase does, invent negotiated HTTP version from its fixed label, or declare native CORS failure merely because ACAO is not `*`; credentials, exact origins and preflight matter. Transport Log labels outer Wisp tx/rx frames, hex/text and lifecycle, with a ring buffer and no default persistence. It is not a decrypted HTTPS or target-WebSocket chat inspector. ([22]; [23])

Playground adapts current Scramjet's local HTML/CSS/JS files, projects, preview/fake origin and rewritten view. Explain that fake origin is emulation, not DNS/certificate control, and external resources/non-GET requests can leave the playground. Offer explicit Run, bounded storage and a visible network policy. Read-only syntax highlighting does not prove TypeScript compilation. Full DOM inspection remains an opt-in module requiring target attachment/cleanup proof; copied Chii and commented Eruda are not working integration. ([9]; [19]; [20])

### Privacy controls must name what they actually protect

Initially call the optional mode **“don't save local history”**, excluding persisted visits, restoration and sensitive diagnostics. Do not label it incognito until isolated cookie jars/storage and cleanup are proven: SJ controller frames share an origin-wide persisted jar, and UV owns another DB. Closing a tab, clearing logs, busting cache, changing engine or changing Wisp does not clear all site state. Offer separate clear controls for visits, recovery, bookmarks, preferences/projects, response cache and engine session data, with enumerated affected stores and active tabs. Do not promise precise per-site deletion until implemented. ([7]; [19])

Browser-side TLS protects compatible HTTPS payloads in transit to the destination; the relay still sees connection metadata, HTTP remains different, and shell JS/WASM handles decrypted content. URL encoding/XOR is not encryption. Inspectors can capture credentials and personal content, so exports default to redacted metadata and explicit inclusion choices. No “anonymous,” “no logs,” “all traffic encrypted,” native-history erasure or fresh-account-per-tab claim follows from this architecture. Popup restrictions and tab-title customization are limited controls with compatibility consequences, not browser-equivalent isolation. ([4]; [12]; [19])

### Performance and accessibility need budgets before decoration

Keep the base shell small and load UV, editor, inspector and playground lazily. Do not ship the captured 7.48MB editor-heavy bundle as the ordinary home page. Measure cold startup, first content, peak memory with multiple frames, stream capture, relay restart and mobile sleep; no source supplies a comparative benchmark winner. Default to still backgrounds and limited live frames on mobile; suspension is explicit because it loses page state. Defer shared pre-rewrite target caching until cookie/auth tests pass: the demo plugin is “RFC-9111-ish,” shares cache across frames and omits 304 revalidation. ([19]; [20])

Implement OS reduced-motion suppression explicitly in shell CSS alongside saved motion-off preference; the hub's background respects it but main transition suppression is not fully substantiated. Preserve focus outlines, labeled icon buttons, status announcements without excessive chatter, accessible error summaries, dialog focus restoration and keyboard tab reorder. Check contrast for dim/faint text, zoom, touch targets and blur fallbacks. Visual acceptance requires later rendered comparison against `/hub` under matching preferences; source token equality is necessary but not screenshot parity. ([1]; [2])

### Licensing separates dependencies from a modified application

Modern InvisiProxy, Scramjet and Epoxy transport/client are AGPL-covered in inspected metadata; stock UV and Bare-Mux are MIT, proxy-transports MIT, Wispurr BSD-3-Clause, wisp-js LGPL v3, and Wisp protocol documentation CC BY 4.0. Historical archive MIT does not license modern branches. The x8rr repository contains AGPL v3 text and requests MercuryWorkshop/x8rr attribution; no manifest clarifies its only-versus-later declaration. Custom UV builds, controller/utils, libcurl and bundled assets still need artifact-level provenance/license review. ([4]; [17]; [18]; [27]; [34]; [35]; [36]; [37])

Adapting AGPL application code is different from independently implementing documented behavior. A covered modified network application must prominently offer corresponding source under section 13, with covered-work obligations distinct from independent aggregation; serving compiled browser bundles also involves distribution conditions. Recommend an openly published, reproducible ojjyProxy source release with Source/Credits, notices, modification provenance and build scripts. Do not assert either that dependency use automatically relicenses every independent hub file or that a separate folder avoids obligations. Retain preferred-form source for vendored generated artifacts and associate it with exact releases. ([34])

### Granular milestones provide meaningful acceptance gates

| Milestone | Deliverable | Acceptance gate, all future work |
|---|---|---|
| A — deployment/artifacts | Deno frontend target, permitted relay host, immutable manifests/checksums | Policy boundary recorded; every required asset has expected bytes/MIME; custom UV provenance resolved |
| B — one SJ2 page | SW/control, direct transport, matched controller/core | Clean-profile HTTPS navigation plus redirect/assets/WSS; startup failure classified and retryable |
| C — UV proof | Legacy mux/header bridge and dispatcher | Same controlled fixtures on both engines; ordinary shell requests bypass rewrites; switch uses canonical URL |
| D — blue shell/tabs | Exact tokens, home/browser, independent frame state | Multiple tabs, edit/redirect races, close/reopen and traversal behavior verified; no outer-history substitution |
| E — durable libraries | Bookmark CRUD/import/export, retention, recovery | Roundtrip/migration/quota tests; lazy restore and excluded-history rules hold; deletion scopes stay separate |
| F — filtering/tools | Normalized filters, bounded inspector/builder/log/playground | Early readiness and exception fixtures pass; cancellation/stream budgets hold; captures target intended tab |
| G — responsive/accessibility | Keyboard/mobile/reduced motion, errors/fullscreen | 320px/zoom/focus/labels/touch audits; denied popup/fullscreen cases useful; actual blue render comparison |
| H — hub launch | Card/top-level link, optional safe theme handoff | Hub auth/offline games/cache untouched; no leaked long-lived token; independent-origin behavior explicit |
| I — optional integration | Private bookmark sync, operator routes, inspector module | Account switch/conflicts/deletes tested; actual endpoints provisioned; attachment and cleanup proven |

| Required proxy compatibility checklist | What must be demonstrated |
|---|---|
| Installation/update | Clean and existing profiles; missing/HTML/mismatched assets; SW activation/revival; old tabs across update |
| Navigation | Redirect chains, relative/base URLs, fragments, SPA push/replace/pop, editing races, escaped links/popups |
| HTTP/state | GET/HEAD/POST/upload, redirect method semantics, duplicate/raw headers, cookies/login/logout, storage APIs |
| Content/APIs | Classic/module scripts, CSS imports, images/fonts, downloads, workers/shared workers/worklets, media streams |
| Transport | Destination WSS, TLS rejection, relay auth/egress errors, restart/idle timeout, mobile sleep and cancellation |
| Browsers/isolation | Intended Chromium/Firefox/Safari/mobile matrix; SW/SharedWorker/private-mode storage; actual COOP/COEP |
| Limits/integration | CAPTCHA/DRM/WebRTC results recorded per site; bounded memory; hub pre-existing SW/offline/auth; namespaces |

The checklist is a requirement for implementation, **not a list of tests performed**. Controlled fixtures should isolate header, history, POST and lifecycle behavior before popular-site trials. Record engine/transport/browser/release with each result, including partial success; README supported-site lists and branch names do not establish present compatibility. Broader performance claims require measurements on the same workloads and devices. ([7]; [9]; [19])

## Conclusion

The research changes the build from “choose a proxy template” into **design a stable browser contract around changing engine generations**. The first implementation increment should freeze the alpha.2/0.0.14 release inventory, prove one owned-relay SJ2 navigation on the Deno-served standalone origin, and resolve the exact UV headers artifact before promoting dual-engine support. That sequence makes the visual shell and libraries independent of future transport/controller migrations, while preserving the user's requested union of useful features.

The remaining decisions are specific: live hub deployment generation/URL, acceptance of the frontend-only Deploy use case, relay host/capacity, custom UV artifact reproducibility, UV event bridge, history-boundary signals and any genuine private storage/inspector capability. None requires application implementation in this research deliverable. With those proofs recorded, the next project can implement against this screen/state/route specification and enter compatibility gates; hub integration becomes a familiar launch experience rather than a risky replacement of its existing origin-wide systems.

## Evidence index

### Local research notes used in full

| Note | Evidence carried into this synthesis |
|---|---|
| [engines.md](../research_notes/ojjyProxy%20implementation%20research/engines.md) | Registry versions, archive inventory, builds, assets, API generations and routing |
| [networking.md](../research_notes/ojjyProxy%20implementation%20research/networking.md) | Exact branch commits/locks, transport/backend architecture, licenses and operational limits |
| [deno-hub.md](../research_notes/ojjyProxy%20implementation%20research/deno-hub.md) | Hub routes/auth/KV/cache/MIME, Deploy generations/policy and integration boundaries |
| [hub-theme.md](../research_notes/ojjyProxy%20implementation%20research/hub-theme.md) | Authoritative token/component/cascade details, appearance caveats and screen proposals |
| [demo-ux.md](../research_notes/ojjyProxy%20implementation%20research/demo-ux.md) | Source-wired demo UI, hooks, request/playground limitations and proposed event contracts |
| [feature-inventory.md](../research_notes/ojjyProxy%20implementation%20research/feature-inventory.md) | All InvisiProxy branches, Epoxy source/deployed bundle, placeholders and combined scope |
| [templates.md](../research_notes/ojjyProxy%20implementation%20research/templates.md) | Newly inspected repo/ZIP, alpha.1 pairing, layouts, commands, defects, license and contrasts |

### Numbered external primary sources

| No. | Source and exact evidence location |
|---|---|
| [1] | Hub pinned `public/theme.css`, default line 4 |
| [2] | Hub pinned `public/hub.css`, base line 1 and final navigation lines 90–91 |
| [3] | Hub pinned `server.ts`, accounts, routing and generated pages |
| [4] | InvisiProxy production pinned package manifest |
| [5] | Soap pinned combined worker |
| [6] | Production pinned resolved lockfile, including custom UV |
| [7] | Scramjet pinned main commit/source tree |
| [8] | InvisiProxy master pinned manifest, SJ-only |
| [9] | InvisiProxy master pinned shell/common interactions |
| [10] | Production pinned filter worker |
| [11] | Soap pinned partial filter parser |
| [12] | Soap pinned launch/search/common implementation |
| [13] | Master pinned bookmark placeholder |
| [14] | Hub pinned root offline worker |
| [15] | Current Scramjet pinned controller implementation |
| [16] | Current Scramjet pinned SW implementation; [browser scope rules](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register) |
| [17] | Ultraviolet upstream README/source; [registry](https://registry.npmjs.org/@titaniumnetwork-dev%2fultraviolet/latest) |
| [18] | proxy-transports interface; [deprecated Bare-Mux](https://github.com/MercuryWorkshop/bare-mux) |
| [19] | Scramjet pinned demo BrowserView and related demo files |
| [20] | Scramjet pinned RequestViewer; related Playground/utils files in same tree |
| [21] | Scramjet pinned bootstrap server |
| [22] | Epoxy showcase pinned demo request/response implementation |
| [23] | Epoxy showcase pinned Wisp log wrapper |
| [24] | MDN cross-origin isolation requirements |
| [25] | Deploy Classic socket API |
| [26] | Deploy migration/platform reference |
| [27] | x8rr template commit and root README |
| [28] | x8rr pinned HTML setup README |
| [29] | x8rr pinned HTML wiring |
| [30] | x8rr pinned React component; [setup guide](https://github.com/x8rr/scramjet-templates/blob/ab246887ba1003add1cd3e178d157b79e0f6a7f4/templates/react/2.0.67-alpha.1/README.md) |
| [31] | x8rr pinned bundled controller version assertion |
| [32] | New Deploy runtime/lifecycle; [Classic-specific TLS rule](https://docs.deno.com/deploy/pricing_and_limits/#tls-proxying) |
| [33] | Current Deploy AUP, reverse/forward proxy policy |
| [34] | x8rr AGPL license text, sections 5/6/13 |
| [35] | Wispurr capabilities/license; [master pinned relay policy](https://github.com/InvisiProxy/InvisiProxyLTS/blob/242386f1d01b778a563cafe54567f5b832a6f7cf/src/server/wisp.ts) |
| [36] | Wisp protocol, implementations, multiplexing and documentation license |
| [37] | Epoxy transport manifest/interface/license; [wisp-js license/API](https://github.com/MercuryWorkshop/wisp-js) |
| [38] | Published bootstrap latest metadata |
| [39] | Dev pinned lockfile, legacy comparison artifact set |

The matrix's additional primary commit records are [dev `4482b3c…`](https://github.com/InvisiProxy/InvisiProxyLTS/tree/4482b3cbc3387c2de1209d5bf3832688ca000534), [soap-rewrite `65efd0b…`](https://github.com/InvisiProxy/InvisiProxyLTS/tree/65efd0bff9088c7398c635950d3937fe569aab68), [archive `6e15e96…`](https://github.com/InvisiProxy/InvisiProxyLTS/tree/6e15e9664ccf56e95afd13db24cd6fccd9d4eb7c), [Scramjet-App `f6f83cb…`](https://github.com/MercuryWorkshop/Scramjet-App/tree/f6f83cbc93091e47b9c357eb00ea289828aedf94), [Ultraviolet-App](https://github.com/titaniumnetwork-dev/Ultraviolet-App), [UV-Static](https://github.com/titaniumnetwork-dev/Ultraviolet-Static), [Epoxy live reference](https://epoxy.r58playz.dev/), and [browser.js](https://github.com/HeyPuter/browser.js). Registry split is preserved through [Scramjet latest](https://registry.npmjs.org/@mercuryworkshop%2fscramjet/latest), [exact alpha.2](https://registry.npmjs.org/@mercuryworkshop%2fscramjet/2.0.67-alpha.2), and [controller metadata](https://registry.npmjs.org/@mercuryworkshop%2fscramjet-controller/latest). Local archive identities and named members are documented in the notes, including the [new original ZIP](file:///Users/tinlaplee/Downloads/scramjet-templates-main.zip); an archive filename alone is not a verified upstream release.

[1]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/theme.css#L4
[2]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/hub.css
[3]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts
[4]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/eac37e3ea3f61406e6b2eaad79eef4feb38c476d/package.json
[5]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/ea4b86287b209c78d0c4e8138994b63a19e7a1bb/views/sw.js
[6]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/eac37e3ea3f61406e6b2eaad79eef4feb38c476d/pnpm-lock.yaml
[7]: https://github.com/MercuryWorkshop/scramjet/tree/b14b709ac190b786dd03becbd0728ab72bdd3ad6
[8]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/242386f1d01b778a563cafe54567f5b832a6f7cf/package.json
[9]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/242386f1d01b778a563cafe54567f5b832a6f7cf/views/assets/js/common.js
[10]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/eac37e3ea3f61406e6b2eaad79eef4feb38c476d/views/sw-blacklist.js
[11]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/ea4b86287b209c78d0c4e8138994b63a19e7a1bb/views/assets/js/ubo-middleware.js
[12]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/ea4b86287b209c78d0c4e8138994b63a19e7a1bb/views/assets/js/common-1778310233.js
[13]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/242386f1d01b778a563cafe54567f5b832a6f7cf/src/client/components/Bookmarks.tsx
[14]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/sw.js
[15]: https://github.com/MercuryWorkshop/scramjet/blob/b14b709ac190b786dd03becbd0728ab72bdd3ad6/packages/controller/src/index.ts
[16]: https://github.com/MercuryWorkshop/scramjet/blob/b14b709ac190b786dd03becbd0728ab72bdd3ad6/packages/controller/src/sw.ts
[17]: https://github.com/titaniumnetwork-dev/ultraviolet
[18]: https://github.com/MercuryWorkshop/proxy-transports
[19]: https://github.com/MercuryWorkshop/scramjet/blob/b14b709ac190b786dd03becbd0728ab72bdd3ad6/packages/demo/src/pages/BrowserView.tsx
[20]: https://github.com/MercuryWorkshop/scramjet/blob/b14b709ac190b786dd03becbd0728ab72bdd3ad6/packages/demo/src/pages/RequestViewer.tsx
[21]: https://github.com/MercuryWorkshop/scramjet/blob/b14b709ac190b786dd03becbd0728ab72bdd3ad6/packages/bootstrap/src/server.ts
[22]: https://github.com/MercuryWorkshop/epoxy-tls/blob/0c11678d72a636c3a4bc723db87e03e7b888eaf9/client-showcase/src/demo.tsx
[23]: https://github.com/MercuryWorkshop/epoxy-tls/blob/0c11678d72a636c3a4bc723db87e03e7b888eaf9/client-showcase/src/loggingws.ts
[24]: https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated
[25]: https://docs.deno.com/deploy/classic/api/runtime-sockets/
[26]: https://docs.deno.com/deploy/migration_guide/
[27]: https://github.com/x8rr/scramjet-templates/commit/ab246887ba1003add1cd3e178d157b79e0f6a7f4
[28]: https://github.com/x8rr/scramjet-templates/blob/ab246887ba1003add1cd3e178d157b79e0f6a7f4/templates/html/2.0.67-alpha.1/README.md
[29]: https://github.com/x8rr/scramjet-templates/blob/ab246887ba1003add1cd3e178d157b79e0f6a7f4/templates/html/2.0.67-alpha.1/index.html
[30]: https://github.com/x8rr/scramjet-templates/blob/ab246887ba1003add1cd3e178d157b79e0f6a7f4/templates/react/2.0.67-alpha.1/src/App.tsx
[31]: https://github.com/x8rr/scramjet-templates/blob/ab246887ba1003add1cd3e178d157b79e0f6a7f4/templates/html/2.0.67-alpha.1/controller/controller.api.js
[32]: https://docs.deno.com/deploy/reference/runtime/
[33]: https://docs.deno.com/deploy/acceptable_use_policy/
[34]: https://github.com/x8rr/scramjet-templates/blob/ab246887ba1003add1cd3e178d157b79e0f6a7f4/LICENSE
[35]: https://github.com/sylvieisnton/wispurr/blob/main/README.md
[36]: https://github.com/MercuryWorkshop/wisp-protocol/blob/main/README.md
[37]: https://github.com/MercuryWorkshop/Epoxy-Transport/blob/master/package.json
[38]: https://registry.npmjs.org/@mercuryworkshop%2fproxy-bootstrap/latest
[39]: https://github.com/InvisiProxy/InvisiProxyLTS/blob/4482b3cbc3387c2de1209d5bf3832688ca000534/package-lock.json
