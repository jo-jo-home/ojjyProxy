# Workspace UI implementation and verification

## Delivered

- Original hub-blue default preserved; eighteen complete palettes and six appearance-only presets.
- Original tabs, expanded/collapsible sidebar, compact rail, classic dock, bottom dock, and focus
  workspace.
- Categorized/searchable native-dialog settings, reversible previews, appearance-only reset, and
  safe save/cancel behavior.
- Configurable welcome/launchpad/recent/collection dashboard sections, three shortcut densities,
  favourite-bookmarks visibility modes.
- Named URL collections with rename, confirmation before removal, additive imports/exports,
  unavailable-engine handling, capacity bounds, and lazy append.
- Validated/resized local wallpapers, staged save/removal, dimming, fit, transaction-complete
  storage, and actionable failures.
- Keyboard tab navigation, visible focus restore, mobile sidebar fallback, contained overlay scroll,
  native controls, and no frequent-action motion.
- No new dependency, framework migration, backend service, relay selection, or engine change.

## Research supplement: archive branch comparisons

Filename labels were not assumed to indicate newer/better code. Content-hash comparison of paths
containing theme/settings/sidebar/layout/bookmark found:

| Comparison against main | Common UI-related paths | Differing content | Additional paths in comparison archive |
| ----------------------- | ----------------------: | ----------------: | -------------------------------------: |
| Nebula dev              |                      19 |                10 |                                      0 |
| Nebula Snyk branch      |                      19 |                10 |                                      0 |
| Daydream v3             |                      67 |                 4 |                                      0 |
| Space v2                |                       9 |                 0 |                                      0 |

Targeted diff review found Nebula appearance changes concerning static routes/catalog URLs,
substantial formatting in settings layout, and Daydream privacy changes concerning a generated relay
URL matcher and label capitalization. These do not justify importing another UI framework or
changing ojjyProxy's networking. This is a targeted UI comparison, not an audit of every file in the
supplied repositories.

## Motion gate and ingredients

- Frequency gate: tabs, keyboard shortcuts, theme/layout swaps, search and repeated dashboard
  actions are instant. Purpose for occasional dialogs: preventing a jarring change.
- Native dialogs retain browser focus management. Interruptible WAAPI uses opacity and, only with no
  reduced-motion preference, scale(.96), strong ease-out `cubic-bezier(.23,1,.32,1)`, 200 ms
  entry/150 ms exit. Reduced/subtle motion uses 125 ms opacity only; keyboard opening, explicit Off
  and performance mode are instant.
- Only optional preset-card press uses scale(.96), 150 ms; hover/fine-pointer rules do not move
  browsing controls. Static labels, selected borders and pressed states carry feedback independently
  of motion.
- Theme updates suppress transitions during the palette commit. Aurora is static; no perpetual
  connection pulse or tab entrance.

## Resolved findings, grouped by principle

### Interactions and data integrity before polish

| Severity         | Location                  | Before                                                               | After                                                             | Why                                                                                     |
| ---------------- | ------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| HIGH, resolved   | `public/app.js:1899`      | Collection could open before config/restored tabs were ready         | Await shell boot before filtering engines and allocating capacity | A visible action must perform its stated behavior, even on a slow configuration request |
| HIGH, resolved   | `public/workspace.js:131` | WebKit failed committing Blob records                                | Persist typed binary records; await transaction completion        | Supported wallpaper save must survive reload, not just show a successful preview        |
| HIGH, resolved   | `public/app.js:1290`      | Closing dialog could remain in accessibility queries during its exit | Inert/hidden closing state with interruption-safe cleanup         | Hidden interaction targets must not remain actionable or ambiguous                      |
| MEDIUM, resolved | `public/workspace.css:53` | Fixed wallpaper pseudo-layer visually covered the shell header       | Wallpaper constrained to the positioned home surface              | Decorative layers cannot obscure navigation                                             |

### Motion, surfaces and state

| Severity         | Location                                        | Before                                                         | After                                                       | Why                                                                                      |
| ---------------- | ----------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| MEDIUM, resolved | `public/style.css:7`, `public/workspace.css:14` | Repeated keyframed entrances, hover lifts and connection pulse | Instant frequent actions; occasional interruptible dialogs  | High-frequency interactions must remain responsive and predictable                       |
| MEDIUM, resolved | `public/app.js:289`                             | Palette changes triggered existing color transitions           | One-paint transition suppression around palette application | Theme switching should not smear through intermediate colors                             |
| LOW, resolved    | `public/workspace.css:70`                       | Appearance picker was a text-only select                       | Local preview cards plus the retained native select         | Palette/layout differences are visible before committing, without losing keyboard access |

## Verification scope

Automated coverage includes desktop and 390 px layouts; a live owned-relay fixture retains the same
document and frame URL across layout changes. It checks classic/bottom controls reserve their own
space rather than overlap page content, persistence after reload, preview rollback by close and
Escape, all eighteen palettes, keyboard tab orientation, collection bounds/import/export/lazy
loading, wallpaper invalid-file handling, and injected storage-denial errors. The full existing
browser suite is run with `DEEP_PROXY_TESTS=1`.

Visual review inspected generated screenshots of the appearance studio, sidebar/rail/bottom/focus
layouts, mobile layouts, and a saved wallpaper home page. The wallpaper-header defect was detected
through screenshots, not hidden by passing DOM checks.

### Completed individual runs

| Command                                                                                                               | Result                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                                                       | Deno check passes; 7 server tests and 17 Node tests pass, including the documented restricted-permission startup task |
| `DEEP_PROXY_TESTS=1 npm run test:browser`                                                                             | 23 passed, Chromium                                                                                                   |
| `DEEP_PROXY_TESTS=1 npm run test:browser -- --browser=firefox`                                                        | 23 passed                                                                                                             |
| `DEEP_PROXY_TESTS=1 npm run test:browser -- --browser=webkit`                                                         | 22 passed, 1 pre-existing alpha67 engine skip                                                                         |
| `DEEP_PROXY_TESTS=1 PROXY_TEST_TRANSPORT=libcurl npm run test:browser -- --grep 'loads through the owned Wisp relay'` | 5 passed, Chromium                                                                                                    |
| `git diff --check`                                                                                                    | No whitespace errors                                                                                                  |

Final consolidated run: `DEEP_PROXY_TESTS=1 npm run test:browser -- --browser=all` — **68 passed, 1
pre-existing engine skip**, in 2.3 minutes. All new workspace UI checks pass on all three browsers.
This includes the last staged-wallpaper race cleanup.

The startup smoke test also caught a pre-existing missing `SINGLE_RUNTIME` permission in
`deno task start`. Its explicit environment allowlist now includes that flag, and the smoke test
starts the real task, reads compact configuration, and requests all three new workspace assets under
those restricted permissions. The server process group is terminated afterward.

## Limits that must not be presented as verification

- Existing Firefox dedicated-worker gaps remain annotated for engines other than alpha2. A passing
  engine case does not mean those worker assertions ran.
- WebKit alpha67 remains skipped for observed parsing/controller failures; the exact root cause is
  unresolved.
- UV WebKit still skips its deep POST/worker/socket block. This UI work does not fix or verify it.
- Not verified: actual low-end Chromebook hardware performance, school-network reachability, a
  public deployment of these changes, complete screen-reader testing, forced-colors hardware
  rendering, real touch-device feel, and subjective motion review at slow playback on a physical
  device.
- Local wallpaper storage is evictable, and collections are not isolated login profiles.

**Approve for the inspected local UI scope**, subject to the documented engine gaps and unverified
hardware/deployment scope. This is not approval of every combination of arbitrary custom
colors/fonts or every runtime/browser capability.
