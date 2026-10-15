# ojjyProxy workspace and appearance expansion

Implementation and test evidence: [workspace verification](proxy-workspace-ui-verification.md). All
scoped features are implemented. Wallpaper persistence uses a typed ArrayBuffer record rather than a
direct Blob value because the direct Blob write failed on tested WebKit; the displayed image is
reconstructed locally. Final consolidated browser run: 68 passed, one pre-existing engine skip.

## Outcome and interview decisions

Preserve the exact hub-blue default, engine defaults, existing bookmarks, history, transport
selection, and runtime-origin boundaries. Add optional workspace layouts rather than replace the
product. Chromebook performance takes precedence over visual effects. This specification covers
shell UI only; no new relay, engine, authentication, filtering-evasion, or hosting behavior is
authorized or required.

The user selected all layout and feature proposals: expanded vertical tabs, compact icon rail,
classic browser, bottom controls, focus workspace; searchable categorized settings, appearance
presets, named tab collections, configurable dashboard, local wallpapers. Appearance previews must
be temporary until saved; closing or Escape cancels. Applying a preset changes appearance only,
never network, privacy, or website state. On narrow screens desktop sidebars become top tabs. Focus
has a visible restore button and shell Escape exit when no dialog is open.

Delegated choices: collections append without closing current tabs, and restored tabs remain lazy.
Wallpapers are bounded local raster images stored separately from ordinary exports.

## Research: supplied archives

All eight ZIP inventories were read without executing their code or installing dependencies. The
archives comprise four project families, not eight independent UI designs. Branch labels are not
proof of release order or quality. Targeted source inspection covered the following:

| Family               | Evidence inspected                                                            | Useful idea                                                                                         | Decision                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Obsidian main        | README, `src/lib/themes.js`                                                   | Library-first organization; named palette families, light and OLED choices                          | Add original palette entries and theme preview cards. Do not import its application or branding. A malformed `##88c0d0` value demonstrates why source palettes need validation rather than blind copying. |
| Nebula main/dev/Snyk | Package manifests; main settings layouts and settings utilities               | Category navigation and grouped settings sections                                                   | Add native buttons and local search over categorized sections. Do not add its marketplace, analytics, account APIs, or executable custom CSS.                                                             |
| Daydream main/v3     | Package manifests; main appearance section, theme manager, sidebar stylesheet | Expanded/collapsed tabs, visual theme cards, configurable new-tab content, bookmarks-bar visibility | Adapt behavior to existing DOM and tokens, without importing React/extension infrastructure or claiming independent cookie profiles.                                                                      |
| Space main/v2        | Package manifests; main sidebar and settings page                             | Narrow navigation rail, session organization, surface grouping                                      | Add compact rail and explicit saved URL collections. Do not reproduce hover-only navigation, paid/account integrations, oversized press effects, or unrestricted motion.                                  |

The archives contain AGPL-licensed projects. Implement the interaction ideas independently; preserve
the existing project's AGPL license and identify inspiration in project documentation. No
third-party branding, wallpapers, fonts, or code bundles are needed.

## Research: web platform and skills

- MDN reduced-motion reference:
  https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- web.dev reduced-motion guidance: https://web.dev/articles/prefers-reduced-motion
- MDN system color preference:
  https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme
- MDN IndexedDB transactions and lifecycle:
  https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
- Supplied animate skill and modal/button recipes; supplied better-ui transition, theme-switch,
  surface and motion rules.

Use explicit user choice rather than silently changing the default to the OS theme. Existing colors
remain the source of truth. IndexedDB operations resolve on transaction completion, close
connections on version changes, and report failure. Uploaded image decoding and rasterization happen
before opening a write transaction.

## Existing implementation and constraints

The current shell already has twelve palettes, editable palette tokens, theme-code sharing, two
layout choices, multiple cursor/font choices, glass, motion and pattern controls. Extend these
instead of building parallel systems. Current state uses `ojjyproxy-app-v1`; retain it with additive
defaults. Runtime frames must not be recreated by appearance changes. Keep the 20-tab cap and
runtime readiness/error behavior.

Current motion includes tab/home/card entrances replayed on frequent actions, global hover lifts,
spring easing, and keyframed dialogs. Replace frequent-action movement with instant feedback.
Existing native dialogs and selects remain accessible platform components; do not hand-roll
substitutes. Dialog transitions use opacity and optionally transform, never layout properties.
Keyboard-opened dialogs must be instant.

## Implementation architecture

1. `public/workspace.js`: pure layout/preset definitions, appearance keys, URL collection
   sanitization, image limits. Unit-test without DOM.
2. `public/studio.js`: settings navigation/search, preview/theme cards, dashboard controls, bounded
   wallpaper storage. A narrow callback API integrates with existing shell state. Do not move proxy
   logic into this module.
3. `public/workspace.css`: additive layout/surface/dashboard rules and responsive fallbacks. Update
   existing motion rules rather than rely on a second animation system.
4. `public/app.js`: additive defaults, appearance-only preview wrapper, collection management,
   recent-dashboard/bookmarks-bar rendering, focus/sidebar controls, and transaction-safe save
   integration.
5. Native collection dialog and static dashboard containers in `public/index.html`; new controls
   remain discoverable without hover.

## Layout contract

- Original top/pill stays untouched by default.
- Expanded sidebar: readable tab titles, selected marker, close controls, collapse button. Rail
  toggle does not unload tabs.
- Compact rail: bounded width, numbered/initial tab affordances with accessible full names and
  native title tooltips; close actions remain available through tab menu and expanded layout. Mobile
  returns to readable horizontal tabs.
- Classic: top tabs and docked address/navigation, with runtime body taking remaining flex height,
  no controls covering content.
- Bottom: top tabs and controls below runtime content, including mobile safe-area inset. Suggestions
  open upward.
- Focus: remove shell header/tabstrip while retaining a fixed visible restore button. Runtime is not
  reloaded. Restoring selects top layout; the setting is persisted. Escape only affects shell-owned
  focus and never promises to intercept cross-origin website keys.

## Appearance studio

Add six original full-token palettes (OLED, Nord-inspired cool slate, mocha-inspired mauve, warm
sand, high-contrast dark, mint light). All eleven slots must be valid six-digit hex. Validate main
text contrast and muted text budgets using existing tests. Preserve default palette byte values.
Render thumbnail-style cards using local CSS/DOM, not downloaded images. Keep the existing select
for keyboard and assistive-technology use.

Provide six appearance-only workspace presets: Original, Study sidebar, Compact night, Classic desk,
Bottom dock, Focus. Presets set layout, control style, theme, radius, motion, glass, pattern, and
shortcut density only. No data/reset side effects. Preview updates CSS/DOM without writing
localStorage. Save reads the form; cancel returns to committed state. Reset appearance fills default
appearance values without clearing bookmarks, collections, history, credentials, or relay settings.

Settings retain an All category for backwards discoverability, plus Appearance, Connection, Privacy,
and Data. Search matches section text and keywords independently of active category, shows matching
sections and a no-results message, and does not delete form fields or their values. Category actions
use buttons with pressed state, not tab roles unless implementing the full tab interaction model.

## Dashboard and bookmarks bar

Add show/hide settings for welcome heading, launchpad, recent visits, and saved collections.
Defaults preserve existing home. Shortcut density: comfortable, compact cards, or list. Recent
visits are bounded to six unique local HTTP(S) destinations and are hidden if history saving is off.
No external widgets, telemetry, favicons, or online suggestions. Clearing history immediately
removes its dashboard rows.

Add bookmarks-bar visibility: hidden by default, home-only, always. Render at most twelve favourites
with local text marks; buttons navigate through the active engine. Keep the bar outside runtime
iframe content so it cannot change website styling.

## Collections and data integrity

At most twelve named collections, each up to twenty valid HTTP(S) tab descriptors with known
engines, title length 120, name length 60. Save only tabs that have URLs. Never store tokens, cookie
jars, relay overrides, iframe objects, or website storage. Creating a collection without URL tabs
explains how to use it. Rename is explicit; removal requires a second confirmation click. Restore
appends without activating every tab; report capacity and unavailable-engine skips. No existing tabs
are discarded.

Persist collections alongside shell data and include validated collections in the existing versioned
JSON export/import. Wallpaper bytes are never exported. Imported connection settings still do not
automatically change traffic routing. Corrupt saved collections are sanitized; unsafe URLs and
unknown engines are excluded.

## Wallpaper contract

Accept PNG/JPEG/WebP, at most 3 MB input. Decode using browser image facilities, reject invalid
content and excessive dimensions (16 million pixels); rasterize to at most 1920 by 1080 so animation
and active content do not persist. Store a single Blob in an app-specific IndexedDB object store,
independent of runtime databases. Show it behind the home page only; never behind website content.
Use bounded dimming and fit mode; keep text on readable opaque surfaces. Stage upload/removal until
Save, discard on Cancel, revoke replaced object URLs. Database failures leave the previous committed
image intact and show an actionable message. Local browser storage can be evicted and is not cloud
backup.

## Motion and polish decisions

Frequency gate: tab switching, tab creation, shortcut navigation, settings search, layout changes,
focus exit and keyboard actions are high-frequency and instant. Purpose for occasional dialogs:
preventing a jarring change. Use native dialog plus CSS/WAAPI opacity transition, optional
`scale(.96)` under no-preference, 200 ms entrance and 150 ms exit, strong existing `--ease-out`
updated to `cubic-bezier(.23,1,.32,1)`. No animated width/height or layout transitions. No perpetual
connection pulse. Aurora becomes a static optional gradient for Chromebook budget.

Suppress transitions during theme application with a temporary class and forced style flush. Gate
hover effects behind hover/fine-pointer media queries. Press scale `.96` only on infrequent actions,
never disabled controls. Reduced motion keeps gentle opacity only; explicit Off/performance mode may
disable effects entirely. Dialog scrolling and menus contain overscroll. Structural/input borders
remain; decorative shadows are restrained. Reuse SVG symbols and `currentColor`.

## Acceptance and rollout

1. Unit: layout IDs and preset appearance allowlist; new palettes pass existing contrast checks;
   collection parsing rejects unsafe URLs, credentials and unknown engines, limits lengths/counts.
2. Browser: preview does not persist; Cancel/Escape rollback; Save persists after reload; preset
   does not alter relay/engine; settings search/category/no-results behavior; dashboard controls and
   bookmark bar.
3. Browser: collections save/rename/append lazy/delete confirmation/reload; malicious or malformed
   storage/import cannot create script navigation.
4. Browser: valid wallpaper upload/save/reload/remove, staged cancel, invalid MIME/oversize
   rejection; object URLs do not survive export.
5. Layout tests at desktop and 390 px: sidebar/rail/classic/bottom/focus, horizontal overflow,
   visible restore, expanded tab labels, runtime fixture remains browsable without layout-triggered
   reload.
6. Motion tests with reduced-motion preference: no transform animation, no tab entrance, static
   theme swaps. Keyboard opening is instant. Touch hover does not move controls.
7. Run `npm run check`, targeted shell browser tests in Chromium/Firefox/WebKit, then existing
   owned-relay engine tests. Record any actual skips/failures; do not equate suite green with
   complete engine compatibility or real Chromebook verification.

No deployment, new service, dependency upgrade, or engine rewrite is part of this work. Document
actual test results and remaining hardware/visual checks rather than claiming pixel-perfect or
low-end-device performance from automated tests alone.
