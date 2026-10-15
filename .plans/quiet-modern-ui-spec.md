# Quiet, modern shell redesign

Implementation complete. Final evidence:
[quiet modern UI verification](quiet-modern-ui-verification.md). The final deep three-browser run
has 92 passes and one pre-existing engine skip; server/Node checks and the five-case Chromium
Libcurl regression also pass.

End-to-end verification also required three narrow regression corrections: stable horizontal tab
widths during title updates, deferred optional asset prefetch, and a committed service-worker policy
acknowledgement before runtime readiness. A live-title fixture and a controlled delayed-policy
fixture cover those fixes. This does not change engine releases, vendor bundles, or relay routing.

## Direction (autonomous follow-up to the supplied screenshot)

The screenshot shows too many equally emphasized things: two tall chrome rows, three promotional
lines plus a second large slogan, a row of outlined utility buttons before the primary search,
oversized shortcut tiles, engine metadata, sort controls and a dense link footer. Adding more motion
would amplify that crowding. Keep every feature, the navy palette, runtime isolation and saved
preferences; change hierarchy rather than add more controls.

The user's standing instruction is autonomous work with no questions. Use existing interview
decisions: Chromebook-first, preserve the blue identity, keep all layouts/themes, reversible
appearance settings, and no network/engine changes.

## Layout

- Reduce shell header height to 52 px and tabstrip to 40 px; update desktop sidebar grid rows too.
- Keep brand, a concise status indicator and quiet hub link in the header. Move the ambiguous
  standalone panic X away from New tab into a labelled Exit action in the header. Retain its ID,
  handler, accessible label and immediate behavior.
- Home uses one 32 px title and one short supporting sentence. Remove the competing eyebrow and
  FREEDOM headline from this page. Search is next in DOM and visual order, followed by restrained
  engine metadata and low-emphasis bookmark/history/customize actions.
- Home content max-width 880 px, search max-width 600 px, balanced vertical spacing responsive to
  viewport height. Do not vertically center a page taller than its viewport.
- Replace 170 px shortcut tiles with 80 px horizontal destination cards (36 px local text icon,
  title/domain, small favourite mark). Keep compact and list modes meaningful and adapt to two
  columns/single-column as space requires. No remote favicon dependency.
- Use a single native sort select in place of three always-visible sort chips. Keep existing sort
  state/semantics and add tests for every option.
- Keep footer essentials brief; native details discloses connection log, about and shortcuts.
  Collections remain directly accessible. No hover-only hidden features.
- The optional wallpaper must not turn every line into another padded box. Group readable surfaces
  around search and shortcut sections, and preserve the existing staged image storage contract.

## Settings density

Keep searchable categories and the All view for backwards discoverability. Fold the six workspace
previews and eighteen palette cards into native disclosure sections, closed on each settings open.
Keep regular native theme/layout fields available without opening a gallery. Searching for a gallery
term expands it so results are usable. Category changes, searching and disclosures are instant.
Reduce heavy borders, adjust headers and spacing, retain visible input/focus boundaries and
transparent borders where shadows provide elevation. No new component library.

## Motion gate

Tab creation/switching, keyboard actions, typing/search, layout/theme swaps, sorting and disclosure
changes are frequent and instant. Reject decorative motion on those. Occasional dialogs use
**preventing a jarring change**; toast messages use **feedback**.

Retain interruption-safe native-dialog WAAPI, but read easing/durations from the existing CSS token
system. Default modal entry 200 ms / exit 150 ms, strong ease-out `cubic-bezier(.23,1,.32,1)`,
opacity and scale(.96) only. Reduced/subtle motion uses opacity alone at 125 ms; keyboard activation
and explicit Off/performance modes remain instant.

Toast messages use retargetable CSS transitions, not a replaying keyframe. Opacity 150 ms and a
small translate only under no-preference; reduced motion keeps opacity only. Repeated messages
replace text and reset the hold timer without restarting an entrance. Exit reverses entry. Timer
cleanup must prevent an earlier message's hide callback from hiding a newer one. Native status text
still conveys the message without motion.

Use 150 ms color/opacity feedback for pointer affordances; no moving row/tab/card hover effects.
Scale(.96) on occasional preset actions only, never disabled controls. Hover styling gated by
hover/fine-pointer; reduced-motion and performance settings ship in the same change.

## Implementation and safety

Refine existing `public/index.html`, `public/workspace.css`, `public/app.js`, `public/studio.js` and
existing tests. Do not create another theme or motion subsystem. Reuse IDs for functional controls,
SVG symbols/currentColor, native dialog/details/select and existing storage. Removing redundant copy
must not reset the user's chosen engine, theme, bookmarks or collections. The backend and runtime
iframe implementation remain unchanged.

## Verification

1. Compare actual desktop (including 1366×768 Chromebook dimensions), 390 px phone and short-height
   screenshots. Search must precede secondary libraries; there must be no horizontal overflow and
   the main shortcuts must not require scrolling on a normal laptop.
2. Verify all secondary actions remain reachable, disclosures work with keyboard, sort modes retain
   favorites/recent/A–Z behavior, and Exit remains outside the tab-create/close cluster.
3. Verify collapsed settings galleries, search-expansion, preset preview/cancel/save and all
   existing workspace/dashboard/wallpaper behavior.
4. Verify occasional modal motion uses tokens, reduced motion has no transforms, keyboard modal
   opening is instant, repeated toast notifications retarget and a prior hide timer cannot hide a
   new message. No animation may be the only state cue.
5. Run `npm run check` and the complete deep three-browser fixture matrix. Preserve and report
   existing engine skip/known-gap annotations. Inspect generated screenshots, not only DOM asserts.
6. Record actual hardware/device and slow-playback checks not performed rather than claiming them.

No hosting change or automatic publication is part of this request.

## Follow-up steering: expanding navigation and publication

The user explicitly requested the screenshot's expanding hovered navigation segment and a GitHub
push when complete. For the desktop floating pill, grow the hovered segment to 1.5× its ordinary
width while neighbours share the remaining width. Keep total pill width constant. Apply direct
per-element translate/scale transforms with inverse icon scaling (not width/flex transitions) over
150 ms using the existing strong ease-out token. Retarget from current transition state. Reset when
the pointer leaves, on keyboard focus, layout changes and resize.
Docked/mobile/touch/reduced-motion, Off and performance modes retain static controls; keyboard focus
gets the existing visible ring. This is user-requested spatial feedback, not a general
animated-hover rule for tabs or lists.

After checks pass, commit only the scoped changes and push to the configured GitHub main branch.

## Follow-up steering: custom images and background themes

Keep the validated local image upload but make it directly discoverable from a Backgrounds action on
home. Add eight visual, lightweight background choices (Clean, Aurora, Dusk, Mesh, Night sky, Coast,
Blueprint, Dot paper) with native pressed-state buttons. Store only the background ID; render static
CSS behind the home workspace, not website frames. Add an appearance-only source setting: image or
theme. Choosing a generated background must preserve the uploaded image, and choosing a new image
switches back to image mode. All choices preview/cancel/save with existing settings; image bytes
stay local and outside exports. Existing uploaded-image users retain their image mode. Verify
palette independence, save/reload, cancellation, switching back to a saved image, and no extra
external requests or continuous animation.
