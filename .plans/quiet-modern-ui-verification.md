# Quiet modern UI — implementation evidence

## Delivered

- Reduced chrome heights, one home headline, search before utilities, and 80 px destination cards.
- Native shortcut sorting, inline Add shortcut, a More disclosure for secondary tools, and a
  labelled Exit action separated from tab creation/closing.
- Folded native settings galleries, keyboard disclosure behavior, and automatic opening for matching
  searches. Existing custom palettes, layouts, exports, collections, and transport behavior remain.
- Token-driven dialog timing and interruption-safe toast fades with stale-hide cancellation.
- User-requested desktop floating-pill hover expansion: a segment gets 1.5× its resting width while
  neighbours redistribute. Transform-only 150 ms strong ease-out; inverse SVG scaling preserves icon
  proportions at settled states. Docked, reduced/subtle, Off/performance, mobile and touch remain
  static. Keyboard input resets immediately.
- Direct Backgrounds access, eight original generated scenes, validated local image upload and
  explicit image/theme switching without deleting a stored image. No remote image dependencies,
  video, persistent background animation, new engine releases, vendor patches, or relay changes.
- Settings regression fixes: commit/acknowledge domain policy before runtime readiness; move
  optional asset prefetch after home load/idle; keep horizontal tab widths stable while titles
  update.

## Gates and motion ingredients

Tab switches, shortcuts, typing, sort, gallery disclosure, palette/layout swaps and keyboard actions
stay instant. Occasional dialogs prevent a jarring change; toasts provide feedback. Navigation hover
is the user's explicit spatial-feedback request, kept to 150 ms and excluded from accessibility and
low-effects modes. Static focus rings, selected borders, labels and native pressed states remain.

Dialogs use existing `--dur-med`/`--dur-fast` and `--ease-out` tokens through WAAPI; reduced/subtle
mode is opacity-only at 125 ms. Toasts use CSS opacity transitions (150 ms) plus translate only with
no reduced-motion preference. No new animation dependency or keyframed interactive state.

## Findings by principle

### Correct interaction before polish

| Severity         | Location             | Before                                                                           | After                                                           | Why                                                                                 |
| ---------------- | -------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| HIGH, resolved   | `public/app.js:1320` | Pointer focus could collapse an enlarged segment between mouse-down and mouse-up | Pointer focus retains geometry; keyboard resets separately      | Expanded edge clicks must activate the intended control, not the neighbour          |
| MEDIUM, resolved | `public/app.js:114`  | Visibility changed abruptly, without an interruptible exit state                 | Retarget CSS state and cancel both hold and delayed-hide timers | Smoother feedback must not introduce stale callbacks that hide a newer notification |

### High-frequency motion and pointer gating

| Severity         | Location                                         | Before                                                              | After                                                                                         | Why                                                                                     |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| MEDIUM, resolved | `public/app.js:1289`, `public/workspace.css:164` | Static equal segments did not provide the requested hover expansion | Bounded transform-only expansion with reduced-motion, pointer, performance and keyboard gates | Provide the requested spatial feedback without animating layout or slowing keyboard use |
| MEDIUM, resolved | `public/app.js:1330`                             | Dialog curves/timing duplicated CSS constants                       | Read the existing CSS token values                                                            | Keep one motion language rather than divergent systems                                  |

### Hierarchy, surfaces and progressive disclosure

| Severity         | Location                                           | Before                                                              | After                                                                                              | Why                                                                        |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| MEDIUM, resolved | `public/index.html:26`, `public/workspace.css:189` | Competing promotional headings and outlined utilities before search | One title and primary search, quiet utilities below                                                | Make browsing the clear first task                                         |
| MEDIUM, resolved | `public/workspace.css:214`                         | Oversized 170 px tiles plus a dedicated Add tile                    | 80 px destination cards with inline Add action                                                     | Reduce visual weight without removing saved sites                          |
| MEDIUM, resolved | `public/studio.js:56`                              | All 24 preset/palette previews visible at once                      | Native, keyboard-usable folded galleries; search expands matching previews                         | Progressive disclosure reduces customization crowding                      |
| LOW, resolved    | `public/workspace.css:263`                         | Abrupt notification visibility changes                              | Retargetable opacity/transform transitions, reduced-motion fallback, structural transparent border | Smoother feedback without keyframe replay or invisible forced-colors edges |

## Verification performed

- Node/server checks: `npm run check` passes Deno type checking, 7 server tests, and 18 Node checks.
- Final full deep matrix: `DEEP_PROXY_TESTS=1 npm run test:browser -- --browser=all` — **92 passed,
  one pre-existing WebKit alpha67 skip**, in 2.9 minutes. This run includes the policy
  acknowledgement, delayed-policy test, stable-width title test, expanded-edge clicks and keyboard
  reset.
- Libcurl regression: five owned-relay engine cases pass on Chromium with deep checks enabled.
- Firefox home/title/layout repetition: six passes across three independent repetitions, without
  automatic retries or changes to assertion timeouts.
- Separate expanded-segment edge-click checks pass on all three browsers after the focus fix;
  WebKit's identity-matrix serialization is treated as identity, not mistaken for motion.
- Tests verify search hierarchy, laptop fit, phone/short viewport overflow, secondary tools,
  favourite/recent/A–Z sorting, folded galleries, keyboard interaction, reversible backgrounds,
  stored-image retention after switching scenes and reload, and repeated-toast exit cancellation.
- Screenshot inspection includes laptop/phone home, settings, floating navigation rest/hover, and
  generated backgrounds. Actual screenshots exposed the original crowding and informed spacing.
- Geometry tests assert unchanged pill outer width, expanded segment width, settled icon width,
  reverse/retarget, static reduced/touch/docked/performance cases, and successful edge activation.

### Intermediate failures retained as evidence, not hidden by retries

Earlier full runs exposed a document requesting before an asynchronously delivered domain policy, a
missed New-tab click while a page title changed its sibling tab's width, and one Firefox `load`
event timeout despite a rendered home page. The policy path now waits for transaction completion and
acknowledgement over MessageChannel, and a deterministic 200 ms delivery-delay fixture verifies that
the blocked destination receives no first request in Chromium, Firefox and WebKit. Horizontal tabs
now have stable widths; changing a live fixture title from long to short is asserted not to move the
New-tab target. Optional multi-megabyte asset warm-up is deferred until load/idle instead of
competing with initial UI loading. The exact cause of the single Firefox load-event stall is not
claimed as proven; it did not recur in the final run.

## Boundaries / Not verified

Actual Chromebook hardware performance, physical touch-device feel, slow-motion inspection in a
desktop DevTools animation panel, complete screen-reader/forced-colors validation, and every
custom-palette/background contrast combination are **Not verified**. No claim is made that this UI
change fixes existing Firefox dedicated-worker gaps or the UV WebKit deep-check exclusion. The
alpha67 WebKit engine case stays explicitly skipped; its exact underlying cause remains unresolved.

Source changes are pushed only after the final test result is recorded. The unrelated
headless-engine planning file present in the working directory is not part of this UI change.

Feel-check: hover quickly across the navigation pill and click enlarged edges on real pointer
hardware; inspect icon proportions mid-transition at 2–5× duration, and verify low-end-device frame
time. Automated tests validate behavior/endpoints, not a subjective physical-device judgment.

**Approve for the inspected local UI and regression-test scope**, with the existing engine
exclusions and unverified hardware/upgrade scope above. An in-place production upgrade from an older
service worker has not been exercised; the adapter handles controller changes and reports an
explicit policy acknowledgement timeout rather than navigating before confirmation.
