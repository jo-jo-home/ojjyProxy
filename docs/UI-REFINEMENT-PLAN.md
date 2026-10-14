# ojjyProxy UI Refinement Plan

Autonomous work order: modern, refined shell with deeper customizability and better
animations. Everything here applies to **this app's interface only** — never to proxied
website pages. Every new effect is gated by the existing `prefers-reduced-motion`,
**Performance mode**, and a new explicit motion setting, so the app stays fast and
motion-safe.

## Goals

1. **More theme customizability** — 12 built-in themes (including the first light
   themes), a per-theme accent override, and shareable custom-theme codes.
2. **More UI customizability** — corner radius, motion level, glass/blur, home
   background patterns, four more fonts, three more accent-tinted cursors.
3. **More modern & refined** — every hardcoded color swept onto theme variables so all
   themes (light included) look intentional; themed selection, focus rings, scrollbars,
   and native-control accent; polished hero, cards, tabs, dialogs and menus.
4. **Better animations** — a motion-token system (fast/medium/slow), springy easings,
   tab pop-in, dialog exit animation, navigation shimmer, aurora drift, pulsing
   connection dot — all disabled by motion-off, Performance mode and reduced motion.

## Non-goals

- No changes to engines, relay logic, transport, password gate, panic behavior, or
  bookmarks/history data formats (`ojjyproxy-v1` exports stay compatible).
- No external fonts/CDNs/assets — everything is local CSS/JS and system font stacks.
- No UI scale/density slider: the CSS is px-based; a half-working scale is worse than
  none (documented here as deliberately rejected).
- No automatic theme switching or auto relay switching of any kind.

## Workstreams

### W1 — Theme engine in `public/shared.js` (single source of truth)

Add exported `THEMES`: an ordered array of `{ id, label, scheme: "dark"|"light",
glow, colors: { bg, bg2, bg3, border, accent, text, text2, muted, star, danger, success } }`.
The first entry **must** be the hub-blue default (today's exact palette). Add exported
`readableInk(hex)` (relative-luminance pick of near-black `#10131a` or near-white
`#ffffff` for text placed on an accent surface). The app and the Node tests import the
same data, so palettes are validated instead of eyeballed.

Built-in themes (12): `default` (hub blue), `midnight`, `ocean`, `lunar`, `ember`,
`moss`, `rose`, `graphite`, `daylight` (light), `paper` (light warm), `frost` (light
cool), `sakura` (light pink). Palettes are chosen to pass the contrast budget in W7.

### W2 — Palette application in `public/app.js`

- `applyPalette()`: for built-in **and** custom themes, set all 11 color vars plus
  `--glow` inline on `<html>`; set `body.dataset.theme`, `body.dataset.scheme`, and
  update `<meta name=theme-color>` to the background color. Custom themes fall back to
  the default palette if slots are missing. The old per-theme CSS blocks in
  `style.css` are removed; `:root` keeps hub blue as the pre-JS default.
- `applyAccent()`: if `accentOverride` is on, override `--accent`. Always compute
  `--accent-ink` from the effective accent via `readableInk`, so primary buttons stay
  readable under any accent (fixes white-on-yellow class of bugs).
- `applyRadius()` / `applyMotion()` / `applyGlass()` / `applyPattern()`: map the new
  settings to `--radius` and the `data-motion` / `data-glass` / `data-pattern` body
  attributes. Performance mode forces motion off and pattern/glass to none via CSS.
- `applyCursor()` rebuild: system/native `crosshair` handled in CSS; `dot`, `lunar`,
  and the new `ring`, `diamond`, `star` cursors are generated in JS as accent-tinted
  SVG data URIs (hotspots per shape), injected through one `<style id=cursor-style>`
  element, rebuilt whenever the effective accent changes. Custom image cursor keeps its
  current behavior and validation.
- New settings (defaults preserve today's exact look): `accentColor:""`,
  `accentOverride:false`, `radius:"medium"`, `motion:"full"`, `glass:"none"`,
  `pattern:"plain"`. `readSettings` validates: accent hex when overriding;
  radius/motion/glass/pattern must be from their fixed option lists.
- Theme picker is JS-populated from `THEMES` plus the `custom` option.
- **Shuffle**: `surprise me` rolls the picker to a random built-in theme; nothing
  changes until Save.
- **Theme codes**: `copy theme code` serializes the 11 color inputs
  (`{v:1,colors:{…}}` → base64) into the `theme code` box (and clipboard when
  allowed); `apply theme code` parses, validates all 11 slots, switches the picker to
  Custom and fills the inputs. Import errors surface in `settings-message`.
- **Tab pop-in**: `renderTabs` remembers how many tabs it drew; when the count grows,
  only the newest tab node gets a `tab-in` animation. Close stays synchronous (safe
  with middle-click, overflow menu and close-others flows).
- **Dialog exit**: `closeDialog(dialog)` animates (`.dialog-closing`, ~180 ms) then
  closes natively; instant when motion is off/Performance/reduced-motion; a second
  Esc/close attempt force-closes. All `dialog.close()` call sites and the `cancel`
  event route through it.

### W3 — Settings surface in `public/index.html`

- Theme select options move to JS (W2); font select gains **Palatino**, **Avenir /
  Futura**, **Handwriting**, **Courier** (8 → 12); cursor select gains **Ring**,
  **Diamond**, **Star** (5 → 8 styles incl. custom image).
- New **Appearance & motion** section: Accent color + `match theme` +
  `override theme accent` switch; Motion (full/subtle/off); Corner radius
  (sharp/soft/medium/round/extra); Glass surfaces (none/subtle/full); Home background
  (plain/dots/grid/aurora); `surprise me` inline action.
- Custom-colors box gains the **theme code** textarea + `copy theme code` /
  `apply theme code` buttons.

### W4 — Visual system rewrite in `public/style.css`

- **Tokens** in `:root`: the 11 colors (hub defaults), `--glow`, `--accent-ink`,
  `--app-font`; radius scale `--radius:12px`, `--radius-sm:max(0px,calc(var(--radius) - 2px))`,
  `--radius-lg:calc(var(--radius) + 4px)`; motion durations `--dur-fast/.14s`,
  `--dur-med/.22s`, `--dur-slow/.32s`, `--dur-xslow/.5s` (subtle halves them);
  easings `--ease-out`, `--ease-spring`; `--blur`/`--glass-a` for glass levels.
- **Hardcolor sweep** (theme-proofing): page glow gradient → `var(--glow)`;
  `.browser` white flash → `var(--bg)`; every `#2e6bbdxx` shadow/ring →
  `color-mix(in srgb,var(--accent) N%,transparent)`; brand/site-icon/dot blues →
  accent mixes; danger hover `#e0555522` → danger mix; setup banner → warning mix of
  `--star`/`--bg`; dialog backdrop → `color-mix` of `--bg`; primary button text →
  `var(--accent-ink)`.
- **Light themes**: `body[data-scheme=light]{color-scheme:light}` so native controls,
  inputs and scrollbars match.
- **Glass**: topbar, tabstrip, address capsule, navigation pill, docked bar, menus,
  suggestions, toast and status chip take translucent `color-mix` backgrounds and
  `backdrop-filter:blur(var(--blur))` driven by `data-glass` (none keeps today's look).
- **Patterns**: `body::before`/`::after` fixed layers — dots (radial-gradient tile),
  grid (1px lines), aurora (two drifting accent/glow blobs, slow transform loop).
  Content layers get `position:relative;z-index:1`. Hidden under Performance mode.
- **Motion gating** unified: `.performance` and `body[data-motion=off]` kill all
  animations/transitions and backdrop filters (alongside the existing
  `prefers-reduced-motion` media query). `body[data-motion=subtle]` shortens durations.
- **Animations**: keep enter/dialog-in/menu-in/fade-slide/pop-in/toast-in/frame-in/
  card-in/backdrop-in (re-timed onto tokens, springier curves); add `dialog-out`,
  `tab-in`, `shimmer` (indeterminate sweep on `.address-capsule.loading`),
  `pulse` (connection dot), `drift` (aurora). `::selection` and `accent-color` follow
  the accent.
- Everything existing — sidebar layout, docked/mobile media queries, toggles, cards,
  library, context menus — is carried over rule-for-rule.

### W5 — Refined components

- Hero: `ojjyProxy` heading scale/letter-spacing polish; `freedom.` becomes a
  bold accent→text gradient clip with the accent underline retained.
- Buttons/inputs: tokenized hover/active transitions; focus-visible ring via accent mix.
- Tabs: active/hover state transitions, pop-in for new tabs.
- Shortcut cards: hover lift + accent-tinted border glow; icon chip tint from accent.
- Dialogs: springy in/out, blur backdrop, radius tokens; stable scrollbar gutter.
- Empty states, library rows, engine chips, status rows: token polish only.

### W6 — Docs

- README "Included" and Settings sections describe the new appearance system honestly.
- ROADMAP gains a "UI refinement pass" entry marked done with this plan.
- This document gets its checkboxes ticked in the final commit.

### W7 — Test matrix (all must pass before push)

- `tests/shared.test.mjs` (Node): THEMES structure (ordered ids, unique, default
  first, 11 valid hex slots + glow per theme, scheme ∈ {dark,light}); **contrast
  budget** — text/bg ≥ 7, text2/bg2 ≥ 7, muted/bg ≥ 4.5 and muted/bg2 ≥ 4.5,
  accent/bg2 ≥ 3, star|danger|success vs bg2 ≥ 3; `readableInk` returns dark ink for
  light accents and white for dark accents.
- `tests/browser/proxy.spec.mjs` (Chromium): a new "appearance studio" test covering:
  13 picker options; selecting `daylight` applies light palette vars + light scheme;
  accent override + `readableInk` var; radius mapping (computed border-radius 0 on
  sharp); motion off zeroes computed animation; pattern/glass attributes; shuffle
  changes the picker; theme-code export → mutate → import round-trip restores slots;
  invalid code rejected; new font/cursor options apply `--app-font` and cursor style;
  reload persists every new setting.
- Existing 9 Chromium tests keep passing unchanged (labels `customize`,
  `use backup relay`, `save settings`, engine flows, gate test).
- Full local gates: `npm run check` (deno check + server tests + node tests),
  `npm test`, `npm run test:browser`.
- End-to-end: `LIVE_SITE_PASSWORD=… npm run test:live` against production after push.

## Rollout order

1. Commit this plan. 2. shared.js (W1). 3. app.js (W2). 4. index.html (W3).
5. style.css rewrite (W4–W5). 6. tests (W7) + fixes. 7. docs (W6). 8. Full local
suites → commit → push → live matrix.

## Risks & mitigations

- Dense single-line CSS rewrite could drop a rule → every existing selector carried
  over deliberately; browser suite + computed-style assertions catch regressions.
- Dialog exit animation could race tests/menus → second-attempt force close; Playwright
  auto-waits actionability.
- Light themes on legacy hardcoded colors → W4 sweep + contrast tests.
- Clipboard may be blocked in some browsers → code also lands in the visible textarea.
- Backdrop filters cost GPU → default glass is `none`; Performance mode forces all
  effects off.

## Done when

All suites green locally, pushed, live five-engine matrix green, plan checkboxes
ticked, README/ROADMAP accurate.

## Result (2026-10-14)

Completed in full and verified: W1–W7 as specified, plus two robustness fixes found
during testing — (1) animated dialog exits mark the dialog `inert` + `aria-hidden`
mid-fade so nothing can match or use it while it disappears, with an `openDialog`
helper that fully resets closing state; (2) the browser-suite dev stack moved to a
dedicated port 8700 (`DEV_PORT`) because a sibling project's dev server respawns on
port 8000, and dev runtimes are now told the shell's real port via `PUBLIC_APP_ORIGIN`
instead of relying on the server's 8000 fallback.

Verified: 12 Deno/Node unit checks (including the theme-table, contrast-budget and
readable-ink tests), 10 Chromium browser tests, 10 Firefox, 9+1 documented WebKit skip,
reproducible build (no vendor/manifest drift), and the live five-engine matrix against
production after push.
