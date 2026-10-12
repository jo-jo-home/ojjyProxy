# Build ojjyProxy Around Five Isolated Engines

**Build ojjyProxy as a standalone, hub-blue browser defaulting to Scramjet stable 1.1.0, with all three requested alphas and UV 3.2.10 separately selectable.** Proxy2 is the primary integration source; screenshots supply floating address/Go, segmented PillBar, and sectioned-modal composition. Current source includes five runtimes, owned Node Wisp, local libraries, and bounded diagnostics. Local server, unit and Chromium checks establish specific behavior, not universal compatibility or deployment. The public repository is **[jo-jo-home/ojjyProxy](https://github.com/jo-jo-home/ojjyProxy)**. Deployment uses one outer origin, five runtime origins, and external owned WSS. One Deno application can serve all six web origins; five additional runtime apps are optional. Deploy prohibits forward proxies, and acceptance of the frontend-only use remains unresolved. ([Proxy2](file:///Users/tinlaplee/Downloads/Proxy2/README.md); [pins](../package.json); [routing](../server.ts); [domains](https://docs.deno.com/deploy/reference/domains/); [AUP](https://docs.deno.com/deploy/acceptable_use_policy/))

**Evidence cutoff: October 12, 2026, during concurrent implementation.** Built means implemented; verified means the specified check passed; designed/future mean specifications with acceptance gates. Test results are coordinator-reported, not rerun here. The earlier `reports/ojjyProxy implementation research.md` remains unchanged; its defaults, combined-worker/hub topology, relay/transport/artifact choices, and affected licensing conclusions are **explicitly superseded** below. Source descriptions reflect inspection, not a released commit.

### Phase 1 delivery update

The working foundation now passes **3 Deno server tests, 6 Node tests and 8 Chromium checks** using default Epoxy. The browser checks cover all five releases through the owned local Wisp server, including rewritten JavaScript, dynamic fetch, server/client cookies, links, canonical address updates, back navigation and hostname filtering. Two additional checks within that eight load an external HTTPS destination with stable 1.1.0 and alpha67. Libcurl fixtures were also verified on the four supporting adapters; alpha0 remains built-in Epoxy. The alpha67 adapter normalizes request header pairs into the old transport's object form and uses the core's URL decoder to exclude internal navigation metadata. Its Libcurl path waits for the embedded WASM readiness event before constructing a session.

The responsive refinements in `public/layout.css` keep modal header/footer actions visible, reserve actual docked-control space, set mobile navigation hit areas to 44px and mobile text fields to 16px. These supersede earlier geometry values described in the implementation-cutoff sections below. Generated filtering/error responses now include the isolation headers required by the embedded runtimes. The extensive final vision remains broader than Phase 1; the authoritative delivery sequence and completion checks are in **[ROADMAP.md](../ROADMAP.md)**. Production Deno, public relay hosting and DNS have not been provisioned.

## 1. Five exact releases replace the earlier two-engine recommendation

### The final product has one identity and several compatibility paths

The finished browser by Jonas Lee combines one navy workspace, local tabs/libraries, and deliberate release switching. Its exact choices appear below; stable is the required default, not universal compatibility proof. Every selection binds its own assets/adapter. Failed alphas remain diagnosable; no hidden stable/UV substitution may retain their label. ([Registry, lines 1–7](../public/shared.js); [version audit](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md))

**ojjyProxy owns its website and relay; hub mounting is superseded.** The hub supplies appearance/patterns and an optional link, not required login, worker, accounts, or network routing. `server.ts` serves the website; independent `relay/server.mjs` forwards streams. The public repository has been created; public relay addresses, DNS and Deno deployment still require configuration. ([Frontend](../server.ts); [relay](../relay/server.mjs); [earlier hub constraints](../research_notes/ojjyProxy%20implementation%20research/deno-hub.md))

### Source priority determines which conflicts are resolved

User instructions outrank research recommendations. Proxy2's actual version-specific files outrank generic tutorials and earlier engine recommendations. The new notes establish provenance, isolation, and screenshot composition; the original notes supply feature attribution and background. Current application source establishes built status; official Deno documentation establishes contemporary deployment configuration and policy. Screenshot badges do not establish transport performance. ([New integration note](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md); [new design note](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md); [earlier synthesis](ojjyProxy%20implementation%20research.md))

| Earlier recommendation or assumption | Updated binding decision |
|---|---|
| Default to alpha67/controller 0.0.14 | **Default to stable 1.1.0**, retaining alpha67 as one of five choices. |
| Build primarily around two adapters | Build five release-specific runtime branches behind one shell contract. |
| Combine engines in one root or `/proxy/` worker | Give each release its own origin and `/runtime/` worker ownership. |
| Eventually mount into the hub | Deliver an independent website from the user's own repository. |
| Prefer Wispurr as the first backend | Current owned backend is **wisp-js 0.4.1**; alternatives require separate operational proof. |
| Adopt production's Epoxy3/custom UV headers stack | Use the root's reviewed **Epoxy 2.1.28, libcurl 1.5.2, stock UV 3.2.10** generation. |
| Treat browser notices as uncomplicated MIT metadata | Preserve actual license text and documented metadata conflicts. |
| Treat all source-union features as an immediately finished browser | Distinguish current handlers, verified fixture behavior, final design, and conceptual phases. |

**Proxy2 supplies four minimal integration examples**, each assuming its own root, with no settings or cloaking UI. The unidentified screenshot application's controls cannot be attributed to it. The final union therefore needs an original shell around its integration contracts. ([Proxy2 README, lines 3–7 and 46–56](file:///Users/tinlaplee/Downloads/Proxy2/README.md); [screenshot attribution limits, lines 74–78](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md))

### The full version matrix prevents incompatible bootstrap combinations

| Release and immutable ID | Exact engine assets and API | Network contract | State and implementation consequence |
|---|---|---|---|
| **Stable 1.1.0**, `sj-1.1.0` | `scramjet.all.js`, `scramjet.wasm.wasm`, `scramjet.sync.js`; `$scramjetLoadController()` and `$scramjetLoadWorker()`; frame `.go()` | BareMux **2.1.9** with Epoxy transport **2.1.28**, embedding Epoxy-TLS **2.1.18-1**; current adapter also exposes matching libcurl module selection | Await `controller.init()` before requests. Stock config/cookies use `$scramjet` IndexedDB. Stable is the default runtime. |
| **2.0.0-alpha**, `sj-2.0.0-alpha` | Same filename family and factory/frame shape, but different engine bytes | **Built-in Epoxy-TLS 2.1.18-1** receives `wisp` through controller config; no BareMux in this path | Shares stock `$scramjet` database names with stable, requiring origin separation. Cross-origin ancestor probes need documented guarding. |
| **2.0.2-alpha**, `sj-2.0.2-alpha` | `scramjet_bundled.js` includes rewriter WASM; `$scramjet.ScramjetClient`, `ScramjetFetchHandler`, `ScramjetHeaders`, `CookieJar`; no supplied controller class | Hand-assembled `ProxyTransport` shim over BareMux **2.1.9**, with Epoxy **2.1.28** or matching libcurl | New context/bootstrap injection, cookie persistence/broadcast synchronization, and worker injection glue are required. It must not load alpha67 controller injection. |
| **2.0.67-alpha.2**, `sj-2.0.67-alpha.2` | `scramjet.js`, `scramjet.wasm`, controller API/inject/SW **0.0.14**; `new Controller()`, `.wait()`, `.createFrame().go()` | Direct UMD Epoxy **2.1.28**, `EpxMod.default`, or libcurl **1.5.2**, `CurlMod.default`; header conversion at adapter boundary | Live page controller owns routing/RPC. `__scramjet_controller` persistence and fixed broadcasts are origin-wide. Generated controller/frame routes are temporary. |
| **UV 3.2.10**, `uv-3.2.10` | `uv.bundle.js`, `uv.client.js`, `uv.handler.js`, `uv.sw.js`, generated `uv.config.js`, runtime wrapper SW; matching XOR codec | UV BareClient through separately initialized BareMux and pinned transport modules | Not supplied by Proxy2. Independently pinned stock package supplies legacy choice; cookie DB is `__op`. |

Root npm aliases preserve concurrent exact versions; controller 0.0.14 asserts alpha67. Wrapper and embedded versions differ: libcurl 1.5.2 embeds libcurl.js 0.7.4. Implemented contracts are in adapter lines 93–130 and worker lines 4–15. ([Stable example, lines 38–71](file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/index.html); [alpha0, lines 41–66](file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.0-alpha/index.html); [alpha2 SW](file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/sw.js); [alpha67](file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.67-alpha.2/index.html); [root pins](../package.json))

The audit byte-matched inspected Proxy2 distribution members against exact npm tarballs. This establishes artifact equivalence, not authenticated signatures, reproducible preferred-form source builds, or site compatibility. The current build copies pinned distributions, collects available notices, patches four alpha0 ancestor probes, and fingerprints assets. Its manifest identifies adapted bytes; alpha0 is no longer an untouched upstream artifact. ([Provenance audit, lines 44–92](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md); [build source](../scripts/build.mjs); [asset manifest](../public/asset-manifest.json))

### Useful features retain their real attribution

| Source family | Useful contribution and evidence | Current or final ojjyProxy treatment |
|---|---|---|
| **Proxy2** | Exact four-generation bootstrap, worker, transport, search normalization, frame navigation | Primary foundation for five isolated adapters; UV added independently. |
| **Three screenshots** | Address/Go above wider segmented pill; large sectioned modal; appearance and option families | Layout inspiration translated into hub blue; screenshot switch states are not product defaults. |
| **Hub `91be48d…`** | Exact navy tokens, centered navigation, cards, stars, local preferences, sorting and keyboard patterns | Blue identity and launchpad/library vocabulary; no inherited proxy SSO or URL-history API. |
| **InvisiProxy production `eac37e3…`** | Dual-engine integration, URL watching, search/provider hooks, escaped-link/cache concepts | Multi-engine lessons, not its newer transport/custom UV stack. |
| **Master `242386f…`** | Improved settings, data-driven sites/icons, FAQ and mirror states; Scramjet only | Settings/catalogue/help patterns; no assumption it contains UV or real bookmarks. |
| **Dev `4482b3c…`** | Stable/UV legacy dependency generation and BareMux integration | Compatibility reference; Rammerhead session IDs do not become Scramjet profiles. |
| **Soap `ea4b862…`** | Custom endpoint Apply/Reset, target-bearing new-window launches, partial filter normalization/cosmetics | Endpoint UX and supported-window concepts; complete filter grammar and wrappers remain future. |
| **Soap-rewrite `65efd0b…`** | Early dual-engine dispatcher and domain filtering | Routing precedent; superseded by per-origin ownership. |
| **Archive `6e15e96…`** | Historical chooser, appearance utilities, independent desktop experiments | Optional conceptual inspiration; obsolete proxy hosts and game bundles are not shipped dependencies. |
| **Scramjet demos/capture** | URL watchers, Requests details, Playground, flags and cache controls | Future adapter-specific inspector/playground design; current log is much narrower. |
| **Official SJ/UV apps** | Small launchers, asset/config order, repair affordances | Shared parser/startup/error lessons; not a ready tabbed browser. |
| **Epoxy showcase `0c11678…`** | Request composer, response view, outer Wisp logging, local settings | Future Tools workspace with explicit Send and bounded capture. |
| **x8rr templates `ab24688…`** | Minimal alpha.1/0.0.13 direct-transport initialization and actual inject asset | Lifecycle reference only; exact pair differs and toolbar buttons are unwired. |
| **browser.js** | README describes a configurable browser-in-browser | No feature attribution beyond inspected evidence; no inferred bookmarks, profiles, or failover. |

InvisiProxy bookmarks are placeholders; outer-history buttons are not independent tab history; copied Chii/commented Eruda code is not a working inspector; its history-status tactic does not delete browser records. Current tabs, libraries, import/export, and local autocomplete are new application work. ([Feature inventory](../research_notes/ojjyProxy%20implementation%20research/feature-inventory.md); [demo UX](../research_notes/ojjyProxy%20implementation%20research/demo-ux.md); [template findings](../research_notes/ojjyProxy%20implementation%20research/templates.md))

## 2. Hub blue gives the screenshot composition a coherent final interface

### Exact identity is inherited; browser geometry is deliberately extended

Use **the hub's default navy-blue identity** with Segoe UI/system typography, thin outlines, restrained shadows, rounded cards, pills, and a lightweight home title. Screenshots contribute the narrower address capsule above wider segmented navigation and the sectioned modal. Destination pages retain their own styling. ([Exact hub palette](https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/theme.css#L4); [screenshot observations](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md); [current CSS](../public/style.css))

| Token or recipe | Exact hub value | Final-project use and current distinction |
|---|---|---|
| `--bg`, `--bg2`, `--bg3` | `#0a1628`, `#111d2e`, `#162a42` | Canvas, panels, selected/hover controls; core values already present. |
| `--border`, `--accent` | `#1e3a5f`, `#2e6bbd` | Thin boundaries, selection, focus and progress. |
| `--text`, `--text2` | `#e2e8f0`, `#c8d6e5` | Headings, values and essential explanatory copy. |
| `--dim`, `--faint` | `#64748b`, `#475569` | Nonessential/decorative roles; current CSS instead adds `--muted:#90a3b9`. |
| `--star` | `#f0c040` | Bookmark emphasis. |
| `--ok`, `--warn` | `#4ade80`, `#e0a355` | Ready/partial status with text; current success alias is not the complete semantic set. |
| `--danger`, `--danger-bg`, `--danger-bd` | `#e05555`, `#2a1a1a`, `#4a2020` | Error/destructive actions with readable explanations. |
| `--overlay` | `rgba(10,22,40,.55)` | Optional image scrim, **not** ordinary modal backdrop. |
| Ordinary modal scrim | Navy **88%**, backdrop blur **10px** | Final target; current dialog uses `#0a1628d9` and 8px blur. |
| `--onaccent`, `--spark`, `--ring` | `#0a0a0a`, `#ffffff`, text at 22% mix | Retain original roles; do not assume suitable small-text or general-focus contrast. |
| Font and title | Segoe UI/system stack; `2.4rem`, weight 300, `.05em` tracking | Current home follows this title identity. |
| Home cards/search | 16px cards; 220px minimum grid; 1.2rem gap; 999px search pill | Current home extends container to 940px and search to 560px rather than exact hub 900/400px. |

Exact tokens do not require using every inherited foreground combination. The design note calculates text on `--bg2` at about 13.75:1 and secondary text at 11.47:1, but dim at 3.56:1 and faint at 2.24:1. Pale text on filled accent is about 4.31:1, and the inherited dark on-accent foreground is about 3.73:1. These are calculated solid-color ratios, not rendered measurements. Essential small copy should use the pale text system; outline/navy action buttons and a pale additional focus edge preserve brand colors while improving operational clarity. Current white-on-accent controls and focus rings need assessment on their actual composited backgrounds. The final goal is source-token fidelity with accessible role choices, not a declaration that every inherited pairing already conforms. ([Contrast calculations, line 195](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md); [WCAG contrast explanation](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html))

### Home is a launchpad rather than a marketing obstacle

The home/new-tab view should make browsing immediately available. Its hierarchy is title, short subtitle, centered wrapping actions, omnibox, selected-release summary, and useful saved-site cards. The current shell has bookmarks, history, customize, connection log, an engine-change link, starter Wikipedia/DuckDuckGo/GitHub bookmarks, editable shortcuts, and author credit. These are shortcuts, not tested-site promises. A monogram avoids issuing remote favicon requests solely to decorate home. “Saved on this browser” accurately describes the present identity model; an account badge would not. A Games Hub link is secondary. The current link opens the hub's GitHub repository because a live hub address has not been established. ([Home markup, lines 16–27](../public/index.html); [starter data and shortcuts, lines 9–13 and 154–173](../public/app.js))

```text
DESKTOP HOME — final hierarchy, existing shell vocabulary
┌──────────────────────────────────────────────────────────────────┐
│ [new tab ×] [site A ×] [site B ×] [+]                  [settings] │
│                         ojjyProxy                                │
│                familiar light title on deep navy                 │
│ [game hub] [bookmarks] [local visits] [settings] [connection]      │
│              ( URL or search........................ ) [Go]     │
│       Scramjet stable (1.1.0) · Epoxy · relay not checked         │
│         [favourites] [recent] [a–z]   [filter saved sites]         │
│        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│        │ monogram ★  │ │ monogram ☆  │ │ + shortcut  │            │
│        │ site title  │ │ site title  │ │ add/edit    │            │
│        │ domain      │ │ domain      │ │             │            │
│        └─────────────┘ └─────────────┘ └─────────────┘            │
│            made by Jonas Lee · saved on this browser              │
└──────────────────────────────────────────────────────────────────┘
```

The sketch is a final information hierarchy, not a rendered screenshot. The dedicated saved-site filter is designed but not present on home; current filtering exists inside the library dialog. Current “recent” sorting uses bookmark `added` timestamps, not most recent launch time. That should either be labeled recently added or gain a distinct `lastOpenedAt` field. Empty home must show an add action rather than invented visits. If configuration is incomplete, retain all local functions and display the existing setup banner; do not advertise the relay as connected merely because the Deno page loaded. A first-run explanation should identify the owned endpoint and five-origin requirement in ordinary language. ([Sorting, lines 154–159](../public/app.js); [configuration banner, lines 334–345](../public/app.js))

### Desktop preserves the six screenshot navigation actions

Final desktop browsing defaults to **PillBar**. A proposed address capsule is approximately 480px wide and 56px high, centered 16–18px below the content workspace's top edge, with a flexible field and Go. A roughly 600px-wide, 52px-high pill sits about 10px below it. Its six screenshot actions remain in the exact order **Home, Back, Forward, Reload, Settings, Collapse**. Place bookmark access adjacent to the address field or in a secondary action rather than changing the requested six-part hierarchy. The current source has the correct floating composition but **seven segments**, inserting Bookmark between Reload and Settings; it is a useful built feature and a deliberate final-layout refinement remains. ([Screenshot toolbar observation, lines 39–40](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md); [current browser markup, line 29](../public/index.html); [current bar geometry, CSS line 5](../public/style.css))

```text
DESKTOP BROWSING — desired screenshot-specific composition
┌──────────────────── destination workspace ───────────────────────┐
│              ╭──────────────────────────────────╮                │
│              │ [canonical URL..............] Go │ [★]            │
│              ╰──────────────────────────────────╯                │
│        ╭────────┬──────┬─────────┬────────┬─────────┬────────╮     │
│        │ Home   │ Back │ Forward │ Reload │ Settings│Collapse│     │
│        ╰────────┴──────┴─────────┴────────┴─────────┴────────╯     │
│                                                                  │
│          destination website retains its own responsive UI        │
│                                                                  │
│ [Scramjet 1.1.0 · Epoxy · loading / observed page load]            │
└──────────────────────────────────────────────────────────────────┘
Collapsed:                     [Show controls ⌄]
Docked alternative: controls reserve space above destination content.
```

Empty space around floating controls should pass input to the destination. Collapse leaves Show controls; Docked Bar reserves space; Fullscreen is separately wired with denial feedback. Runtime Back/Forward do not use outer history, but precise boundary disabling remains unverified. ([Shell commands, lines 284–295](../public/app.js); [runtime traversal](../public/runtime/adapter.js))

### Mobile prioritizes reachability rather than scaled-down desktop chrome

Mobile should initially use a top dock with address/Go and a second row containing the same six actions. With 16px gutters at 320px width, six 48px segments fit 288px of usable space. Controls should have **at least 44px intended hit areas**, inputs at least 16px text, and wrapping release labels. The current CSS switches to mobile geometry at 700px, rather than the design note's proposed 600px, and current navigation height is 38px. Those are built values, not completed accessibility acceptance. The final refinement should increase reachable targets, handle long labels, and test short landscape heights and software keyboards without reducing the website to a tiny sliver. ([Responsive design targets, lines 263–275](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md); [current responsive CSS, line 8](../public/style.css))

```text
MOBILE BROWSER                        MOBILE SETTINGS
┌───────────────────────────────┐    ┌──── Settings ─────── [×] ┐
│ [site A] [site B] [+]          │    │ Customization             │
│ [URL or search.........] [Go] │    │ Search [DuckDuckGo     ▾] │
│ Home│Back│Fwd│Reload│Set│Hide  │    │ Engine & version          │
├───────────────────────────────┤    │ [stable (1.1.0)        ▾] │
│                               │    │ full release labels       │
│ destination mobile page       │    │ Bar [Docked            ▾] │
│                               │    │ Theme [Hub blue        ▾] │
│                               │    │ appearance / owned relay  │
│                               │    │ options, one row each     │
│ [state / retry when relevant] │    │ data controls             │
└───────────────────────────────┘    │ ↓ scrollable body         │
                                     ├───────────────────────────┤
                                     │ local status [Close][Save]│
                                     └───────────────────────────┘
```

A mobile modal needs persistent header/footer, one scrolling body, dynamic viewport sizing, safe areas, and keyboard-visible fields. Full release labels and text-zoom reflow outrank rigid columns. Native `<dialog>` is built; focus cycling/return, screen-reader output, and background-frame inertness remain acceptance checks. Layout breakpoints never establish browser capability.

### Settings exposes real choices and labels future capabilities honestly

Final desktop modal width is up to 1000px with 24px gutters/padding, 16px radius, navy surfaces, readable separators, and 24–32px group spacing. Keep header/footer reachable and labels at 14–16px. Current sections and **explicit Save settings** already exist; immediate autosave was only proposed. ([Markup, lines 31–38](../public/index.html); [handlers, lines 232–260](../public/app.js); [geometry specification](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md))

```text
DESKTOP SETTINGS — sectioned modal; future wrapper shown unavailable
┌──────────────────────── Settings ─────────────────────── [×] ┐
│ Customization                                                │
│ Search [DDG ▾]  Engine/version [stable 1.1.0 ▾]  Bar [Pill ▾]│
│ Theme [Hub blue ▾]       Effective transport: Epoxy           │
│ ──────────────────────────────────────────────────────────── │
│ Tab appearance         [title........] [icon URL...........] │
│ ──────────────────────────────────────────────────────────── │
│ Owned relay [wss://owned-host/wisp/................] [Test]  │
│ Transport [Epoxy ▾]     Wrapper: future / unavailable         │
│ ──────────────────────────────────────────────────────────── │
│ More options: two-column labeled rows; truthful scope/help    │
│ Domain filtering [plain hostnames..........................] │
│ Cache/data [active cache] [history] [export] [import]          │
│ ↓ body scroll                                               │
├──────────────────────────────────────────────────────────────┤
│ Saved locally / pending runtime change       [Close] [Save]  │
└──────────────────────────────────────────────────────────────┘
```

| Settings group | Built behavior | Final refinement or future boundary |
|---|---|---|
| Customization | Five release choices, five search providers, Pill/Docked, local theme presets, transport selection | Show running release separately from default; actual transport and support per release. |
| Owned relay | Endpoint field and explicit WebSocket test | Draft versus active endpoint, scope-of-change explanation, last real destination outcome. |
| Tab appearance | Title/icon saved with settings; HTTP(S) icon validation | Screenshot-style independent Apply/Reset and presets are designed additions. |
| More options | History, local autocomplete, restore, performance, notifications, supported-window capture preferences | Explain real scope; notification checkbox currently lacks suppression logic. |
| Domain filter | Plain hostname list including subdomains | No AdGuard/uBO parser or cosmetic-layer claim. |
| Cache & data | Active-runtime cache deletion, history clear, JSON export and bookmark import | Separate runtime site-data reset, saved-session clear, and precise cache/reload semantics. |
| Launch wrapper | No current None/Blank/Blob implementation | Future explicit action with popup and isolation acceptance gates. |
| Tor routing | No provisioned route or current UI implementation | Future backend-advertised capability with real egress proof. |

Replace screenshot “Protocol” with **Engine & version**. Transport, endpoint, bar style, and wrapper remain separate. Stable initially uses Epoxy; alpha0 always uses embedded Epoxy. A capability-aware transport selector should show the effective library without unconditional speed/browser claims. Current fifth search provider is Yahoo, not earlier-proposed Startpage. ([Providers](../public/shared.js); [transport branches](../public/runtime/adapter.js))

### Libraries, connection tools, and failures complete the screen map

Bookmarks should remain a focused manager with filter, count, open/edit/remove, favorite state, and a small add/edit form. Current records contain ID, name, canonical URL, favorite, and added time; folders, tags, preferred release, and browser-bookmark HTML import are future enhancements. JSON export includes settings and bookmarks. Import is limited to files below 1 MiB, processes up to 1,000 incoming bookmarks, validates HTTP(S), deduplicates by URL, and deliberately imports bookmarks without applying connection settings. That distinction prevents an imported file from silently rerouting traffic. A future import preview should show duplicate/invalid counts and explicitly select merge versus replacement. ([Bookmark CRUD, lines 175–193 and 212–229](../public/app.js); [data portability, lines 300–317](../public/app.js))

Visits use readable rows with title, URL, time, filtering, individual removal, and separate clear-all. Current retention is the latest **500 records**, not the earlier report's 30-day/2,000-visit proposal. Grouping by day, date-range deletion, and engine badges in the row are final refinements. Connection currently consists of the owned endpoint settings/test and an in-memory **120-event shell log**, not a website request inspector. About explains the standalone project, engine credits, local persistence, appearance limits, source link, and asset manifest. Failure uses a calm blue card preserving the destination, with Retry, Choose another engine, and Home. A structured details pane and finer error-stage taxonomy are designed improvements. ([Visits/log limits, lines 14 and 27–30](../public/app.js); [library rendering, lines 194–231](../public/app.js); [current error screen, line 29](../public/index.html))

## 3. Canonical URLs and runtime ownership keep browser behavior truthful

### The outer tab owns a destination; its runtime owns the engine

The present topology uses two iframe levels. Each outer app tab owns a runtime iframe on the release's origin; that runtime page owns the inner proxied website iframe and its applicable controller or custom glue. The outer shell loads no engine core. Alpha67's controller stays in its runtime owner because its worker routes back to live controller/frame references. Removing that owner while expecting the inner page to remain operational breaks the model. Active and inactive loaded tabs currently keep their runtime frames; restored tabs create frames only when selected. Closing removes the owned runtime iframe and timeout state. This is tab lifecycle management, not serialized recovery of an entire browser session. ([Outer runtime lifecycle, lines 47–115](../public/app.js); [runtime owner markup](../public/runtime/index.html); [controller/frame assembly](../public/runtime/adapter.js))

The built tab limit is **20**. New, select, close, background-frame hiding, and lazy restore exist. Duplicate, pin, reorder, reopen-last-closed, tab search, and explicit suspension are future ergonomic work. A duplicate should copy URL and release preference, not pretend to copy JavaScript heap, forms, sockets, or native history. Suspension should disclose that it unloads the page. The current Home command clears the tab's URL and destroys its runtime; it does not preserve a hidden site for instant return. A future Home-with-return design must explicitly retain that session rather than describe the current behavior inaccurately. ([Tab manager, lines 47–87](../public/app.js); [Home handler, line 290](../public/app.js); [restore logic, lines 347–349](../public/app.js))

Canonical addresses are the common currency across all releases. Store `https://destination.example/path?query=value#fragment`, not `/runtime/network/…`, UV XOR, alpha67 controller IDs, or MessagePorts. The current shell stores `tab.url`, updates title/URL from runtime messages, and avoids overwriting an active address edit. Alpha67 now uses **`$scramjet.unrewriteUrl(actual, frame.context)`** for its generated route rather than generic `decodeURIComponent`, preserving engine-specific metadata and query/hash semantics. Stable/alpha0 can expose `frame.url`; UV uses its matching decoder. The adapter still has fallback route decoding/polling for other cases, so exhaustive redirect/SPA/fragment coverage remains a future compatibility gate. ([Canonical extraction, lines 65–87](../public/runtime/adapter.js); [outer URL updates, lines 136–146](../public/app.js); [codec evidence, lines 335–353](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md))

### Distinct origins solve collisions that worker scopes cannot

Different runtime pages solve global overwrite problems, and `/runtime/` scopes organize worker control, but neither creates a storage partition on one origin. Stable and alpha0 both use `$scramjet`, database version 1, the config store/key, and cookie/redirect/referrer/public-suffix stores. Alpha67 uses `__scramjet_controller` plus a fixed cookie BroadcastChannel. BareMux uses origin-wide discovery keys/channels and one selected transport per SharedWorker. Site storage emulation namespaces logical destinations, not the rewriting release or user profile. Separate runtime origins let identical vendor names coexist without rewriting every embedded storage and discovery implementation. ([Collision matrix, lines 131–150](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md); [IndexedDB origin model](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API); [worker scope semantics](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register))

| Collision surface on one origin | Why separate paths are insufficient | Current architectural resolution |
|---|---|---|
| Old Scramjet IndexedDB | Config/cookies and helper stores use fixed database names | Stable and alpha0 have distinct origins. |
| BareMux discovery | `bare-mux-path`, `bare-mux` channel, generic port discovery, worker transport mutation | Stable, alpha2, and UV discover transport within their own origins. |
| Alpha67 cookie persistence | Fixed database/channel across controllers; random route IDs are not profile IDs | Alpha67 has a distinct origin; same-release tabs intentionally share its pool. |
| Cross-realm singleton discovery | Cores can search accessible parent/top/opener/frames | Cross-origin outer/runtime boundaries reduce unwanted accessible sibling reuse. |
| Website localStorage/IDB/caches/OPFS | Logical target prefixes lack release/profile identity | Version origin separates pools; complete native-equivalent site isolation is not established. |
| Shell bookmarks/preferences | App data should not be vendor cookies or target storage | Stored on outer application origin. |

Multiple tabs using the same release currently share its runtime origin and therefore cookies, website storage, filtering state, and some transport/configuration behavior. **Per-tab engine selection is built; per-tab relay independence and fresh account containers are not established.** A global endpoint/transport preference can affect a shared BareMux worker when another runtime initializes. Current settings save says runtime changes apply when a tab is reopened, but existing streams need not migrate and shared configuration can affect subsequent requests sooner. The final UX should treat connection changes as release/profile-pool changes, explain affected tabs, and deliberately reinitialize them when required. Do not imply that a runtime query parameter creates a private transport pool. ([BareMux singleton interpretation, lines 152–163](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md); [current runtime parameters, lines 104–108](../public/app.js); [settings save, line 252](../public/app.js))

A future profile needs a real boundary. The preferred scheme assigns five additional origins per profile, such as `sj110-work.runtime.proxy.example`, while outer records include a profile ID. A wildcard domain assigned to the application makes routing administratively possible but does not automatically create profile support. The runtime registry, parent bridge, ownership model, cookie cleanup, and storage lifecycle must be extended together. A same-origin alternative requires source-level namespacing of every engine database, embedded/external BareMux discovery path, alpha67 cookie channel, logical site storage, cache/OPFS hooks, and cross-realm singleton discovery. Adding a `profileId` field or unused `dbName` configuration does not isolate stock vendor state. ([Profile and strict-single-origin specifications, lines 203–230](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md))

### Startup, navigation, transport, and request success are separate states

Runtime startup validates parent/token, secure context, service workers, release assets, awaited old-controller initialization, and matching-worker control. Alpha67 awaits transport and controller with rejecting timeouts; outer startup is bounded to 30 seconds. BareMux acknowledgement and alpha2 shim `ready:true` still do not measure destination connectivity. ([Adapter startup](../public/runtime/adapter.js); [outer timeout](../public/app.js); [reference startup audit](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md))

| State domain | Built observations | Final state contract |
|---|---|---|
| Runtime | Starting, ready, error; correct-worker wait; alpha67 transport/controller waits | Asset loading → worker registration/control → config/controller initialization → ready, with unsupported/failed exits. |
| Connection | Configured endpoint; WebSocket-open probe; real request fixture evidence | Configured, reachable, negotiated/initialized where exposed, last destination result; no invented DNS/TLS reason. |
| Navigation | Loading command, iframe load, URL reports, startup/error messages | Requested versus committed destination; navigating, initialized, observed load, partial/stalled/failed. |
| Editing | Address-focus guard prevents event overwrites | Independent input draft; never replace typing with late redirect or stale-generation events. |
| Recovery | Local metadata snapshots and lazy runtime construction | Versioned canonical snapshots; no form/socket/history-heap recovery claim. |

`frame.go()` submits navigation rather than awaiting site success. Current `loaded` comes from inner iframe `load`, including possible error documents; 750ms polling reports addresses. Worker exceptions return plain-text 502 without complete structured shell error reporting. Final diagnostics need top-level hooks, remote-error distinctions, and a stalled/Wait state rather than invented completion. ([Load reporting](../public/runtime/adapter.js); [worker errors](../public/runtime/sw.js); [demo state distinctions](../research_notes/ojjyProxy%20implementation%20research/demo-ux.md))

The bridge verifies exact origin, source iframe/parent, random token, and source label. Extend it with schema/release identity, runtime generation, and navigation sequence to reject stale events. Dedicated MessagePorts are optional future work; controller RPC remains inside the runtime owner. ([Outer validation, lines 124–128](../public/app.js); [runtime validation, lines 136–138](../public/runtime/adapter.js); [postMessage semantics](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage))

### One parser serves all engines; navigation remains native to the frame

The current parser trims input, rejects empty values, restricts explicit schemes to HTTP(S), rejects URL credentials, normalizes recognized bare hosts/ports to HTTPS, and otherwise builds an encoded query. It deliberately improves Proxy2's permissive parser, whose empty input navigates to example.com and whose explicit-scheme branch accepts `javascript:` and `data:`. The source-defined providers are **DuckDuckGo, Google, Bing, Brave, and Yahoo**, with DuckDuckGo default. Search selection affects query destinations, not engine initialization. Internationalized domains, unusual IP/port forms, dotted search terms, and malformed explicit URLs deserve focused edge-case acceptance rather than a blanket “complete URL parser” claim. ([Parser and providers, lines 8–30](../public/shared.js); [reference parser findings, lines 302–321](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md))

Autocomplete currently matches bookmarks and saved visits locally, deduplicates by URL, and shows up to five matches on the home field after two characters. It makes no provider suggestion request. The screenshot's “Search suggestions” family is therefore represented by a useful local-first implementation, not the older remote-provider behavior. Full combobox/listbox semantics, arrow-key active selection, composition handling, and address-field suggestions are final refinements. Remote suggestions are a later explicit opt-in that must disclose transmission of partial input and use cancellation/request ordering; Startpage's old Bing suggestion mapping must not be silently inherited if Startpage is added. ([Local matching, lines 319–325](../public/app.js); [background provider conflicts](../research_notes/ojjyProxy%20implementation%20research/feature-inventory.md))

Back/Forward use the selected engine frame methods or the inner iframe's native history. The fixture verifies ordinary forward navigation followed by Back; it does not establish every native history boundary, POST resubmission, or SPA transition. Application visits are a ledger, not a replacement navigation stack. Reload acts on the running frame; release switching reconstructs a fresh runtime from canonical URL and can lose forms, scripts, and site sessions. The current explicit switch button does this without cookie migration. Final acceptance must prevent automatic replay of POST/uploads or uncertain non-idempotent activity. No automatic fallback is currently built; manual choice is the appropriate initial policy. ([Traversal/switch handlers](../public/runtime/adapter.js); [active-release switch, lines 254–260](../public/app.js); [browser fixture navigation, lines 63–67](../tests/browser/proxy.spec.mjs))

### Local history is narrower than privacy or session isolation

Current settings default **history, restore, and autocomplete to true**. History-off stops new visit recording but does not erase earlier visits, stop tab snapshots, remove existing visit suggestions, clear shell URL logs, or delete engine cookies. Restore is independent. The final UI must say “Save local history: visits in this app only,” and explain those remaining records. If offering a stronger “don't retain browsing destinations” mode, explicitly disable URL-bearing recovery and recent suggestions, clear/omit appropriate diagnostics, and provide separate deletion of earlier data. That stronger mode is designed work, not the effect of the present checkbox. ([Defaults and persistence, lines 3–21](../public/app.js); [recording condition, lines 141–143](../public/app.js); [current option copy, line 35](../public/index.html))

The outer store is currently a **single localStorage JSON record named `ojjyproxy-app-v1`**, not the IndexedDB database proposed in earlier notes. It contains settings, bookmarks, visits, and optional tab snapshots. Corrupt JSON falls back to defaults, and failed writes show a notice. Schema migration, fine-grained stores, quota-resilient writes, and durable import preview are future strengthening work. “Local” means browser-origin storage, not encrypted-at-rest or inaccessible to app code. Export intentionally contains settings/bookmarks but not visits or live engine cookies. Private profiles, account sync, or an incognito label require different evidence than local persistence. ([Storage implementation, lines 3–22](../public/app.js); [export structure, lines 300–302](../public/app.js))

## 4. An owned relay and six web origins define the deployment

### The data path separates website serving from socket forwarding

Deno serves shell/configuration and role-specific owner, adapter, worker, and assets. Browser engines rewrite virtual routes and send work through their own transport to **owned Wisp**, whose Node process opens destination sockets. Deno stays outside that forwarding path; one endpoint does not imply one shared socket/pool. ([Server routes](../server.ts); [runtime](../public/runtime/adapter.js); [relay](../relay/server.mjs))

```text
Planned public GitHub repository: jo-jo-home/ojjyProxy
                    │ user connects repository to hosting
                    ▼
             Deno website application
       ┌────────────┴───────────────────────────────────┐
       │ outer origin: blue shell / local libraries      │
       │ five runtime origins: pinned assets/config/SW   │
       └─────────────────────────────────────────────────┘
                    │ browser receives code/assets
                    ▼
Outer tab → release runtime owner → inner proxied document
                    │ engine rewriting and transport
                    ▼
       direct wss://relay.proxy.example/wisp/   PLACEHOLDER
                    │ externally hosted owned Node relay
                    ▼
             destination TCP socket → website
```

For compatible HTTPS, Epoxy/libcurl can perform destination TLS in browser WASM while Wisp carries socket bytes. WSS protects browser-to-relay transport, but **HTTP destinations remain plaintext at the destination leg**. The relay sees destination host/port and connection timing/volume; its network and DNS behavior expose operational metadata. Shell and runtime JavaScript process decrypted content locally, so hosting/source integrity remains part of the trust boundary. URL encoding/XOR is not encryption. An owned endpoint improves control and removes a silent third-party default; it does not establish anonymity, no logging, Tor use, or uniform end-to-end protection for every protocol. ([Epoxy architecture](https://github.com/MercuryWorkshop/epoxy-tls); [Wisp protocol](https://github.com/MercuryWorkshop/wisp-protocol/blob/main/protocol.md); [privacy analysis](../research_notes/ojjyProxy%20implementation%20research/demo-ux.md))

### npm installation supplies the relay in examples and the whole pin set here

**Yes: `npm install` inside each original Proxy2 example fetches wisp-js.** The four example manifests declare `@mercuryworkshop/wisp-js:^0.4.1`, and their inspected locks resolve 0.4.1. Their browser engine/transport bundles are already vendored; that install does not rebuild them. The original per-folder sequence is install then `npm start`, with stable/alpha0/alpha2/alpha67 on ports 8100/8200/8300/8400. Those commands explain the reference, not the unified site's deployment pipeline. Preserve the Downloads originals as evidence rather than treating them as a remote server dependency. ([Example manifest, lines 5–10](file:///Users/tinlaplee/Downloads/Proxy2/scramjet-1.1.0/package.json); [original commands, lines 32–42](file:///Users/tinlaplee/Downloads/Proxy2/README.md); [all-four lock audit, line 46](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md))

For the current application, the root `package.json` pins Wisp exactly 0.4.1 alongside all four engine aliases, controller, UV, BareMux, Epoxy, and libcurl. Use **Node 22 or newer**, as the root declares, and Deno for serving. After initial lock creation, use `npm ci` to reproduce the reviewed lock rather than an update-first script. `npm run build` copies/fingerprints the distributions and applies the alpha0 adaptation; `npm run dev` starts the outer server at localhost:8000, five runtime servers at 8100–8500, and owned local relay at 9000. `npm run check` performs Deno checking and Node tests. Browser tests are a separate command. ([Root scripts and engine requirement](../package.json); [build script](../scripts/build.mjs); [local process orchestration, lines 14–18](../scripts/dev.mjs))

```sh
# Run from the ojjyProxy repository root; these are user instructions.
npm ci
npm run build
npm run check
npm run dev
# Open http://localhost:8000 using the same hostname consistently.
```

The local runtime origins differ by **port**, which is a real origin boundary. Do not mix localhost and 127.0.0.1 casually: parent-origin configuration is exact and mismatches reject runtime startup. Browser fixtures use controlled loopback destinations with local-only test mode; production relay behavior disables that allowance. The local command sequence does not prove public HTTPS/certificate behavior or provision external services. If only serving already built assets, `deno task start` is sufficient for the frontend process, while the relay still needs its own process and installed Node dependency. Shell configuration is read from environment, not loaded automatically from `.env.example` by the server. ([Local origins, server lines 25–34](../server.ts); [exact parent check, adapter line 90](../public/runtime/adapter.js); [relay test-mode restriction, lines 34–35](../relay/server.mjs))

### One Deno application can route five runtime origins

The recommended public topology uses **six HTTPS web origins total**: one outer shell and five runtimes. These can be six custom domains assigned to one Deno application, or an outer domain plus a wildcard runtime domain attached to that application. Official current documentation explicitly allows assigning an entire wildcard to one app or distributing subdomains across apps. Runtime independence is a browser-origin property, not a requirement for independent Deno processes or repositories. The relay uses a seventh service hostname on its external host. Every name below is a **placeholder**, not provisioned DNS or an asserted live address. ([Current domain assignment documentation](https://docs.deno.com/deploy/reference/domains/))

| Role | Illustrative origin or endpoint | Required configuration |
|---|---|---|
| Outer shell | `https://proxy.example` | `PUBLIC_APP_ORIGIN` exactly this origin. |
| Stable | `https://sj110.runtime.proxy.example` | Registry key `sj-1.1.0`. |
| Alpha0 | `https://sj200.runtime.proxy.example` | Registry key `sj-2.0.0-alpha`. |
| Alpha2 | `https://sj202.runtime.proxy.example` | Registry key `sj-2.0.2-alpha`. |
| Alpha67 | `https://sj2067a2.runtime.proxy.example` | Registry key `sj-2.0.67-alpha.2`. |
| UV | `https://uv3210.runtime.proxy.example` | Registry key `uv-3.2.10`. |
| Owned relay | `wss://relay.proxy.example/wisp/` | `WISP_URL`, external Node/Wisp service. |

```dotenv
# PLACEHOLDERS ONLY. Replace every hostname with owned, attached domains.
PUBLIC_APP_ORIGIN=https://proxy.example
WISP_URL=wss://relay.proxy.example/wisp/
RUNTIME_ORIGINS={"sj-1.1.0":"https://sj110.runtime.proxy.example","sj-2.0.0-alpha":"https://sj200.runtime.proxy.example","sj-2.0.2-alpha":"https://sj202.runtime.proxy.example","sj-2.0.67-alpha.2":"https://sj2067a2.runtime.proxy.example","uv-3.2.10":"https://uv3210.runtime.proxy.example"}
```

`server.ts` parses this JSON, checks recognized IDs and HTTPS origin-only values, rejects duplicated origins, normalizes origin strings, and finds the runtime role by **exact `url.origin` equality**. It does not infer a release from arbitrary subdomain text. All five entries should be supplied for the final product; partial registry values produce missing-runtime setup/error states. Leave `RUNTIME_ENGINE` unset for this single-application topology. The outer origin is explicit because a runtime cannot safely infer the shell's public host from its own request. Requests to `/runtime/config.js` on a configured runtime generate that role's config. Vendor URLs under `/runtime/vendor/` map to the relevant release folder or shared pinned transport folder. ([Origin validation, lines 12–23](../server.ts); [role/config/vendor routing, lines 49–74](../server.ts))

The alternative uses one outer Deno app plus **five additional apps**, all deploying the same repository/revision, each runtime app setting one `RUNTIME_ENGINE` ID. The outer registry points to their actual HTTPS domains, and each runtime gets the same explicit `PUBLIC_APP_ORIGIN` and owned `WISP_URL`. This is useful without a multi-domain setup or for separate rollout administration. It increases configuration and revision-synchronization work. Distinct app deployments must not accidentally ship mismatched assets. A default Deno production domain can serve each app, but generated names belong to the user's organization and must be copied from the dashboard rather than guessed. ([Role override, server line 49](../server.ts); [Deno default/custom domain model](https://docs.deno.com/deploy/reference/domains/))

### Correct asset shipping makes the GitHub deployment simple

The required new-Deploy configuration is **`deploy.runtime`**, not legacy `deploy.entrypoint`. The current `deno.json` has been corrected to that schema, retaining local tasks and the following dynamic-runtime block. Because `public/vendor`, notices, manifest, shell, and runtime files are shipped with the repository, **no hosting install or build command is needed by default**. Deno executes `server.ts`, which imports only local application code and reads public assets. Root npm packages serve local build/relay work, not a mandatory deployment-time browser bundle rebuild. ([Current deno.json](../deno.json); [official build configuration](https://docs.deno.com/deploy/reference/builds/); [server dependencies, lines 1–3](../server.ts))

```jsonc
// Correct NEW Deno Deploy source configuration: preserve other local keys.
{
  "deploy": {
    "runtime": {
      "type": "dynamic",
      "entrypoint": "server.ts"
    }
  }
}
```

Source deploy settings take precedence over dashboard app configuration; the application directory is still selected in the dashboard. Choose repository root as that directory and the dynamic Deno entrypoint, not static SPA mode, because role/config/vendor routing is dynamic. Missing JS/WASM must return genuine errors rather than `index.html`. Current server includes JavaScript/module/WASM MIME mappings, no-store responses, no-referrer, nosniff, COOP same-origin, COEP require-corp, cross-origin CORP, and cross-origin-isolated permission delegation. These headers are source-configured; deployed nested contexts must still be tested for real isolation. The initial no-store policy favors correctness over caching optimization. Immutable release caching is later work. ([Server MIME/headers, lines 4–9 and 36–42](../server.ts); [Deno source/dashboard precedence](https://docs.deno.com/deploy/reference/builds/))

### The user's deployment proceeds through concrete stages

**Step 1 — use the public source release.** The repository is **https://github.com/jo-jo-home/ojjyProxy**. Its intended release includes source, lockfile, `deno.json`, `server.ts`, `public/`, relay/build/test instructions, notices, and this report. Generated browser assets let remote hosting run without the user's Downloads tree. Node modules, test artifacts, local environment files and secrets are excluded by the ignore rules. The deployment block uses the current dynamic-runtime schema, and the artifact inventory records exact package generations and adaptation hashes. ([Ignore file](../.gitignore); [build outputs](../scripts/build.mjs))

**Step 2 — provision the owned relay separately.** Select a host supporting the intended forward-proxy TCP egress and long-lived WebSockets, deploy the Node relay using the checked-in Dockerfile or a supervised Node process, and assign the owned relay hostname. The present Dockerfile uses Node 24 Alpine, installs the root locked production dependencies, runs as the node user, and listens at port 9000. Because it uses the root manifest, it installs more packages than only Wisp; relay-specific packaging can be optimized later without changing the reviewed version. Bind the backend privately behind the TLS reverse proxy, and expose the WSS hostname. ([Relay Dockerfile](../relay/Dockerfile); [relay lifecycle](../relay/server.mjs))

**Step 3 — configure relay origins and TLS.** Set production `ALLOWED_ORIGINS` to the actual outer and five runtime HTTPS origins, comma-separated. Current upgrade handling accepts exactly `/wisp` or `/wisp/` and rejects unlisted browser origins. Use the trailing-slash endpoint in client configuration. The checked-in Caddy example forwards to localhost:9000; replace its illustrative hostname and provision certificates/DNS on the chosen host. Caddy is a practical current configuration example, not evidence of a publicly exercised reverse proxy. An Origin allowlist controls browser use but is not authentication against arbitrary non-browser clients that can send their own headers. Stronger access controls are a later operational capability. ([Upgrade validation, lines 20–25](../relay/server.mjs); [production origin requirement, lines 29–37](../relay/server.mjs); [Caddy example](../relay/Caddyfile.example))

**Step 4 — connect GitHub to the new Deno application.** In the user's Deno organization, create the app from the intended repository/default branch, select the root directory, and use the corrected source deploy runtime. Leave install/build/predeploy commands absent for committed assets. Confirm the deployed revision's logs and `/health`; that endpoint proves process availability, not working Wisp forwarding or all engine roles. Deno builds are triggered by linked GitHub commits, manual UI deployment, or CLI; this project needs no additional GitHub Actions workflow simply to use that connection. ([Official build triggers/stages](https://docs.deno.com/deploy/reference/builds/); [health route, server line 54](../server.ts))

**Step 5 — attach outer and runtime domains.** Add domains in the organization, apply the DNS records actually supplied by the dashboard, verify ownership, provision TLS, and assign the six origins to the app. A wildcard covering runtime subdomains can be attached wholly to the same app. Do not hardcode documentation-example A/CNAME targets into project instructions. Cloudflare's `_acme-challenge` CNAME must remain DNS-only as the official page specifies. Distinct hosts must continue serving their own role, not redirect all runtime domains to the outer host. ([Official DNS/TLS/domain assignment sequence](https://docs.deno.com/deploy/reference/domains/))

**Step 6 — set production environment and activate configuration.** Supply actual `PUBLIC_APP_ORIGIN`, `WISP_URL`, and five-entry `RUNTIME_ORIGINS` on the frontend deployment; supply actual allowed origins on the relay host. No public third-party endpoint default is present. Production requests without configured Wisp/runtime origins should show setup needed, not select a borrowed Mercury/Anura relay. Environment values exposed through `/api/config` are public connection configuration, not a place for secrets. Preview timelines need deliberate compatible origin values; an arbitrary preview shell host will not match production `PUBLIC_APP_ORIGIN`. ([Environment example](../.env.example); [generated public config, server lines 29–34 and 51–57](../server.ts); [runtime exact-parent validation](../public/runtime/adapter.js))

**Step 7 — verify the actual deployment before announcing it.** Open the outer origin in a fresh browser profile, confirm stable default and all labels, inspect runtime role/config/asset MIME, test the WSS probe, then navigate controlled and live HTTPS destinations through each release. Exercise version switches, multiple origins concurrently, saved libraries, mobile, worker revival, and relay restart. Record actual domains, serving revision, browser versions, and partial results. Until these steps are completed, the deliverable is deployment-ready source plus local proofs, not a live Deno service. Rollback should restore a coherent known-good asset/source set, not replace only one core or worker while retaining mismatched controller code.

### Hosting policy remains a factual unresolved boundary

The current Deno Deploy AUP explicitly lists **forward proxy and VPN as unacceptable**, and reverse proxy as acceptable. Wisp forwarding client-selected destination sockets belongs on the external permitted host. Moving it behind a Deno WebSocket tunnel would put Deno back into that forwarding path. The frontend-only app is technically distinct, but the policy does not provide a confirmed approval or explicit exception for this exact broader application. Therefore the GitHub/Deno instructions describe the requested technical setup without claiming provider acceptance. If that frontend use is unsuitable for Deploy, retain the same Deno server on a host permitting the use case; Deno technology does not require Deno's managed hosting service. ([AUP, directly rechecked](https://docs.deno.com/deploy/acceptable_use_policy/))

## 5. Verified foundations and explicit gates govern the complete feature union

### Adapter repairs explain why the five fixtures now work

Stable and alpha0 now await `controller.init()` rather than racing IndexedDB configuration writes against navigation. Matching-worker control is verified before creating/using frames. Alpha0's built artifact guards **four dotted-symbol membership probes** against inaccessible parent/top/opener objects; the build helper catches cross-origin access instead of letting nested initialization fail. This is a narrowly recorded adaptation to the pinned release, not a claim of untouched upstream runtime. The current manifest fingerprints the resulting file, and the original Proxy2 package remains the comparison input. ([Awaited init, adapter lines 93–101](../public/runtime/adapter.js); [guard build, lines 41–53](../scripts/build.mjs); [adaptation inventory](../public/asset-manifest.json))

Alpha2 required real new glue. The original injected client existed, but the supplied script list omitted its required `PROXY_CONFIG`; its initialization latch was set before success, cookie jars were disconnected, and worker injection returned empty text. Current `alpha2-shared.js` injects config, BareMux, bundled core, bootstrap cookie snapshot, shared glue, and client glue in order. The worker stores cookie state in `ojjy-alpha2-state`, loads it before handling network work, persists updates, and broadcasts snapshots through `ojjy-alpha2-cookies`. The client loads the bootstrap snapshot, applies changes locally, and broadcasts writes back. Its ready latch is set after successful hooking. `getWorkerInjectScripts` now emits a bootstrap sequence rather than an empty string. ([Original alpha2 client, lines 10–17 and 85–121](file:///Users/tinlaplee/Downloads/Proxy2/scramjet-2.0.2-alpha/client.js); [shared injection, lines 25–30](../public/runtime/alpha2-shared.js); [cookie worker](../public/runtime/alpha2-worker.js); [cookie client](../public/runtime/alpha2-client.js))

Those changes repair source-supported bootstrap/state gaps and passed the reported basic cookie/dynamic-fetch fixture. They do not establish correct concurrent cookie-write ordering, worker restart recovery, all module/shared worker contexts, or nested complex applications. The custom SW still deserves request metadata/referrer/raw-client, blob/data, POST stream, repeated-cookie, and long-lived-worker acceptance. An in-memory jar plus persistence/broadcast code is meaningful progress, but only lifetime tests establish reliable resumed sessions. Do not describe the added worker-script hook as fully verified worker support. Its exact export generation remains alpha2; loading alpha67 controller injection would be an incompatible shortcut. ([Original gap analysis, lines 279–293](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md); [current alpha2 request assembly, lines 31–44](../public/runtime/alpha2-worker.js))

Alpha67's direct adapter now converts incoming raw header pairs to the older Epoxy/libcurl header-object contract for `request` and `connect`, then flattens response objects/array-valued properties back to raw pairs. This fixes the missing input-side adaptation rather than only normalizing responses. It also uses core `unrewriteUrl` for canonical addresses. The coordinator reports the expanded alpha67 fixture just passed after these fixes. However, `Object.fromEntries` collapses repeated input names, so comprehensive duplicate request-header fidelity remains a known test requirement. Response flattening preserves array-valued repeated Set-Cookie in its Node check; that is not the same as every browser/transport duplicate-header case. ([Alpha67 adapter, lines 69–70 and 113–120](../public/runtime/adapter.js); [header helper, lines 31–36](../public/shared.js); [header unit check, lines 23–25](../tests/shared.test.mjs))

The owned Wisp relay intentionally disables **wisp-js 0.4.1's buggy per-host limiter**, whose iteration expects an iterable stream collection but encounters an object. The working per-connection total limit remains **512**. Report this as a concrete version-specific workaround, not “unlimited relay” or verified per-host protection. Production disables private/loopback destinations; local fixture mode selectively allows them and refuses production/non-loopback use. The source contains no Tor daemon, region pool, or public relay credentials. ([Relay options and restrictions, lines 6–11 and 34–35](../relay/server.mjs))

### Current verification is narrow, useful, and explicitly bounded

| Exact known check after Phase 1 verification | Result | What it does not prove |
|---|---|---|
| `deno check server.ts` and three Deno server tests | Passed; server roles, headers, MIME, path handling and origin normalization checked | DNS, platform acceptance, every deployment runtime path. |
| Six Node tests | Passed; URL/endpoint/header contracts and relay origins checked | Browser rewriting or all target networking behavior. |
| Headless Chromium controlled fixture, all five releases | Passed HTML, rewritten JavaScript, dynamic fetch, client/server cookies, links, URL updates, Back and filtering through owned Wisp | Popular-site login, Safari/Firefox, full web API compatibility. |
| Responsive interface check | Passed bookmark persistence, full selector and mobile modal reachability | Full accessibility audit or real-device browser coverage. |
| External HTTPS destination, stable and alpha67 | Passed through owned local Wisp; two checks within the eight default browser tests | Public relay WSS certificate, Deno deployment, all HTTPS destinations. |
| Libcurl transport fixtures | Passed on stable, alpha2, alpha67 and UV; alpha0 retains built-in Epoxy | All transport/browser combinations or long sessions. |

The fixtures exercise HTTP HTML, server/client cookies, dynamic JSON fetch, `/next`, canonical shell URL, Back and domain filtering through owned Wisp. Loopback allowance is confined to local test mode. External destination TLS was additionally exercised with stable and alpha67. The owned relay's public WSS certificate/lifetime, authenticated sites, DRM/WebRTC and simultaneous long-running engines remain unverified. These narrow passes are not blanket website-support claims. ([Browser fixture](../tests/browser/proxy.spec.mjs); [shared checks](../tests/shared.test.mjs); [relay check](../tests/relay.test.mjs))

### Built feature names do not imply the entire future feature union

Current frontend features are detailed in the screen/state sections. The connection-error notification preference is consulted by the runtime-error handler; ordinary action-confirmation toasts remain visible. Theme restoration still happens after configuration fetch rather than before paint. Native dialogs/ARIA labels and height-aware layouts are built without a completed accessibility audit. ([Frontend](../public/app.js); [controls](../public/index.html); [layout refinements](../public/layout.css))

Popup capture handles accepted canonical HTTP(S) clicks on `a[target="_blank"]`; internal routes are excluded. Script windows, forms, nested launches, popup workers, and all escaped routes remain unverified. Final policy needs per-release launch hooks and sign-in/payment compatibility. ([Capture, lines 9–23](../public/runtime/adapter.js); [shell handler](../public/app.js))

Domain filtering currently validates plain hostnames and blocks exact hosts/subdomains before engine routing. Rules persist in `ojjy-runtime-policy` and load before fetch routing. This avoids the earlier InvisiProxy plain-Set-versus-ABP-list mismatch. But current target decoding is manual, including an alpha67 route-segment shortcut, and not all client-direct transport calls necessarily traverse the worker predicate. Therefore the truthful claim is **domain filtering for supported runtime-routed requests**, not complete AdGuard coverage or all network interception. Final hardening should decode through release-specific helpers and prove dynamic-fetch/WebSocket coverage where claimed. Cosmetic CSS rules, exceptions, list updating, counters, and full filter grammar remain future work. ([Validation, app lines 247–249](../public/app.js); [worker policy/routing, lines 18–58](../public/runtime/sw.js); [older filter defect evidence](../research_notes/ojjyProxy%20implementation%20research/feature-inventory.md))

Cache clearing deletes CacheStorage entries on the active runtime origin. It leaves the outer libraries and IndexedDB cookie state, but it is **origin-wide CacheStorage deletion**, not precise per-site or only-shell-cache invalidation. It also does not automatically reload in the current handler. Do not describe it as the screenshot's fully implemented “Clear cache & reload.” Final data controls should distinguish shell assets, response caches, visits, recovery snapshots, bookmarks, preferences, cookie jars, and site storage, with scope and affected tabs displayed. Avoid claiming the action preserves every possible website offline cache or game save merely because the outer bookmark store survives. ([Current clear action, adapter lines 152–154](../public/runtime/adapter.js); [shell notification, app line 147](../public/app.js); [settings action copy, HTML line 37](../public/index.html))

### Conceptual future phases have concrete completion criteria

| Future module | Useful source-derived design | Required phase-completion evidence |
|---|---|---|
| **Request Builder** | Epoxy split request/response view; explicit Send/Cancel, URL/method/headers/body | Correct method/header/body tests, bounded response reads, cancellation behavior, request-order handling; no auto-send while typing. |
| **Website request inspector** | Scramjet request/preresponse/response hooks, logical URLs and pre/post rewrite details | Attach to intended tab/release, pause/clear/detach, error finalization, metadata redaction, body byte budgets, streaming/eviction cleanup. |
| **Outer Wisp frame viewer** | Epoxy tx/rx hex/text logging | Bounded ring buffer, pause, reconnect generations, byte accounting; clearly distinguished from decrypted HTTPS and destination WebSocket inspection. |
| **Playground** | Local HTML/CSS/JS files, fake-origin preview, rewritten output | Explicit Run, bounded project persistence, resource/method network policy, origin explanation, iframe cleanup; no implied TypeScript compiler. |
| **Blank/Blob wrapper** | Screenshot choices and InvisiProxy launch pattern | User-gesture launch, blocked-window recovery, COOP/COEP/nested-runtime compatibility, cleanup/revocation, no privacy guarantee. |
| **Tor/region routing** | Backend-configured routes inspired by older controls | Real daemon/route provisioned, compatible transport or relay routing, health and observed egress proof, unavailable state. |
| **Profiles/private sessions** | Five origins per profile or complete source namespaces | Cookie/site-store/channel/transport separation tests, lifecycle reset and retention semantics; no label-only isolation. |
| **Account sync** | Hub-style queued durability for private bookmark/preference schema | Actual authentication/API, account-switch isolation, conflicts/tombstones/retry, deletion/export behavior; visits sync separately opt-in. |
| **Cosmetic/full-list filtering** | Soap's network/cosmetic concept with normalized lists | Supported grammar, readiness, exceptions, current-site disable, lifecycle injection and format fixtures across releases. |
| **DOM inspector/userscripts** | Optional opt-in modules rather than dormant Chii/Eruda assets | Target attachment, explicit permissions/match rules, cleanup, local pinning and release-specific compatibility. |

The Tools expansion must improve source demos' memory behavior. The captured Scramjet UI bundles a large editor-heavy application and its request viewer's row cap does not limit body bytes; a 50KiB display threshold and 12,000-character preview are not capture budgets. Future inspector defaults should be metadata-only, with proposed per-body and total byte limits, cancellable stream previews, redacted sensitive headers, and revoked object URLs on eviction. Request timing must identify the measured hook interval, not invent DNS/TLS/full-page timing. CORS explanation must account for exact origins, credentials, and preflight rather than asserting failure whenever ACAO is not `*`. ([Request viewer limits](../research_notes/ojjyProxy%20implementation%20research/demo-ux.md); [Epoxy transfer lessons](../research_notes/ojjyProxy%20implementation%20research/feature-inventory.md))

Current Wisp has no SOCKS/Tor route; `localhost:9050` does not provision one. Even a tested future route cannot guarantee anonymity or geographic bypass. Blank/Blob wrappers change launch context, not network metadata or native-history retention.

### Licensing is an artifact inventory, not a blanket MIT claim

| Component | Exact evidence and conflict | Distribution implication |
|---|---|---|
| Scramjet **1.1.0** | npm/source metadata says MIT; exact package LICENSE and supplied source LICENSE contain **AGPL v3 text** | Confirmed conflict; preserve text and metadata, resolve upstream terms; no clean-MIT claim. |
| Scramjet **2.0.0-alpha** | npm metadata MIT; exact tarball LICENSE contains AGPL v3 text | Same explicit conflict, including adapted artifact/source revision. |
| Scramjet **2.0.2-alpha** | Metadata MIT; inspected exact tarball lacks LICENSE/NOTICE member | Text/provenance gap; do not infer terms from another release. |
| Alpha67 / controller **0.0.14** | Metadata AGPL-3.0-only; inspected packages omit full license-named members | Preserve declarations and assemble license/corresponding-source packaging. |
| BareMux **2.1.9** | Exact LICENSE is MIT, copyright 2024 Mercury Workshop Inc.; registry field absent | Retain actual permission/copyright notice. |
| Epoxy transport **2.1.28** | Metadata AGPL-3.0-only; full wrapper license text missing in inspected tarball | Collect wrapper and embedded Epoxy-TLS notices/source. |
| Libcurl transport **1.5.2** | AGPL wrapper text; embedded libcurl.js LGPL v3 plus curl/mbedTLS/cJSON/zlib/brotli/nghttp2 notices | Preserve layered notices, not one flattened license label. |
| Wisp **0.4.1** | Installed exact package contains AGPL v3 text and AGPL metadata | Supersedes earlier report's upstream-README LGPL characterization for this pinned artifact. |
| Stock UV **3.2.10** | Source/npm metadata identifies MIT, but the installed exact npm package's LICENSE contains AGPL v3 text | Preserve both the package license text and metadata conflict; do not treat the inspected source ZIP as proof of the npm artifact's license text. Not the custom headers artifact. |
| Proxy2 handwritten glue | No example application license field/root license inventoried | Vendor license cannot be assigned automatically to extracted glue. |
| Modern InvisiProxy / x8rr | Modern AGPL declarations/text; x8rr requests attribution | Reused covered code needs applicable notices/source; historical archive MIT does not cover modern branches. |

The newer audit's exact-package findings take precedence over older generic upstream license summaries. Current root manifest declares **AGPL-3.0-only**, and the build copies available license files plus Wisp's text into root `LICENSE`; this does not resolve missing notices, source availability, or contradictory upstream metadata. Current JSON notices and asset manifest echo package metadata, including MIT for stable/alpha0, so those machine-readable fields must not be presented as a completed legal audit. The public release should preserve exact artifacts, their actual notices, modification records, source/build provenance, and a prominent source link. Merely publishing compiled JS/WASM and a shell repository is not proof that all corresponding preferred-form source has been assembled. ([Exact license audit, lines 94–109](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/proxy2-versions.md); [notice generation, build lines 25–31 and 54–55](../scripts/build.mjs); [current metadata manifest](../public/asset-manifest.json))

AGPL distinguishes covered modifications from independent aggregation; neither dependency presence nor folder separation settles every file's obligations. Preserve component-specific source/notices and genuine upstream attribution, including future editor/filter assets. ([AGPL sections 5/6/13](https://www.gnu.org/licenses/agpl-3.0.html); [template findings](../research_notes/ojjyProxy%20implementation%20research/templates.md))

### Milestones test behavior rather than decorative feature names

| Milestone | Scope and present position | Acceptance gate |
|---|---|---|
| **A — reproducible distribution** | Root pins/build/manifest exist | Clean locked build, four alpha0 guards, complete expected MIME/assets/notices, corrected deploy schema, adaptation identity. |
| **B — five-engine foundation** | Known controlled HTML/JS/cookie/fetch/navigation proofs | Whole regression on final revision; deliberate query/hash/redirect/header fixtures, concurrent origin pools, startup failures. |
| **C — public standalone hosting** | No deployment or DNS provisioned | Actual repository/revision, six role-correct HTTPS origins, owned WSS, provider suitability, live HTTPS and TLS rejection checks. |
| **D — everyday local browser** | Tabs/bookmarks/500 visits/restore/import largely built | Independent tabs, edit races, retention, lazy restore, quota/corruption behavior, import/export and separate deletion scopes. |
| **E — exact blue screenshot UX** | Core palette/composition built with documented differences | Six-segment final PillBar, accessible modal/mobile targets, actual hub-token comparison, focus/reduced-motion/zoom acceptance. |
| **F — filtering and diagnostics** | Plain-domain rules and 120-event log built | Decoder/route coverage, dynamic-path boundaries, policy mutation scope, bounded logs; future tools meet independent budgets. |
| **G — advanced feature union** | Conceptual modules above | Worker/socket/inspector/playground/wrapper/profile/sync/Tor gates passed individually before feature promotion. |

Compatibility testing should begin with controlled fixtures that separate HTML/CSS/classic/module JS, relative/base URLs, redirects, fragments, push/replace/pop history, repeated headers, cookies, POST/uploads, download responses, streaming, dedicated/shared workers, worklets, and destination WebSockets. Then exercise intended real sites and record engine/transport/browser/version, route, and partial failures. Target-site service workers/PWA behavior is separate from the proxy's own worker; UV explicitly removes the destination serviceWorker interface in inspected source. DRM, WebRTC, QUIC/HTTP3, CAPTCHA, and permission APIs need case-specific results, not blanket support language. Firefox/Safari/mobile are required future compatibility work, not inferred from screenshot badges or one Chromium run. ([Engine limits](../research_notes/ojjyProxy%20implementation%20research/demo-ux.md); [UV worker source](https://github.com/titaniumnetwork-dev/Ultraviolet/blob/main/src/uv.handler.js))

Accessibility acceptance covers keyboard-only home/library use, correctly named icon actions, native-select release selection, Tab/Shift+Tab dialog cycles, Escape layering, focus return, screen-reader status/error output, and destination-frame inertness while a modal is open. Check 320/375/600/768/1024px widths, short landscape, 200% text zoom, software keyboard, long URLs/release labels, safe areas, and actual contrast. Current reduced-motion CSS suppresses animation/transition and performance mode reduces effects; these must not change engine correctness. Tab roles alone do not prove a complete roving-focus keyboard model. Browser-reserved Ctrl/Meta shortcuts must not be advertised as reliably interceptable; shell `/` and Alt+T behavior is the current scoped implementation. ([Keyboard/current motion source](../public/app.js); [CSS reduced motion, lines 7–8](../public/style.css); [design accessibility contract](../research_notes/ojjyProxy%20multiversion%20project%20blueprint/screenshot-design.md))

Measure cold startup, first content, repeat navigation, live/hidden-tab memory, data growth, worker/relay restart, and mobile sleep on named devices. Twenty tabs bounds count, not memory. Lazy restore helps startup; live background pages still run. Load heavy tools on demand, establish budgets from measurements, and test authenticated caching before optimizing the current no-store baseline.

Error recovery acceptance deliberately breaks configuration, removes an asset, returns HTML instead of JS, stalls worker control, mismatches controller/core, disconnects Wisp, blocks a destination, fills storage, and interrupts a loaded tab. Preserve the canonical target and local libraries, distinguish engine startup from endpoint reachability and ordinary remote errors, and offer the relevant Retry/Settings/Wait/Home actions. Existing requests/sockets need not survive endpoint changes; reconnect must not replay uploads or forms. Logs should remain bounded and export optional/redacted. The final privacy explanation should consistently say **local app history only**, disclose remaining browser/device/network metadata, and identify cookies/site storage as separate pools. Those precise boundaries make the project's ambitious feature union credible rather than shrinking it into vague promises.

## Conclusion

The central design improvement is to make release diversity an explicit product capability with real ownership boundaries. Five runtime origins let the shell remain coherent while preserving incompatible APIs, storage models, and transport contracts; canonical URLs let the user move between them without persisting temporary engine routes. The fixture-supported foundation is now meaningful enough to build on, but completion depends on validating the final revision's lifecycle and public topology, not expanding claims from a menu or a successful static page.

The user's next deployment can be straightforward precisely because browser assets are shipped with public source and the owned relay remains a separate service. The strongest final project will combine the exact blue identity, screenshot-specific interaction hierarchy, transparent package/adaptation provenance, and narrowly evidenced behavior. Advanced tools, Tor, wrappers, profiles, and account sync become substantial future modules with observable completion criteria, while the everyday browser can deliver useful local tabs and libraries immediately without pretending those later capabilities are already complete.

## Evidence index and source-line register

Relative links identify project files; `file://` links identify original inputs. Line locators reflect the inspection cutoff. Screenshot originals are registered in `screenshot-design.md` lines 460–462. Official deployment documentation was directly rechecked.

| Evidence | Main source-line locator |
|---|---|
| Proxy2 | Version `index.html` bootstrap: stable 38–71, alpha0 41–66, alpha67 42–110; alpha2 `client.js` 85–121. |
| New audit/design | `proxy2-versions.md`: provenance 44–92, licenses 94–109, collisions 131–150; `screenshot-design.md`: observations 19–42, geometry 179–195. |
| Shell | `app.js`: persistence 3–30, tabs 47–115, bridge 124–153, libraries 175–231, settings 232–276, portability 300–317. |
| Runtime | `adapter.js`: canonical 65–87, adapters 93–130; `alpha2-shared.js` 25–30; `sw.js` 18–64. |
| Deployment | `server.ts`: origins 12–34, headers 36–42, routes 44–84; `build.mjs` adaptations 41–53; `relay/server.mjs` limits 6–11. |
| Checks | `tests/shared.test.mjs`, `tests/relay.test.mjs`, `tests/browser/proxy.spec.mjs`; only reported results are claimed. |

All seven earlier notes were read as background: [engines](../research_notes/ojjyProxy%20implementation%20research/engines.md), [networking](../research_notes/ojjyProxy%20implementation%20research/networking.md), [deno-hub](../research_notes/ojjyProxy%20implementation%20research/deno-hub.md), [hub-theme](../research_notes/ojjyProxy%20implementation%20research/hub-theme.md), [demo-ux](../research_notes/ojjyProxy%20implementation%20research/demo-ux.md), [feature-inventory](../research_notes/ojjyProxy%20implementation%20research/feature-inventory.md), and [templates](../research_notes/ojjyProxy%20implementation%20research/templates.md). The preserved [earlier report](ojjyProxy%20implementation%20research.md) records historical recommendations; chapter 1 specifies which are superseded.

Exact metadata: [stable](https://registry.npmjs.org/@mercuryworkshop/scramjet/1.1.0), [alpha0](https://registry.npmjs.org/@mercuryworkshop/scramjet/2.0.0-alpha), [alpha2](https://registry.npmjs.org/@mercuryworkshop/scramjet/2.0.2-alpha), [alpha67](https://registry.npmjs.org/@mercuryworkshop/scramjet/2.0.67-alpha.2), [controller](https://registry.npmjs.org/@mercuryworkshop/scramjet-controller/0.0.14), [UV](https://registry.npmjs.org/@titaniumnetwork-dev/ultraviolet/3.2.10), [BareMux](https://registry.npmjs.org/@mercuryworkshop/bare-mux/2.1.9), [Epoxy](https://registry.npmjs.org/@mercuryworkshop/epoxy-transport/2.1.28), [libcurl](https://registry.npmjs.org/@mercuryworkshop/libcurl-transport/1.5.2). Actual license text remains separate evidence.

Deployment authority is [new Deploy builds/source configuration](https://docs.deno.com/deploy/reference/builds/), [domains/wildcards/DNS/TLS](https://docs.deno.com/deploy/reference/domains/), and [acceptable use](https://docs.deno.com/deploy/acceptable_use_policy/). Design authority is the [pinned hub palette](https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/theme.css#L4) and [pinned component stylesheet](https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/hub.css). Future tools are grounded in the [pinned Scramjet request viewer](https://github.com/MercuryWorkshop/scramjet/blob/b14b709ac190b786dd03becbd0728ab72bdd3ad6/packages/demo/src/pages/RequestViewer.tsx) and [pinned Epoxy showcase](https://github.com/MercuryWorkshop/epoxy-tls/blob/0c11678d72a636c3a4bc723db87e03e7b888eaf9/client-showcase/src/demo.tsx), with their implementation limitations preserved throughout this report.
