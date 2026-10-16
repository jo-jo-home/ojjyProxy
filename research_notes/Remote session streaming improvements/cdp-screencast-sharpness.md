# CDP screencast sharpness — grounded notes

Sources: `playwright-core@1.58` bundled CDP definitions (`node_modules/playwright-core/types/protocol.d.ts`,
generated from the official DevTools Protocol tip), the official CDP docs at
chromedevtools.github.io/devtools-protocol (upstream of those definitions), and our shipped
implementation in `headless/server.mjs` + `public/runtime/headless-client.js`.
Subagent research round failed on infrastructure; grounding was done locally against these files.

## Exact protocol shapes (verified in protocol.d.ts)

`Page.startScreencast` parameters:

- `format?: "jpeg" | "png"` — compression format.
- `quality?: number` — "Compression quality from range [0..100]" (jpeg).
- `maxWidth?`, `maxHeight?: number` — maximum screenshot dimensions (frames are clamped, not letterboxed).
- `everyNthFrame?: number` — send every n-th frame.

`Page.screencastFrame` event payload: `data` (base64 image), `metadata` (`ScreencastFrameMetadata`),
`sessionId` (frame number). **Ack is mandatory**: `Page.screencastFrameAck {sessionId}` — Chromium
throttles/pauses new frames until the previous one is acknowledged, which makes the ack the natural
backpressure channel.

## Our current state

- Context: `browser.newContext({ viewport: {width,height}, deviceScaleFactor: 1 })` — CSS-pixel
  rendering; frames are 1:1 with client CSS pixels, so every high-DPI client gets upscaled blur.
- `startScreencast`: `format:"jpeg", quality: HEADLESS_QUALITY (default 60), maxWidth/maxHeight`
  clamped to 320–1600 (`FRAME_CAP = 1600`), `everyNthFrame: 1`.
- Client: canvas backing store already set to each frame's natural size (`canvas.width = bitmap.width`),
  CSS `position:fixed; inset:0; width:100%; height:100%` — the compositor does the final scale. This
  part is correct; the softness comes from low capture resolution + quality 60.

## Recommendations (implementation-ready)

1. **DPR-aware capture.** Client sends `dpr` in `hello`/`resize` (clamped 1–2, from
   `window.devicePixelRatio`). Server derives an effective scale under a **pixel budget** so school
   bandwidth is bounded: `scale = clamp(1, min(dpr, sqrt(MAX_PIXELS/(w*h))), 2)` with
   `MAX_PIXELS ≈ 2.4M` (≈1920×1250). Context is created with `deviceScaleFactor: scale` and
   screencast `maxWidth/maxHeight = w*scale, h*scale`. Playwright's `newContext({deviceScaleFactor})`
   is the supported way to render at physical resolution.
2. **Raise default JPEG quality 60 → 78** (text legibility threshold is ~q70; UI text at q60 shows
   visible ringing). Keep the operator env authoritative (`HEADLESS_QUALITY`), allow a per-hello
   `quality` clamp 40–90 only if it fits; do not exceed 90 (diminishing returns, large frames).
3. **Keep jpeg, not png** — PNG screenshots are lossless but 5–20× larger; wrong tradeoff for a
   school network.
4. **Ack pacing stays per-frame** (`everyNthFrame: 1`, ack immediately) — the ack flow already
   provides backpressure; do not buffer multiple frames before acking on slow links.
5. **Resize** must restart `startScreencast` (already does) and recompute the effective scale.
6. **Zoom interaction**: client-side zoom is CSS-only (see zoom notes); zoomed-in views benefit from
   the DPR capture above. Optional future: bump capture scale while zoomed >1 (not in this pass).

## Version notes

- All field names verified against the protocol definitions shipped with `playwright-core@1.58`
  (current as of 2026). No undocumented parameters are relied on.

## Not verified

- Real bandwidth numbers on a school network (no hardware in this environment).
- Behavior when `deviceScaleFactor` exceeds 2 on very large viewports (explicitly clamped out).
