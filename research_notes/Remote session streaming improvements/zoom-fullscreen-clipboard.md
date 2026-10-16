# Zoom, fullscreen and clipboard for the streamed view — grounded notes

Sources: `playwright-core@1.58` bundled CDP definitions (Input.insertText; Browser.grantPermissions
permission names as shipped), MDN Fullscreen/Clipboard/Canvas behavior as of 2026, noVNC/KasmVNC
client patterns, and our shipped client (`public/runtime/headless-client.js`) and shell
(`public/runtime/index.html` iframe attributes). Subagent research round failed on infrastructure;
grounding was done locally.

## Zoom

- **Mechanism**: CSS-only. Wrap or transform the canvas: `transform: scale(z)` with
  `transform-origin: 0 0`, plus a translate offset for panning while z > 1. The canvas backing store
  already equals each frame's natural size, so scaling stays compositor-side (no repaint cost).
- **Coordinate mapping is the critical part**: every input message must divide by the zoom factor
  before sending: remoteX = (clientX - canvasRect.left) / z; same for y. Wheel deltas likewise
  (dividing by z keeps scroll speed feeling constant). Pan offset subtracts after the divide.
- **Controls**: menu items (zoom in/out/reset), Ctrl/Cmd+wheel over the canvas, step 1.2×,
  limits 0.5–3, reset on double-... no — reset via menu item only, to avoid accidental data gestures.
  Announce level changes via `aria-live="polite"` status text (e.g. "150%") so zoom is never a
  motion-only cue. No transition on zoom (view-only state; instant is correct under reduced-motion
  rules and cheap for everyone).
- **Panning while zoomed**: drag with pointer capture only when z > 1 and no modifier; clamp pan to
  the overflowed bounds. Zoom <= 1 disables panning entirely so normal clicks never fight it.

## Fullscreen

- The runtime iframe already carries `allow="fullscreen; clipboard-read; clipboard-write"` and
  `allowfullscreen` in `public/runtime/index.html` — no parent changes needed.
- Client: `canvas.requestFullscreen()` from a menu-item click (user activation present). Listen for
  `fullscreenchange` and exit; the existing ResizeObserver on `document.documentElement` already
  drives the `resize` message, and fullscreen changes the element size, so the remote viewport
  follows automatically.
- Browser support in 2026: unprefixed `requestFullscreen` works in Chromium, Firefox and WebKit for
  elements inside allow-listed cross-origin iframes. Escape exits fullscreen natively before it
  reaches the page — the shell must not also treat that Escape as "show controls" (guard by
  `document.fullscreenElement`).
- `fullscreenElement` check also gates keyboard passthrough: while fullscreen, Escape belongs to the
  browser (exits fullscreen), so do not forward it.

## Clipboard

- **Local → remote (paste)**: canvas `paste` listener reads `event.clipboardData`, forwarded as
  `insert-text` → CDP `Input.insertText`. Reliable, permissionless, works with multi-line text.
- **Remote → local (copy/cut)**: server evaluates `window.getSelection().toString()` with a
  fallback to the focused input's selected value; the client writes the result with
  `navigator.clipboard.writeText` inside the click gesture. The iframe's `clipboard-write` allow
  covers Chromium; Firefox needs the gesture (menu click) and document focus — if `writeText`
  rejects, show an honest failure toast.
- **Do not grant remote pages clipboard-read.** Playwright's
  `context.grantPermissions(['clipboard-read', ...])` exists (confirmed in the shipped types), but
  granting remote websites read access to the *visitor's* clipboard is a privacy decision we do not
  make for them. Not granted; not advertised.
- **Cut**: same as copy server-side (selection read), then send a `delete` keydown to remove the
  selection in editable contexts. Best-effort; noted.

## Latency/bandwidth

- Client-side zoom costs nothing on the wire. Sharpness while zoomed-in improves with the DPR-aware
  capture described in the screencast notes (single change, both benefit).
- No new transport, no WebRTC, no dependencies added.

## Not verified

- Fullscreen on WebKit with the current allow attribute inside the deployed cross-origin runtime
  (test asserts request/exit locally; production WebKit iPad behavior flagged).
- Multi-line paste fidelity into `contentEditable` rich editors (covered by an E2E text-area case
  only).
