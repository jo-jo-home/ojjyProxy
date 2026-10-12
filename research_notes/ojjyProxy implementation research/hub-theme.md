# ojjyProxy — exact hub-theme research and proposed final experience

Research date: 2026-10-12. Current GitHub `master` was rechecked and remains commit `91be48dcf75dbe7d1771eab9aa90b1b233c1a033`, “Add player profiles, expanded stats, and persistent login.” This report is based on source-code inspection only. No screenshots were reviewed, no pages were rendered, and no live visual/browser tests were performed. “Verified” means present in this repository snapshot, not visually verified in production. All proxy screens and behaviors below are proposals, not an implemented application. [Snapshot](https://github.com/jo-jo-home/ojjys-game-hub/commit/91be48dcf75dbe7d1771eab9aa90b1b233c1a033).

## 1. What exactly is the current main hub's blue visual language?

### Takeaway

Use the **current `/hub` default theme** as the source of truth: deep navy `#0a1628`, subtle blue-black cards `#111d2e`, blue hover surfaces `#162a42`, restrained steel-blue borders `#1e3a5f`, and muted royal-blue accent `#2e6bbd`. Matching the hub also requires its light-weight Segoe UI headings, centered wrapping navigation, translucent 16px cards, pill inputs, compact outlined buttons, and gentle motion—not just choosing a blue hue. [Palette T1]; [Base stylesheet C1]; [Nav override C2]; [Main page P1].

### Cited Findings

#### Source map and citation convention

The bracketed source identifiers in this report resolve to commit-pinned files and original line numbers. `public/hub.css:1` is a long compressed line containing most foundational component CSS; it was expanded for reading without changing the file. Citations to that line refer to the original source, not invented reformatted line numbers.

| ID | Exact source path and lines | What it establishes |
|---|---|---|
| T1 | `public/theme.css:4` | Current default palette, semantic tokens, ring |
| T2 | `public/theme.css:5–18` | Optional presets and custom-token derivation |
| T3 | `gen-theme.py:78–121` | Authoritative preset table and semantic defaults |
| T4 | `server.ts:868–894` | Pre-paint saved preferences, defaults, birthday includes |
| C1 | `public/hub.css:1–2` | Base typography/layout/cards/search/buttons/modals and entrance motion |
| C2 | `public/hub.css:9–57,90–91` | Density/font/motion/focus/sort controls and final nav positioning |
| C3 | `public/hub.css:59–88` | Monogram gradients and welcome dialog |
| C4 | `public/hub.css:93–127` | Feedback forms, success/error states, 500px responsive adjustment |
| C5 | `public/profiles.css:1–23` | Profile/account components and 600px responsive adjustment |
| P1 | `server.ts:1481–1535,1617–1623` | Main hub hierarchy, toolbar, welcome, cards, favorites, launch behavior |
| P2 | `server.ts:1289–1361` | Apps screen, icons, stable monograms, lazy images |
| P3 | `server.ts:1363–1421` | Stats/account/profile page shell and stats components |
| P4 | `server.ts:942–989` | Login card, inputs, account/legacy login |
| P5 | `server.ts:1018–1042` | Navigation SVG vocabulary |
| P6 | `server.ts:1198–1280` | Admin components, badges, button variants |
| P7 | `server.ts:1536–1615` | Storage-manager contents and deletion behavior |
| J1 | `public/hub-ui.js:13–21,87–202,204–281,283–343` | Search, sort, recent launches, keyboard behavior |
| J2 | `public/themes.js:20–50,97–135,511–625,634–677` | Customize panel and theme preferences |
| J3 | `public/bg.js:23–82,342–355,378–415` | Default/static/animated backgrounds, gradients, reduced motion |
| J4 | `public/account-favorites.js:1–47` | Account favorites and queued offline synchronization |
| J5 | `public/profiles.js:20–96,109–134` | Profile/people/account content and state behavior |
| J6 | `public/session.js:35–45,59–111` | Saved-login validation, navigation updates, sign-out |
| J7 | `public/offline.js:422–464,495–518` | Offline card labels and compact SVG state icons |
| B1 | `public/birthday.css:1–21` and `public/birthday.js:8–24,69–109` | Temporary rainbow palette/countdown exceptions |

[Palette T1]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/theme.css#L4
[Palette T2]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/theme.css#L5-L18
[Generator T3]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/gen-theme.py#L78-L121
[Preferences T4]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L868-L894
[Base stylesheet C1]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/hub.css#L1-L2
[Layout stylesheet C2]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/hub.css#L9-L57
[Nav override C2]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/hub.css#L90-L91
[Icons welcome C3]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/hub.css#L59-L88
[Forms C4]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/hub.css#L93-L127
[Profiles C5]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/profiles.css#L1-L23
[Main page P1]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L1481-L1535
[Main scripts P1]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L1617-L1623
[Apps icons P2]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L1289-L1361
[Stats profiles P3]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L1363-L1421
[Login P4]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L942-L989
[Feedback page P8]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L1424-L1478
[Nav icons P5]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L1018-L1042
[Admin P6]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L1198-L1280
[Storage P7]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/server.ts#L1536-L1615
[Grid behavior J1]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/hub-ui.js
[Customizer J2]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/themes.js
[Background J3]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/bg.js
[Favorites J4]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/account-favorites.js#L1-L47
[Account behavior J5]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/profiles.js#L20-L134
[Session J6]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/session.js#L35-L111
[Offline controls J7]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/offline.js#L422-L518
[Birthday CSS B1]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/birthday.css#L1-L21
[Birthday behavior B1]: https://github.com/jo-jo-home/ojjys-game-hub/blob/91be48dcf75dbe7d1771eab9aa90b1b233c1a033/public/birthday.js#L8-L109

#### Exact default color tokens — verified

Every value in this table comes from `public/theme.css:4`; the core palette is also independently visible in `gen-theme.py:81–83`. [Palette T1]; [Generator T3].

| CSS token | Exact value | Existing visual role / recommended proxy use |
|---|---|---|
| `--bg` | `#0a1628` | Page canvas, inset form fields, browser-shell background |
| `--bg2` | `#111d2e` | Card/panel surface; basis for translucent controls |
| `--bg3` | `#162a42` | Hover/selected surface, secondary buttons, tracks |
| `--border` | `#1e3a5f` | 1px outlines, dividers, ordinary control borders |
| `--accent` | `#2e6bbd` | Hover/focus outlines, selected chips, progress, primary emphasis |
| `--text` | `#e2e8f0` | Headings, important values, typed text |
| `--text2` | `#c8d6e5` | Body copy and regular secondary controls |
| `--dim` | `#64748b` | Subtitles, card descriptions, metadata |
| `--faint` | `#475569` | Placeholders, footer text, quiet hints, inactive stars |
| `--overlay` | `rgba(10,22,40,.55)` | Custom background-image scrim; NOT the modal's actual scrim opacity |
| `--star` | `#f0c040` | Favorite/bookmark highlight |
| `--danger` | `#e05555` | Destructive actions and error text |
| `--danger-bg` | `#2a1a1a` | Destructive control background |
| `--danger-bd` | `#4a2020` | Destructive border |
| `--ok` | `#4ade80` | Ready/success/online states |
| `--warn` | `#e0a355` | Warning/retrying/partial states |
| `--onaccent` | `#0a0a0a` | Existing default text token for filled accent buttons |
| `--spark` | `#ffffff` | Starfield/background particles where applicable |
| `--ring` | `color-mix(in srgb,var(--text) 22%,transparent)` | Theme swatch ring, not the general keyboard outline |

**Do not replace the default with the hub's “ocean” preset.** Ocean is a separate teal/cyan scheme (`--bg:#071a1f`, `--accent:#22d3ee`), not the navy-blue default. Similarly, “midnight” is purple (`--accent:#8b5cf6`). A generic electric-blue or cyan treatment would not reproduce the specified hub. [Palette T2] (`public/theme.css:6,9`).

#### Surface recipes and gradients — verified

- Default background is **flat navy**: `html{background:var(--bg)}` and transparent body. Background preference defaults to `none`. There is no mandatory blue hero gradient or permanent neon glow. [Base stylesheet C1]; [Preferences T4]; [Background J3, lines 413–415].
- Launch card: `color-mix(in srgb,var(--bg2) 88%,transparent)`, backdrop blur `10px`, 1px `--border`. At the default theme, the CSS surface is effectively `rgba(17,29,46,.88)` before compositing. Its final visible pixel color varies with the background; `#111d2e` is the base token, not a measured screenshot color. [Base stylesheet C1].
- Toolbar/search: `color-mix(in srgb,var(--bg2) 85%,transparent)`, backdrop blur `8px`; equivalent base alpha `rgba(17,29,46,.85)`. Login uses the same 85% surface but blur `14px`. [Base stylesheet C1]; [Login P4, line 956].
- Ordinary overlay: `color-mix(in srgb,var(--bg) 88%,transparent)` and backdrop blur `10px`; welcome overlay: navy at 82% and blur `8px`. These are distinct from the `--overlay` 55% image scrim. [Base stylesheet C1]; [Icons welcome C3, lines 75–81].
- Optional gradient background: `linear-gradient(120deg,#0a1628,rgba(46,107,189,.35),#0a1628,rgba(46,107,189,.22),#0a1628)` under default tokens; background size `400% 400%`, animation `hubgrad 28s ease infinite`. It becomes still under reduced motion. [Background J3, lines 342–349 and 405–406].
- Missing-icon monogram: 145° gradient combining name-derived `hsl(--mg 55% 50%)` at 30% with `--bg2`, then at 12% with `--bg3`; its border mixes that hue at 35% with `--border`. This is a localized colorful icon tile, not a card-wide gradient. [Icons welcome C3, lines 63–71]; [Apps icons P2, lines 1333–1344].
- Card hover changes to `--bg3`, outlines in `--accent`, rises `3px`, and adds `0 8px 24px` accent shadow at 18% opacity. Welcome dialog shadow is `0 12px 40px` accent at 16%. [Base stylesheet C1]; [Icons welcome C3, line 81].

#### Typography, shapes, spacing and hierarchy — verified

Pixel equivalents below assume the browser's ordinary 16px root font. They are conversions for discussion, not a repository-defined root-size override. Exact CSS values are the rem values. [Base stylesheet C1].

| Element | Exact source recipe |
|---|---|
| Default font | `'Segoe UI', system-ui, -apple-system, sans-serif`; no downloaded brand font |
| Main title | `2.4rem` (~38.4px), weight `300`, letter spacing `.05em`, `--text` |
| Subtitle | `.95rem` (~15.2px), `--dim`, margin-top `.5rem` |
| Card title | `1.15rem` (~18.4px), weight `500`, `--text` |
| Card description | `.85rem` (~13.6px), `--dim`, margin-top `.4rem` |
| Header | centered, padding `3rem 1rem 2rem` |
| Main content | max-width `900px`, full width, auto horizontal margins, padding `2rem 1.5rem` |
| Launch grid | `repeat(auto-fill,minmax(220px,1fr))`, gap `1.2rem` (~19.2px) |
| Launch card | radius `16px`, padding `2rem 1.5rem`, centered content |
| Card icon | `64×64px`, object-fit contain, bottom margin `.8rem` |
| Search pill | max-width `400px`, radius `999px`, padding `.7rem 1.2rem`, `1rem` text, bottom margin `2rem` |
| Header action | radius `11px`, padding `9px 15px`, `.88rem` text, icon/text gap `7px` |
| Sort chip | radius `999px`, padding `5px 12px`, `.76rem` text |
| Panel row | radius `12px`, padding `1rem 1.2rem`, bottom margin `.7rem` |
| Small row button | radius `8px`, padding `4px 12px`, `.78rem` text |
| Customize option | radius `10px`, padding `8px 14px`, `.85rem` text |
| Small metadata tag | radius `4px`, padding `2px 7px`, `.65rem` text |
| Footer | centered, padding `2rem 1rem`, `.85rem` faint text, top border |

Sources: foundational values are all `public/hub.css:1`; sort chips are at lines 47–56. Profile forms introduce complementary 10px inputs and 16px cards; stats tiles use 14px radius. [Base stylesheet C1]; [Layout stylesheet C2]; [Profiles C5]; [Stats profiles P3, lines 1376–1393].

#### Navigation, buttons and icons — verified

- Main hub ordering is: heading, personal subtitle, header actions, search, injected sort/hint row, launch grid, author footer. Account links are ordinary outlined toolbar controls, not an existing avatar dropdown/sidebar. [Main page P1]; [Grid behavior J1, lines 312–317].
- The original `.hdr-btns` rule positions the buttons top-right, but the later `header .hdr-btns` rule sets `position:static`, centered justification, no maximum width, and `margin:1.2rem auto 0`. With source load order and specificity, the current main hub uses a **centered wrapping row below the title**. Gap remains `8px`. Treat the old corner layout as overridden. [Base stylesheet C1]; [Nav override C2].
- Current `/hub` actions: conditional admin, my profile, people, my account, my stats, apps, ideas & reports, customize, offline, storage, sign out. Proxy-specific home/bookmarks/history would be additions, not discovered current hub navigation. [Main page P1, line 1516].
- Standard buttons are understated outlines with `--bg2`/`--bg3` backgrounds. Filled accent controls exist for welcome, admin primary actions, and feedback submit; their text styling is not uniform across pages. Large fluorescent full-width blue CTAs are not the main-hub navigation pattern. [Base stylesheet C1]; [Icons welcome C3, lines 85–88]; [Admin P6, lines 1223–1231]; [Forms C4, lines 109–111].
- Navigation icons: 15px inline SVG on a 24×24 viewBox, no fill, `stroke:currentColor`, stroke-width `2`, rounded caps/joins; CSS prevents icon shrink/baseline drift and sets opacity `.85`, rising to `1` on hover. Existing motifs: apps tiles, gamepad, sliders, download tray, admin key, bar chart, feedback bubble, storage drives. [Nav icons P5]; [Base stylesheet C1].
- Main favorite stars are Unicode outline/filled stars (`☆`/`★`), not the SVG nav icon system. A star sits top-right at `8px`, has 4px padding, 1.2rem size, and switches from faint to gold. Download states instead use 11–13px SVGs with stroke-width `2.4`. Profiles use emoji avatars; brand/game launch art uses images. Preserve this distinction rather than describing a nonexistent uniform icon library. [Main page P1, lines 1486 and 1530]; [Base stylesheet C1]; [Offline controls J7]; [Account behavior J5, lines 25–33].

#### Motion, focus and responsiveness — verified

- Entrance `fin`: opacity `0→1`, translateY `8px→0`; header/grid `.5s ease`, panels `.3s ease`. Ordinary hover transitions `.2s`; star hover scales `1.15`, selected-star pop `.25s` reaching `1.35` at halfway. Filled welcome button lifts 1px and brightens to 1.08. [Base stylesheet C1]; [Icons welcome C3].
- Focus-visible: generally 2px accent outline, 2px offset; profile controls use 3px offset. Search focus adds a 3px shadow ring with accent at 22%; grid keyboard state uses accent at 28%. [Base stylesheet C1]; [Layout stylesheet C2, lines 37–55]; [Profiles C5, line 8].
- Comfortable density is the default. Compact expands main maximum to 1100px, grid minimum to 150px, gap `.7rem`, card padding `1.1rem .8rem`, radius 12px, icons 44px, titles `.95rem`, and header title `1.8rem`. Roomy uses 260px grid minimum, gap `1.6rem`, padding `2.6rem 1.8rem`, and 78px icons. [Layout stylesheet C2, lines 9–22]; [Customizer J2, lines 44–50].
- Main card responsiveness comes from auto-fill and wrapping controls, not a found main-hub hamburger breakpoint. Feedback adjusts at 500px. Profiles switch two-column forms to one column at 600px, use 1rem side padding, smaller card padding, two-column stat tiles, and wrapping search. [Base stylesheet C1]; [Nav override C2]; [Forms C4, line 127]; [Profiles C5, line 23].
- Font alternatives: Georgia/Iowan/Times serif; ui-monospace/SF Mono/Menlo/Consolas; “easy read” optionally uses locally available OpenDyslexic/Atkinson Hyperlegible, then Verdana/Tahoma, with `.02em` spacing and `1.7` line-height. This is not bundled OpenDyslexic. [Layout stylesheet C2, lines 24–30].
- `data-motion="off"` suppresses CSS animation/transition durations to `.001ms`. The background engine explicitly respects OS reduced-motion preferences. However, no actual `@media(prefers-reduced-motion)` animation-suppression rule was found in `hub.css`; the customization copy claims system preference stops all transitions, which the inspected CSS does not fully substantiate. [Layout stylesheet C2, lines 32–35]; [Background J3, lines 74–82]; [Customizer J2, lines 605–608].

### Inferences

- The correct matching direction is **navy canvas + subdued translucent panels + accent outlines**, preserving the hub's airy title/search/card composition. Most page area should stay navy; blue belongs to focus, selection, hover, progress, and occasional primary actions. [Palette T1]; [Base stylesheet C1].
- The default 900px container with 220px minimum cards implies roughly three launch columns at roomy desktop widths and fewer as space contracts, assuming a 16px root size. This is a CSS-derived layout prediction, not a measured rendered column count. [Base stylesheet C1].
- Appearance preferences should default to the exact blue theme but may offer the existing theme system as an explicit user choice. To reproduce “whatever theme the user currently sees” across a separate proxy origin, preference transfer would need new functionality; identical CSS alone cannot transfer saved storage. [Preferences T4]; [Customizer J2].

### Gaps and inconsistent pages

- **Source of truth:** `/hub` plus `theme.css` and the final `hub.css` cascade. Apps reuse the same shell; login, profiles, stats and admin provide secondary component references with different container widths and some different button text colors. [Main page P1]; [Apps icons P2]; [Login P4]; [Stats profiles P3]; [Admin P6].
- **Optional themes:** light, ocean, midnight, etc. are legitimate user-selected variants, not conflicting default brand specifications. Use `default` for the initial blue deliverable. [Palette T2].
- **Birthday exception:** shared THEME_SCRIPT loads birthday CSS/JS. Source schedules a purple/rainbow override for November 5, 2026 in US Eastern time and a countdown before then. Rainbow borders/title gradients are temporary seasonal behavior, not the default visual identity. On the research date the source would schedule countdown mode, but no production countdown was visually observed. Decide explicitly whether the separate proxy should share this seasonal feature; do not copy the birthday palette into the base design. [Preferences T4]; [Birthday CSS B1]; [Birthday behavior B1].
- **Error/CTA inconsistency:** profiles hard-code `.pf-message.error` to `#ef7777`, while shared forms use `--danger:#e05555`. Welcome/admin primary use `--onaccent` but feedback submit uses `--text`. For proposed proxy controls, select one deliberate variant from the main visual vocabulary rather than combining inconsistent foreground styles accidentally. [Profiles C5, line 22]; [Forms C4, lines 109–115]; [Icons welcome C3, lines 85–88]; [Admin P6].
- **Independent games:** the hub deliberately themes only whitelisted owned games. ojjyChess defaults to its own classic colors unless users choose “match this theme”; game graphics cannot define proxy brand colors. [Preferences T4, surrounding server lines 896–908]; [Customizer J2, lines 614–622].
- Actual font rendering, blur support, contrast, narrow-screen overflow, screenshot appearance and the visitor's saved theme remain untested. Source-derived motion should not be described as visually tested. Modal keyboard focus trapping/restoration was not established from the inspected handlers; proposed dialogs should implement it explicitly.

## 2. Which existing hub features should ojjyProxy reuse or mirror?

### Takeaway

Reuse the hub's design vocabulary and proven interaction patterns: card launches, favorites/recent sorting, keyboard navigation, customization panels, storage rows, profile forms, restrained status messages and plain-language feedback. Account/session integration, bookmark synchronization, proxy browsing history, and engine controls are separate functionality—not something achieved by loading the hub scripts unchanged. [Main page P1]; [Grid behavior J1]; [Favorites J4]; [Account behavior J5].

### Cited Findings

| Existing feature | Verified current behavior and sources | Proposed proxy adaptation, not existing capability |
|---|---|---|
| Launch cards | Icon/monogram, title/description, whole-card launch, separate favorite star; app and game cards share `.gc`. [Main page P1]; [Apps icons P2] | Site shortcuts and bookmarks with the same visual component; engine choice sits outside the grid. |
| Favorites | Immediate local stars; account-specific key; queued per-game mutations reconcile with `/api/account` on reconnect. [Favorites J4] | Immediate local bookmark starring; later account synchronization only through a new bookmark schema/API. Current game IDs are not arbitrary URLs. |
| Search | Searches ID, display name and description; word matching plus punctuation/spacing-insensitive matching. [Grid behavior J1, lines 87–112,292–301] | Match saved sites by label/domain/description with the same rules. Separate URL navigation submission from shortcut filtering. |
| Sorting | Favourites/recent/a–z; recent storage retains at most 40 IDs. [Grid behavior J1, lines 13–21,64–76,114–152] | Reuse those modes for site cards; retain browsing history separately, not under `hub_plays`. |
| Keyboard | `/` focuses/selects search, arrows navigate visible grid, Home/End work, Enter activates anchors, Escape closes panels or clears search. [Grid behavior J1, lines 204–281] | Same home-grid ergonomics; browser/address/tab shortcuts are new and should not hijack keystrokes inside proxied content. |
| Customize | Dark/light presets, saved custom themes, name/share/copy/delete, `OJT1-` codes, base/advanced colors, backgrounds, density, fonts, motion. [Customizer J2] | Same 520px overlay and options styling; proxy-specific engine/session controls in their own section. Theme choices are local unless an explicit transfer is added. |
| Storage manager | Groups localStorage/cache/IndexedDB records; shows sizes, recency, counts, and clear controls; existing clear-all deletes all origin data. [Storage P7] | Same visual rows but proxy-specific groups and precise scope: bookmarks, history, preferences, engine data. A same-origin proxy must not inherit broad deletion of hub logins/game saves. |
| Login/account | Login form plus legacy-code details; profile display name/avatar/bio; username/password changes; sign out other sessions. [Login P4]; [Account behavior J5, lines 84–134] | Reuse actual hub routes for hub identity. A standalone proxy should not present itself as signed in to the hub merely because it matches the UI. |
| Profiles/people | Visible display name, @username, emoji avatar, biography, favorite games, playtime statistics, people search. [Account behavior J5, lines 25–83] | Hub account shortcuts/identity panel after integration. Proxy bookmarks/history should not become publicly visible game-profile fields by accident. |
| Stats | Light numeric tiles, 14-day activity bars, per-game rows. [Stats profiles P3]; [Account behavior J5, lines 35–47] | Optional local browser-session summaries using the same tiles. Do not add destination URLs to existing public player activity without an explicit new design. |
| Feedback | Themed inputs, kind selector, title/details/count, private admin inbox, saving/success/error messages. [Forms C4]; [Feedback page P8] | “report this page” with optional URL/engine/short description, clearly previewed before submission. Current feedback catalogue accepts game/app entries, so proxy-specific fields need adaptation. |
| Connection/offline messages | Dimmed non-playable cards with “needs internet”; disabled controls and text feedback rather than claiming success. [Offline controls J7]; [Account behavior J5] | Locally cached bookmarks/settings remain usable; remote browsing reports offline/relay failure plainly. No “download website” promise. |
| Saved session/logout | Validates saved session on return; errors do not silently erase valid session; logout displays signing out/retry state. [Session J6] | Carry real hub-session behavior only inside its supported origin/integration boundary. Use the same stateful labels for proxy access/logout if implemented. |

### Inferences

- **Reuse components, adapt behavior.** Existing JS depends on IDs such as `g`, `s`, `cz-ov`, global functions, game catalogues, hub tokens and same-origin API routes. A future proxy can share extracted components/tokens or deliberately adapted code; it is not a drop-in plugin built by including every existing script. [Grid behavior J1]; [Customizer J2]; [Favorites J4]; [Session J6].
- On the hub, add a familiar `.gc` “ojjyProxy” launcher and/or a `.stg-btn` proxy shortcut. Its secondary line can say “browse with Scramjet or Ultraviolet,” and its online-state label can say “needs internet.” The actual launch should follow the previously researched top-level separate-origin recommendation rather than blindly copying the game iframe launcher. [Main page P1, line 1533]; [Apps icons P2, line 1321]; [Offline controls J7].
- Preserve the shared author credit and informal, concise language where appropriate: lower-case headings/actions, “nothing matches…”, “try again”, “made by Jonas Lee.” New explanatory text should be plain and small, not enterprise dashboard jargon. [Main page P1]; [Grid behavior J1, lines 172–175]; [Account behavior J5, lines 20–23].

### Gaps

- The current account API handles game favorites/profile information, not proxy bookmarks or a multi-tab browser session. It has no verified account-backed proxy history schema. These must remain labeled future work. [Favorites J4]; [Account behavior J5].
- A separate proxy origin cannot read the hub's local theme, saved session, or other origin storage. Visual parity, preference transfer and SSO are three distinct requirements; cross-origin behavior was not implemented or tested in this research pass.
- No current hub component provides a browser tabstrip, omnibox, navigation stack or transport health indicator. Those are new components below, designed using existing tokens rather than claimed as reused behavior.

## 3. What should the final project look like and do, screen by screen?

### Takeaway

The proposed final product should feel like a **browser tool made by the same author as the hub**: the home/catalogue views match the hub closely, while the browsing workspace extends its smaller buttons, navy surfaces and thin borders into browser controls. All designs below are source-anchored proposals; the source provides the styling patterns, not proof that Scramjet/UV already implements every proposed interaction.

### Cited Findings

The design basis is the 900px main hub, `.sr` input, `.gg/.gc` launch cards, centered `.hdr-btns`, `.cm-*` overlay rows, `.cz-*` preferences, `.pf-*` forms, and semantic palette documented above. There is no inspected final ojjyProxy application to describe as completed. [Base stylesheet C1]; [Nav override C2]; [Profiles C5]; [Main page P1]; [Customizer J2].

### Inferences — detailed proposed final experience

#### A. First opening: branded home and new-tab page

**What the user sees.** A deep navy canvas, spacious centered heading “ojjyProxy” in the hub's 2.4rem/300-weight treatment, and a muted subtitle such as “browse the web, made by jonas:)”. Immediately below is a centered, wrapping row of small outlined controls: “hub”, “bookmarks”, “history”, “customize”, “connection”. When actual account integration exists, “my account”/“my profile” can appear; otherwise there should be an honest local/standalone state. Icon style is the hub's 15px stroked SVG vocabulary. This inherits the actual main heading/navigation relationship, not the overridden top-right rule. [Main page P1]; [Base stylesheet C1]; [Nav override C2]; [Nav icons P5].

**The primary action.** Center a pill field with the exact search surface, 999px radius, 1rem text, and blue 3px focus ring. Start with the hub's 400px maximum; a future 520–600px combined omnibox would be an explicit functional extension, not an exact copied dimension. Placeholder: “enter a URL or search…”. A neighboring small “go” control uses the familiar 10–11px-radius outlined-button recipe. No enormous glowing hero panel is necessary. Under it, use `.hu-opt` pills for “Scramjet” and “Ultraviolet”, with Scramjet selected by default. The active pill is `--bg3` with `--accent` border, not bright white or cyan. A quieter line identifies the selected engine and current connection state. [Base stylesheet C1]; [Layout stylesheet C2, lines 47–56].

**Shortcuts beneath.** Render saved sites in the same 220px-minimum grid, 1.2rem gap, 16px-radius glassy cards. Each contains a 64px icon, readable site title, short domain/description, and a gold favorite star in the top-right. Use name-derived monograms for missing icons; avoid claiming a third-party favicon is safe/loadable before the asset strategy is chosen. Starter shortcuts should be configurable recommendations, not a hard-coded claim every named website works with both engines. An “add shortcut” card can use the same outline/monogram composition. [Base stylesheet C1]; [Icons welcome C3]; [Apps icons P2].

**Search behavior.** Submit URL/search from the omnibox to browse; use a separate small “filter saved sites” field or dedicated bookmarks view for local matching so typing a URL does not ambiguously hide shortcuts. Favorites/recent/a–z sorting retains the hub's chip-row appearance. `/` focuses the main field; arrows navigate shortcut cards only when focus is outside text inputs; Enter launches. Escape clears text/closes overlays. [Grid behavior J1].

**Empty home.** If no bookmarks exist, show a quiet `.hu-empty`-like message: “no saved sites yet” and a compact “add a shortcut” button. Do not fabricate browsing history or show decorative connection success. An optional first-run note uses the hub welcome-card 18px-radius/26rem-width recipe but with proxy-relevant instructions; it should not copy Jonas' game-hub welcome text verbatim. [Layout stylesheet C2, line 57]; [Icons welcome C3, lines 75–88].

#### B. Browsing workspace: an extended hub shell around actual website content

**Why this view differs.** A website needs substantially more room than a launch catalogue. Propose a wide/full-width workspace with 12–24px outer gutters, using the same navy background and 16px enclosing corners. This width is new; the existing 900px hub maximum remains appropriate for home/bookmarks, not mandatory for the viewport containing a desktop website. Do not squeeze every destination into a 900px “game tile”. [Base stylesheet C1, matching tokens/shapes only].

**Top tab row.** Optional in-app tabs use `--bg2` surfaces, 1px borders and 10–12px upper corners, with active tabs switching to `--bg3` and accent edge. Each shows a small icon/monogram, ellipsized title, and unobtrusive close control; a “+” uses the small row-button recipe. Tabstrip is horizontally scrollable instead of wrapping into multiple tall rows. A proposed tab stores its own target URL/title, selected engine and navigation state. Actual history/back-forward synchronization and tab restoration require engine API verification. [Base stylesheet C1]; [Profiles C5, lines 13–15 for truncated row content]; new tab behavior is not in hub source.

**Navigation row.** Below tabs: back, forward, reload/stop, home, a flexible pill omnibox, bookmark star, engine indicator, and overflow menu. Icons remain 24-viewBox outlined SVGs; don't mix filled random glyphs with line controls. Disabled back/forward controls are faded, without removing layout space. Display the meaningful target URL; internal encoded proxy paths belong in diagnostics, not as the primary address. A lock icon should not imply properties the implementation has not verified. [Nav icons P5]; [Base stylesheet C1]; [Profiles C5, line 10 for disabled controls]; target-URL mapping is proposed new behavior.

**Content area.** Destination websites retain their own colors, typography and layouts. Only ojjyProxy's chrome should match the blue hub. The proxy page is a separate rendering region, not restyled with generic `body`, button or card CSS. A small lower status strip can report “loading…”, “ready”, or “reconnecting…” in the same metadata typography; it should disappear or become quiet once browsing works. The existing theme stylesheet is variables-only precisely to avoid restyling game content, an applicable separation principle. [Palette T1, file comments lines 1–3]; [Preferences T4, surrounding lines 896–908]; [Base stylesheet C1].

**Fullscreen and focus.** Provide a compact expand control that reduces/hides shell chrome for the content, with a discoverable return control. It should not be represented as a feature that bypasses browser restrictions. Keyboard events from destination forms stay in the destination; outer-shell shortcuts apply only when the shell has focus. Background animation can run on the home screen but should default to still or pause during active browsing to avoid needless canvas work. [Background J3, adaptive design and hidden-document behavior]; fullscreen/focus policy is a new proposal.

#### C. Navigation, loading, fallback and disconnected states

**Initial request.** After submitting, preserve the entered address, show a thin accent progress track inspired by stats bars, and text identifying the actual stage: “starting browser…”, “connecting…”, “loading page…”. Stages should reflect real controller/worker/transport signals; a decorative percentage must not claim measured network completion. [Stats profiles P3, lines 1390–1392]; [Offline controls J7, lines 471–484, stateful progress inspiration].

**Engine failure.** Show a themed card with a light-weight heading, plain explanation, entered URL/domain, selected engine, and compact actions: “try again”, “try Ultraviolet”/“try Scramjet”, “back to home”. Add a collapsed “details” row for error text. Switching should create/reload the target in the alternate engine after telling the user; do not promise seamless cookies, logins, history or document state across engines. A manual fallback is more truthful than declaring automatic fallback universally reliable. [Account behavior J5, lines 20–23]; [Login P4, details pattern]; [Base stylesheet C1].

**Network failure.** Distinguish browser offline, relay unavailable, initialization failure, and target failure when real diagnostics can establish them. Reuse green `--ok`, amber `--warn`, red `--danger` with text and icon, never color alone. Keep saved shortcuts and settings available; mark browsing as requiring internet. Reconnect should report progress and offer reload when a lost underlying stream cannot be resumed. No screen should claim an entire website was saved offline just because its launcher exists. [Palette T1]; [Offline controls J7]; [Account behavior J5].

**Error screen appearance.** Use the main navy surface and normal outlined buttons, not an unrelated bright red full-page screen. Red belongs to message text and destructive/retry context; content remains `--text2` for readability. Inline explanations use .85–.95rem copy and approximately 1.5–1.6 line-height, consistent with feedback/profile components. [Forms C4]; [Profiles C5].

#### D. Bookmarks/shortcuts manager

Open as either a hub-width dedicated view or 520px `.cm-ov` overlay for small collections. Heading “bookmarks”, brief item count, pill filter, then card-grid or `.cm-it` rows. Row variant: 38px icon, site label, domain metadata, favorite marker, and compact edit/open/remove controls. Use .9–.95rem titles, .76–.8rem metadata, 12px row radius and .7rem spacing. [Base stylesheet C1]; [Profiles C5, lines 13–15]; [Stats profiles P3, lines 1382–1389].

An add/edit screen uses the existing 10px form controls and 16px form card: name, URL, optional description, preferred engine, and favorite toggle. Save updates immediately and displays an inline status. Sorting choices match favourites/recent/a–z. Deleting a bookmark removes only the bookmark; deleting engine/site data is a different action. Bookmarks are local in the standalone initial build unless account synchronization is separately implemented. [Forms C4]; [Favorites J4]; [Grid behavior J1].

#### E. History and session restoration

Use grouped recent rows rather than tall marketing cards. Dates can be section labels, sites can use the same 38px row icons, and metadata can show last visit and engine. Search/filter and “clear history” fit the existing panel vocabulary; tabs may optionally reopen a saved session. These are new browser features, not the hub's game-playtime dashboard relabeled. [Stats profiles P3]; [Profiles C5]; [Grid behavior J1, limited recent-ID storage].

Default history should be private to this browser/proxy identity, with clear retention semantics if implemented. Do not publish destinations through the hub's player profiles or reuse `/api/played` to log every URL. A separate-origin frontend avoids confusing game activity with browsing activity. “Clear history” should preserve bookmarks/settings, while “forget this browsing session” may clear a distinct tab-restoration record. [Account behavior J5, public profile/stats content]; [Grid behavior J1, play-recording endpoint]; deletion scopes are new proposals.

#### F. Appearance/customize panel

Mirror the hub's scrolling 520px panel, 88% navy scrim, 10px blur, light 1.4rem heading and small close action. Group options using `.cz-sec`, `.cz-lbl` and wrapping 10px-radius `.cz-opt` controls. Default selected theme is **default**, with the exact blue palette above. If wider theme support is wanted, reuse preset data as a deliberate optional feature rather than substitute ocean/cyan for the required base. [Base stylesheet C1]; [Customizer J2].

Keep comfortable/compact/roomy card density, system/serif/mono/easy-read text, and follow-system/off motion. Background is none by default; optional particles/gradient/starfield/shapes/uploaded image can be the same hub recipes. Apply preferences before first paint; theme swatches and custom `OJT1-` share codes could be useful for carrying a user-created appearance between hub and proxy. The current share code is a theme-sharing mechanism, not automatic cross-origin preference sync and not a verified full preference export. [Preferences T4]; [Customizer J2, share-code encoding and panel]; [Background J3].

For proxy-specific settings add separate sections such as default engine, search provider and open behavior, styled with those same options. Avoid carrying the ojjyChess-specific controls into the proxy where they have no function. Full dialog focus trapping/restoration and OS-reduced-motion CSS suppression should be explicit improvements while keeping the visual style. [Customizer J2, lines 614–622]; [Layout stylesheet C2, motion rules].

#### G. Connection and diagnostics panel

Use compact `.cm-it` cards for selected transport, relay address, initialization status and any measured check timestamp. A small status badge uses the admin `.tag` pattern: pill border, .68rem text, green/amber/red semantic variants. Show “not checked” until a real check occurs; do not claim “connected” solely from page load. A custom relay field, if offered, uses the standard navy inset 10px input, accompanied by save/test controls. [Admin P6, lines 1251–1255]; [Forms C4].

Diagnostics should explain the user's actual problem, with readable error details and a copy-details button, rather than expose opaque encoded navigation URLs in the main UI. Useful sections may include worker ready, selected engine, transport initialized and relay WebSocket state, but only once real APIs supply these signals. All connectivity behavior remains untested. [Base stylesheet C1, metadata rows]; [Account behavior J5, explicit failure messages].

#### H. Storage/privacy panel

Visually reuse “storage manager”: summary, separate 12px-radius rows, count/size/recency metadata, small tags for storage types, clear actions, and a red destructive section at the bottom. Functionally use explicit categories: bookmarks, history, appearance, restored tabs, proxy-engine/site data. Provide a clear description of what each action removes. If engine storage is origin-wide rather than separable by target site, say that instead of inventing per-site precision. [Storage P7]; [Base stylesheet C1].

Do not reuse the hub's `clearAll()` unchanged on a shared origin: it deletes every localStorage key/cache/IndexedDB database, including hub data. The proposed proxy control should touch only its owned records, and a reset should state whether bookmarks survive. Separate-origin hosting makes this boundary easier, but engine cookie/site-storage behavior still needs validation. Destructive buttons use `--danger-bg`, `--danger-bd`, and `--danger`; ordinary controls keep the navy/blue palette. [Storage P7, lines 1606–1612]; [Palette T1].

#### I. Account/identity and feedback after hub integration

Main toolbar identity should start as the actual current hub convention: “my profile”, “my account”, and optionally “people”; an avatar dropdown is a new design, not source reuse. A detailed account panel can use `.pf-identity`: 76px/18px-radius emoji avatar, display name, @username and quiet metadata. Existing profile-edit forms and device-session controls can remain on hub pages, linked from the proxy. [Main page P1]; [Profiles C5, lines 4–6]; [Account behavior J5].

Standalone mode should instead say “saved on this browser” where appropriate. Later SSO/account-backed bookmarks need real integration; no fake signed-in badge. Public hub profiles may display game favorites and stats, but proxy history/site bookmarks should stay in a separate private model unless explicitly designed otherwise. [Favorites J4]; [Account behavior J5, lines 84–96]; [Session J6].

A “report a problem” panel matches the feedback 680px view or standard overlay: brief explanation, current site URL as an editable/optional field, selected engine, short summary and details. Show a preview of submitted context and an inline “sending…/sent/could not send” status. Keep the actual submission destination consistent with the hub's private ideas/reports flow only after adapting its data model. [Forms C4]; [Feedback page P8]; [Main page P1] (`server.ts:1516`, feedback nav).

#### J. Mobile and compact experience

Home retains the centered title, wrapping navigation, pill field and auto-fill cards. At narrow widths, allow the form to occupy available width and keep outer gutters around 1rem, matching profile/feedback responsive patterns. A proposed ≤600px proxy rule can collapse ancillary controls into an overflow menu and stack bookmark forms; this is a new proxy adaptation, not a found main-hub hamburger navigation. [Base stylesheet C1]; [Profiles C5, line 23]; [Forms C4, line 127].

The browser workspace should prioritize address/navigation: scrollable tabstrip, one flexible address field, back/reload and overflow, with less-used engine/history/settings actions in the menu. Give icon-only controls labeled, comfortably clickable hit areas even though the hub's SVG itself is 15px. Those hit-area dimensions require a new responsive component design. Tabs should not be shrunk into unreadable slivers. [Nav icons P5]; [Base stylesheet C1]; new workspace mechanics are untested.

Compact density should mirror the existing 150px card minimum, 44px icons and 12px radius. Roomy should mirror 260px minimum, 78px icons and larger padding. Respect the saved font/motion preference consistently across proxy-owned screens. Destination pages keep their own responsive behavior. [Layout stylesheet C2].

#### K. End-to-end walkthrough of the proposed final project

1. User opens ojjyProxy and recognizes the hub's navy canvas, light title, centered action row and familiar cards immediately. Default is blue, still background and comfortable density. [Palette T1]; [Base stylesheet C1]; [Nav override C2].
2. They type a URL/search or click a saved site. The selected engine is visible, initialized state is honest, and loading occupies a small status/progress region rather than blocking the entire home forever. [Layout stylesheet C2, chip styling]; [Stats profiles P3, progress styling]; navigation is proposed.
3. A browser workspace appears with the same blue shell and a large destination content area. New tabs and bookmarks are convenient without restyling the target website. [Base stylesheet C1]; [Palette T1, variables-only design].
4. They star a page; its shortcut adopts the familiar gold star immediately. Home sorting can put favorites first or show recent entries, matching the game hub interaction. Account sync is shown only if implemented and authenticated. [Main page P1]; [Grid behavior J1]; [Favorites J4].
5. If browsing fails, a calm themed card explains what failed and offers retry/alternate engine/home, preserving the entered target. No engine compatibility guarantee is implied. [Account behavior J5]; [Forms C4].
6. Customize opens the familiar blur-backed panel. They can retain exact default blue, choose density/motion or share a custom theme intentionally. Saved options apply before paint on the next visit. [Customizer J2]; [Preferences T4].
7. On later hub integration, a familiar launch card opens the proxy's top-level page. Returning to “hub” opens the game catalogue; independent-origin authentication/preferences remain explicit rather than silently assumed. [Apps icons P2]; [Main page P1]; separate-origin routing recommendation remains the earlier research proposal.

### Gaps, blockers and final matching recommendation

- **Design implementation is not complete:** tabs, URL handling, engine switching, per-tab history, transport diagnostics, bookmarks and storage scopes all need implementation and browser validation. These source-anchored designs describe intended behavior, not a current app.
- **Version/deployment boundary remains:** a separate frontend origin plus external Wisp is still the recommended initial architecture from `deno-hub.md`. This theme pass does not resolve the hub's unknown production generation, Deno forward-proxy policy blocker, or engine transport compatibility.
- **Visual acceptance has not been performed:** later compare actual rendered `/hub` and proxy under the same theme/font/density, including desktop/mobile, existing saved preferences, keyboard focus, motion-off, optional backgrounds, errors and hover states. Do not claim screenshot parity before doing that comparison.
- **Brand choice:** exact default navy is the baseline. Match semantic tokens and component geometry first; preserve final centered navigation and muted glass surfaces. Gradients/animated backdrops are user-selected embellishments. Keep optional seasonal and alternate-theme behavior explicit. [Palette T1]; [Nav override C2]; [Background J3]; [Birthday CSS B1].
- **Concrete final recommendation:** implement a shared or version-pinned hub token/component layer, using default `#0a1628 / #111d2e / #162a42 / #1e3a5f / #2e6bbd`, the Segoe UI stack, 16px launch cards, 999px search pills, 11px outlined toolbar controls, 15px line SVGs, .2s hover transitions and the .5s 8px entrance. Extend those into browser-specific controls deliberately; do not swap in a generic blue template. [Palette T1]; [Base stylesheet C1]; [Nav icons P5].
