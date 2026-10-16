# Context menus and workspace features — implementation plan

Spec: [context-menus-workspace-features-spec.md](context-menus-workspace-features-spec.md)
Research: [../research_notes/Remote session streaming improvements/](../research_notes/Remote%20session%20streaming%20improvements/)
(subagent round failed on infrastructure; protocol facts were grounded locally against
`playwright-core@1.58`'s shipped CDP definitions and our own implementation).

## Architecture

### 1. Menu module — `public/menus.js` (new, dependency-free)

`createMenuHost({ onError })` returns `{ open, close, bindLongPress, suppressAfterLongPress, isOpen }`.

- `open(items, { at: {x,y} | anchor: element, align })` builds one menu element:
  - Top-layer via the **Popover API** (`popover="manual"` + `showPopover()`), so menus opened inside
    `<dialog>` surfaces (the library, settings) stack above the dialog's top layer. Feature-checked:
    without popover support, fall back to a `position:fixed` div. Portals stay inside the last
    open modal (or fullscreen subtree) to avoid modal inertness. Submenus are sibling portals,
    not children of a scrolling/clipping root panel.
  - Items: `{ id, label, icon?, hint?, disabled?, danger?, checked?, submenu?, action }`,
    `{ separator: true }`. One submenu level only. `checked` renders `role="menuitemcheckbox"`.
  - ARIA: `role="menu"` / `menuitem` / `aria-disabled` / `aria-haspopup` + `aria-expanded` on
    submenu triggers; focus moves into the menu on open (first item for keyboard opens), returns to
    the invoker on close.
  - Keyboard: ↑/↓ cycle, Home/End jump, → opens submenu, ←/Esc closes submenu, Esc closes menu,
    Enter/Space activates, Tab closes (menus are not tab stops).
  - Position: pointer point for `contextmenu`; below-start of the anchor for keyboard/⋯ opens; flip
    above when clamped; 8 px viewport margin. `transform-origin` set from the anchored side.
  - Dismissal: delegated outside `pointerdown`, window `blur`, Escape. `scroll` of any
    ancestor closes (menus must not float stale).
  - Motion: entrance/exit are **CSS transitions on opacity + transform** (`scale(0.96→1)`),
    `--ease-out` token, 150 ms in / 100 ms out; `prefers-reduced-motion`, motion=off/subtle and
    performance mode fall back to opacity-only or instant via the existing `data-motion`
    attributes/tokens. No keyframes anywhere (retarget-safe reopen).
  - Elevation: layered `box-shadow` (existing tokens), `border: 1px solid transparent` for
    forced-colors edges, `overscroll-behavior: contain`, max-height with internal scroll.
- `bindLongPress(element, openFn)`: pointer events, ~500 ms hold, ≤10 px movement tolerance,
  coarse-pointer contexts only (`(hover: none), (pointer: coarse)`); suppresses the synthetic
  `contextmenu`/`click` that follows a long-press on touch.

### 2. Shell integration — `public/app.js`

- One delegated `contextmenu` listener + one `keydown` (Menu / Shift+F10) listener resolve
  `event.target.closest("[data-menu]")` and dispatch to per-surface builders.
- `data-menu` attributes: `shortcut` (cards), `tab`, `bookmark-row`, `history-row`,
  `collection-row`, and `default` (workspace/chrome background).
- Persistent **⋯ buttons** on shortcut cards and library rows (`aria-haspopup="menu"`), visible on
  hover/focus, always present for keyboards.
- Builders (all actions reuse existing functions — `editBookmark`, `selectTab`, `newTab`,
  `closeTab`, engine open path, clipboard):

| Surface | Items |
| --- | --- |
| shortcut | Open · Open in new tab · Open with engine → · Edit shortcut · Favorite ✓/Unfavorite · Copy address · Move to folder → · Remove (undo toast) |
| tab | New tab to the right · Duplicate · Pin/Unpin · Close · Close others (confirm) · Close to the right (confirm) · Reopen closed tab |
| bookmark-row | Open · Open in new tab · Open with engine → · Edit · Favorite ✓ · Copy address · Remove (undo toast) |
| history-row | Open · Open in new tab · Copy address · Remove entry (undo toast) · Clear this day (confirm) |
| collection-row | Open all · Rename · Copy addresses · Remove (confirm) |
| default | Browsing: Back·Forward·Reload·Home·New tab·Settings. Home: + Backgrounds·Connection log·Panic exit |

- "Open with engine →" lists `ENGINES` (minus current) via the existing new-tab-with-engine path.
- Clipboard copy uses `navigator.clipboard.writeText` with an honest failure toast; menu-item click
  is the user activation.

### 3. Undo toast + bulk confirm

- `notify(text, { actionLabel, onAction, duration = 6000 })` — one optional action button; action
  click runs the restore and hides the toast; expiry drops it. Timer cleared on retarget (existing
  token/timer logic extended, not forked).
- Single removals capture the record first, splice, `persist()`, re-render, and offer undo.
- Bulk (close others / close to the right / clear day / remove collection) reuse the existing
  confirm-dialog pattern with explicit counts. No bulk action is undoable in this pass.

### 4. Pinned tabs — `public/app.js` + `public/workspace.css`

- `tabs[i].pinned?: boolean` (additive; sanitize on load).
- `renderTabs` partitions pinned-first without reordering the array; pinned render icon-only
  (`#i-globe` glyph; no external favicon requests), `aria-label`/tooltip carry the real title,
  width ≈ 44 px, close button hidden (middle-click and menu still close).
- Drag constraints: pinned tabs may reorder only within the pinned group and unpinned only within
  the unpinned group — drops that cross the boundary clamp to the boundary (no silent data changes
  from a drag; pinning is an explicit action).
- Restore sorts pinned first at render time; persisted array order is untouched.

### 5. Shortcut folders — `workspace.js` + `app.js` + `index.html`

- `bookmarks[i].folder?: string` (additive); `sanitizeFolder` exported from `workspace.js`
  (trim, collapse spaces, ≤ 40 chars, bounded count of folders).
- Edit dialog gains a **Folder** input with a `<datalist>` of existing folders (create-by-typing).
- Home renders folder sections as native `<details>` (open by default), alphabetical, unfiled
  "Shortcuts" last; when no folders exist the DOM is identical to today (zero regression).
- The sort picker applies within sections.
- Drag-drop: cards become draggable (same short-press-vs-drag guard as the tab strip); section
  summaries + unfiled summary are drop targets with a highlight state; drop sets/clears `folder`.
- "Move to folder →" submenu lists folders + "Remove from folder".

### 6. Remote session improvements — `headless/server.mjs` + `public/runtime/headless-client.js`

Grounded in the research notes; the parts that touch the wire are confined to service + client:

- **Sharpness (first)**: client sends `dpr` in `hello`/`resize`; server computes
  `scale = clamp(1, min(dpr, sqrt(2.4e6/(w·h))), 2)`, creates the context with
  `deviceScaleFactor: scale`, and screencasts at `w·scale × h·scale`; default JPEG quality
  60 → 78 (`HEADLESS_QUALITY` stays authoritative); `hello-ok` echoes `scale` for diagnostics.
- **Remote-view menu** (client-local, since the runtime page is cross-origin): back, forward,
  reload, copy address, copy selected text, zoom in/out/reset, fullscreen, open with another
  engine (message to the shell → new tab on that engine). Reuses the menu styling tokens; no
  submenu needed.
- **Keyboard**: Meta→Control mapping at the server modifier layer; `compositionend` → new
  `insert-text` message → `page.keyboard.insertText` (CDP `Input.insertText`); canvas `paste`
  listener forwards clipboard text the same way; keydown while `isComposing` is ignored; canvas
  blur releases all held modifiers; Escape is not forwarded while `document.fullscreenElement`.
- **Copy**: server `copy-selection` evaluates `getSelection()` with an active-element fallback;
  the client writes it via `navigator.clipboard.writeText` in the menu gesture, honest toast on
  rejection. No clipboard permission is granted to remote pages.
- **Zoom**: CSS `transform: scale` + pan clamp, steps 1.2×, range 0.5–3, Ctrl/Cmd+wheel, menu reset,
  `aria-live` level announcements, and **all input coordinates divided by the zoom factor** before
  sending; panning only while zoom > 1.
- **Fullscreen**: `requestFullscreen()` from the menu on the canvas; the existing ResizeObserver
  drives the remote viewport resize.

### 7. Polish pass (better-ui checklist, scoped)

Press-scale `0.96` (150 ms, `:not(:disabled)`, reduced-motion/motion-off excluded) on menu items and
primary buttons; `overscroll-behavior: contain` on dialogs, library and menus; hover-only styling
under `@media (hover:hover)`; transitions name properties; icon `currentColor` reused from the
existing symbol set; forced-colors transparent borders under shadow rings.

## Data compatibility

Only additive fields (`folder`, `pinned`) with tolerant load/sanitize; no key, engine, relay,
export-format or storage-name changes; exports gain nothing new (folders ride along in bookmarks;
pinned tabs are session state, not exported).

## Testing gates

1. `tests/workspace.test.mjs`: `sanitizeFolder`, pinned/folder load tolerance, menu module bounds.
2. New `tests/browser/menus.spec.mjs`: pointer/keyboard/⋯ opens; navigation and ARIA; submenu;
   clamping in a short viewport; undo-restore; bulk confirms; pinned strip + restore + middle-click;
   folder sections + drag-drop + move submenu + edit dialog; default menus; long-press via touch
   pointer events; reduced-motion opacity-only; popover stacking inside the library dialog.
3. `tests/browser/proxy.spec.mjs` headless E2E additions: DPR capture active (`hello-ok` scale,
   canvas backing store), paste → `insert-text` into a remote input, copy-selection round-trip,
   zoom transform + coordinate mapping, fullscreen request/exit, remote-view menu actions.
4. Existing suites re-run per phase; final full deep three-browser matrix (existing WebKit alpha67
   skip stays; no new skips introduced).

## Phases

1. `menus.js` + shell surfaces + undo/confirm + tests.
2. Pinned tabs + drag constraints + tests.
3. Folders + drag-drop + tests.
4. Headless sharpness/keyboard/clipboard/zoom/fullscreen + remote menu + E2E.
5. Polish pass, README/help updates, full matrix, commit, push.

## Implementation and verification status (2026-10-16)

- Phases 1–4 are implemented; phase 5 includes help/README/service deployment documentation,
  desktop/mobile screenshot inspection, and the checks below. Implementation and review are complete;
  publication is commit/push plus a PR, with production deployment deferred by the user.
- `npm run check`: 9 Deno tests + 28 Node tests passed, with `deno check server.ts` passing.
- Final frozen-code deep matrix (`DEEP_PROXY_TESTS=1 npm run test:browser -- --browser=all`):
  **149 passed, one existing WebKit alpha67 skip, zero failures**, 150 cases total in 4.3 minutes.
  This includes menus, folder drag/drop, undo, pin order and reload, physical printable/Space keys,
  Shift-before-letter release, non-activating remote long-press, IME/paste, zoom, fullscreen,
  remote selection, cache-cookie preservation and interrupting uncommitted navigation.
- Earlier failed/partial runs are not used as release evidence. The final full run includes the
  stronger original Firefox sequence; no retry, widened test timeout or new skip was introduced.
- Fresh-context correctness and adversarial reviews found six concrete edge cases, all fixed and
  regression-tested. Both reviewers verified their fixes; no concrete residual blocker remained.
  The fresh-context documentation audit's four corrections were applied and verified. These are
  source/doc reviews, not production checks or machine-validated gstack audit receipts.
- Firefox cause identified: Playwright's COOP-triggered browsing-context replacement reused a
  process-scoped automation channel ID, allowing stale message replies to hide navigation or JS
  context creation. Upstream [#42731](https://github.com/microsoft/playwright/issues/42731)
  documents the mechanism and 1.64 fix. The same hang reproduced on the old shell with real headers;
  stripping only COOP removed it, and restoring that header brought it back. Early HTML bisects
  were invalid because intercepted responses accidentally dropped security headers.
- Upgraded pinned Playwright/tooling and service package to 1.64.1. No application headers or
  Firefox security preferences changed. The original diagnostic passed 10/10; the restored full
  browse→pin→middle-close→pin→reload→real-menu sequence and live-runtime reload regression then
  passed **20/20** (10 each). Both are now mandatory suite tests, not opt-in probes or skips.
- Native platform IME, actual clipboard permissions and physical touchscreen behavior still need
  real-device checks. Automated paste/composition tests dispatch events; clipboard write is stubbed
  locally while the remote selection round-trip is real. Firefox DPR is explicitly reported as 2
  in the test because its automation scale-factor setting is inconsistent.
- Remote production container/Caddy deployment has not been performed or verified. The shell and
  service must both receive the new files; a frontend push alone is not a remote-service upgrade.
- Integrated upstream `2e68aa6` CloudFront deployment/live-check corrections, preserving its lean
  Debian Node image and Chromium-headless-shell install. The new helper/menu/CSS assets are included.
- Production verification needs `LIVE_SITE_PASSWORD`; service deployment needs access to the relay
  host. Neither is configured in this session (no password env, AWS CLI or SSH host alias). Do not
  claim that committing/pushing code rebuilds the running service container.
- User selected **Push and prepare PR** rather than providing production access. Keep the service
  container rebuild and password-gated live verification explicitly pending; do not merge/deploy
  as a side effect of creating the PR.
- Post-publication CI at `284a3e3` failed: Firefox/WebKit jobs lacked Chromium for the remote service;
  Chromium also exposed a remote selection-copy failure. CI installation now includes Chromium in
  both compatibility lanes, with unique artifact names. A forced input-release regression observed
  three unheld mouse-up events (`ups:3`, expected `ups:0`); held-button tracking fixes that proven
  defect, including an assertion that an actually-held button still releases exactly once.
  All nine targeted remote cases pass locally across three browsers. Linux clipboard diagnostics
  are retained and the updated CI result must be checked; the earlier local matrix is not proof
  that the Linux clipboard failure is resolved.

### Evidence-backed adjustments to the original remote plan

- Screencast dimensions are checked from JPEG headers; CSS-sized CDP output switches to a bounded
  device-scale screenshot fallback. Immediate CDP ACKs are not client-paint backpressure; socket
  caps and latest-frame decoding bound transport/client work separately.
- Composition and paste use a focusable hidden textarea, not a bare canvas. Shortcut accelerator
  mapping follows the **server OS**, including macOS development and Linux production.
- Fullscreen targets the view container so zoom scrollbars remain available. The outer shell iframe
  grants fullscreen and clipboard-write; no clipboard-read permission is granted to remote sites.
- Open-with-engine uses a single submenu and a token/origin-validated shell message. Copy may lose
  transient activation during the asynchronous selection round-trip and reports failure honestly.

## Honest limits

Browser-reserved combos (Ctrl/Cmd+T, +W, +N…) can never reach the remote page — documented in the
help dialog, not hidden. Zoomed views soften beyond capture scale; copy from remote pages is
best-effort with an honest failure notice. No new transport/dependency; no filtering/monitoring
claims. Clipboard read permission is never granted to remote pages.
