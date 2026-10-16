# Context menus and workspace features — interview-backed spec

Interview rounds: 2 (scope/behavior, then defaults/headless/folders/pins/submenus).
All answers below are the user's explicit decisions; anything unasked is delegated to
implementation judgment consistent with prior specs (reversible previews, honest notices,
no relay/engine behavior changes, saved data stays compatible).

## Objective

Add a full context-menu layer to every surface plus a default fallback menu, pinned tabs,
shortcut folders with drag-drop, undo-safe deletion, general UI/UX polish, and detailed
remote-session (headless) improvements — image sharpness first. Plan first, then implement.

## Decisions from the interviews

- **Surfaces**: menus on everything — shortcut cards, browser tabs, bookmarks, history rows,
  collections, and a **default fallback menu** for surfaces without a specific one.
- **Shortcut menu**: all of open, open in new tab, edit, favorite/unfavorite, copy address,
  remove with undo — "and even more": open with engine (submenu), move to folder (submenu).
- **Touch**: **long-press opens the menu** plus a small visible **⋯ affordance** on shortcut
  cards (corner, visible on hover/focus) so it is discoverable without right-click.
- **Extra features**: pinned tabs, shortcut folders, close-others/close-to-the-right, plus
  general UI **and** UX improvements and **headless engine improvements**.
- **Destructive safety (delegated)**: single deletions act instantly with an **undo toast**
  (~6 s); genuinely bulk actions (close others, close to the right, remove a collection) use a
  **confirmation dialog**.
- **Default fallback menu**: navigation + tools (back, forward, reload, home, new tab, settings),
  context-aware — browsing actions on the browser page, workspace actions on home.
- **Headless priorities**: all listed improvements, **image sharpness first**; also remote-view
  context menu, keyboard passthrough, zoom and fullscreen.
- **Folders**: named sections on home **with drag-drop** — drag a shortcut card onto a section
  header to move it.
- **Pinned tabs**: **icon-only strip** at the tabstrip's start, Chrome-style.
- **Submenus**: exactly **one level** where it earns its place (engine picker, move-to-folder).

## Context menu system

### Behavior

- Opens on `contextmenu` at pointer position, clamped inside the viewport with a small margin.
- Keyboard: Menu key / Shift+F10 on a focused card, tab or row opens the same menu anchored to
  the element. Arrow keys move between items, Enter/Space activates, Escape closes (restoring
  focus to the trigger), Home/End jump, Right-arrow opens a submenu item, Left/Escape closes it.
- Outside pointerdown, window blur and scroll close it. Only one menu exists at a time.
- ARIA: `role="menu"`, items `role="menuitem"`, disabled items `aria-disabled`, submenu items
  `aria-haspopup`/`aria-expanded`. Focus starts on the menu for pointer opens, on the first
  item for keyboard opens.
- `aria-haspopup` and touch: long-press (≈500 ms pointer hold with movement tolerance) opens the
  menu on coarse pointers. A visible **⋯ button** sits on shortcut cards and library rows.
- The menu never renders disabled actions that are impossible (e.g. Back with no history); those
  rows are shown disabled with a clear reason via `title`, matching the existing button states.

### Surfaces and actions

| Surface | Actions |
| --- | --- |
| Shortcut card | Open · Open in new tab · Open with engine → (submenu) · Edit shortcut · Favorite/Unfavorite · Copy address · Move to folder → (submenu) · Remove (undo) |
| Browser tab | New tab to the right · Duplicate · Pin/Unpin · Close · Close others · Close to the right · Reopen closed tab |
| Bookmark row | Open · Open in new tab · Open with engine → · Edit · Favorite/Unfavorite · Copy address · Remove (undo) |
| History row | Open · Open in new tab · Copy address · Remove entry (undo) · Clear this day (confirm) |
| Collection entry | Open all (lazy, existing semantics) · Rename · Copy addresses · Remove (confirm) |
| Remote-session canvas | Back · Forward · Reload · Copy address · Zoom in/out/reset · Fullscreen · Open with another engine → (submenu) |
| Default (home background / chrome) | Browsing: Back · Forward · Reload · Home · New tab · Settings. Home: New tab · Backgrounds · Customize · Connection log · Panic exit |

### Motion and styling (animate + better-ui rules)

- Menus are occasional interactions (tens/day): standard animation tier, **150–200 ms**.
- Entrance: opacity 0→1 plus `scale(0.96→1)` from a transform-origin placed at the trigger or
  pointer, easing `cubic-bezier(0.23, 1, 0.32, 1)` (the existing `--ease-out` token). Exit: the
  same properties in reverse at **≤120 ms**, or instant removal where motion adds nothing —
  menus close often and must feel immediate.
- Transitions (not keyframes) drive open/close so rapid reopen retargets instead of replaying.
- `prefers-reduced-motion: reduce`: opacity-only cross-fade (125 ms), no scale; motion settings
  "subtle"/"off" and performance mode reuse the existing token-driven behavior.
- Elevation via layered `box-shadow` (existing shadow tokens), **no decorative border**; keep a
  `1px solid transparent` border so forced-colors mode still draws an edge.
- Menu items: `currentColor` icons matching adjacent text weight, hover only under
  `@media (hover:hover)`, pressed feedback `scale(0.96)` over 150 ms `ease-out` gated by
  reduced-motion, and a static selected/checked cue (check icon for toggles like Favorite)
  so state is never motion-only.
- `overscroll-behavior: contain` on the menu and all existing dialogs.

## Pinned tabs

- Tab records gain an optional `pinned` flag; unknown fields stay tolerated on load.
- Pinned tabs sort to the strip's start in their own order group; icon-only width with the site
  favicon or engine glyph plus a tooltip and accessible label; no title text.
- Middle-click still closes a pinned tab; the context menu shows Unpin; drag reorder stays
  within the pinned group (crossing into unpinned unpins via an explicit action only, to avoid
  accidental data changes during drags).
- Restore keeps pinned tabs first; session restore order is otherwise unchanged.

## Shortcut folders

- Bookmarks gain an optional `folder` string (sanitized, bounded length, unique-cased).
- Home renders folders as collapsible sections (native `details`, keyboard-usable, consistent
  with settings galleries), alphabetical, unfiled shortcuts last.
- Assignment: folder field in the edit dialog, "Move to folder →" submenu, and **drag-drop** —
  dragging a card onto a section header moves it (same short-press-vs-drag logic as the tab
  strip). Dropping on the unfiled section clears the folder.
- Sorting (favourites/recent/A–Z) applies within sections; the sort picker stays.

## Undo and bulk safety

- Single removals (shortcut, bookmark, history entry) remove instantly and show an undo toast
  (~6 s) that restores the record exactly (same id/fields). Undo restores focus sensibly.
- Tab close already has reopen; the menu surfaces it and pinned tabs interact with it normally.
- Bulk actions (close others, close to the right, clear day, remove collection) open the
  existing reduced-motion-aware confirm dialog with explicit counts.

## Remote-session (headless) improvements

Sharpness first, then the rest. Grounded by a research pass before implementation:

1. **Image sharpness**: capture at device-pixel-ratio-aware dimensions instead of CSS-pixel
   clipping; raise default JPEG quality; set the canvas backing store to the frame's natural
   size so downscale is done by the compositor once. Optional per-user quality setting
   (Connection category) if it stays simple; operator env stays authoritative.
2. **Remote-view context menu**: the standard menu system on the canvas with the actions above;
   the menu itself is local chrome — it never leaks the neutral-naming surface.
3. **Keyboard passthrough**: physical keydown/up, supported page shortcuts and layout-aware
   text entry while the remote view has focus, except the panic key and local fullscreen Escape.
   The original request included Ctrl/Cmd+T/W, but that requirement is superseded: browser-reserved
   window/tab shortcuts cannot reliably be captured and stay local. Paste/IME/mobile text use
   committed text insertion; Help explains these limits rather than promising full passthrough.
4. **Zoom & fullscreen**: Ctrl+wheel and menu-driven zoom on the remote view with a reset;
   Fullscreen API on the view container. Zoom is view-only state, never persisted.
5. No protocol changes to the relay; wire changes are confined to headless service + client.

## General UI/UX polish pass

- Apply the better-ui checklist across the shell: press-scale opt-outs where motion distracts,
  transition-property naming, hover gating, shadow/border audit, icon stroke/text-weight match,
  `overscroll-behavior` on overlays, image outlines where content images appear.
- UX: menus make destructive paths reversible; every menu action also reachable without a
  pointer; nothing frequent gains motion.

## Non-goals

- No engine/relay/protocol changes, no vendor patches, no new external requests or CDNs.
- No claim that any of this changes filtering, monitoring, or isolation.
- No data migration that breaks the persisted `ojjyproxy-app-v1` shape — only additive fields
  (`folder`, `pinned`) with tolerant load/sanitize.
- Collections stay URL+engine descriptors, not cookie profiles.

## Testing contract

- Unit: folder/pin sanitize + defaults; menu registry action IDs bounded.
- Browser (all three engines): open by pointer/keyboard/touch long-press; arrow/Enter/Escape
  navigation; submenu open/close; clamping inside small viewports; undo toast restore;
  pinned tab strip layout + restore; folder sections + drag-drop move; remote-view menu and
  passthrough on the headless E2E; reduced-motion/static-ancestor behavior; no regression to
  the existing 99-test suite (one known WebKit alpha67 skip stays).
- README/help updated to describe menus, pins, folders, undo and remote-view controls.

Implementation proceeds in phases (menu system → surfaces → pins/folders/undo → headless →
polish), each gated by targeted tests before the full deep matrix, then commit and push.
