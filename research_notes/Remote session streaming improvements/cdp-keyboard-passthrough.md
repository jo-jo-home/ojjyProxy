# CDP keyboard passthrough — grounded notes

Sources: `playwright-core@1.58` bundled CDP definitions (`protocol.d.ts`), Puppeteer/Playwright
keyboard implementations as the canonical dispatchKeyEvent wrappers, our shipped server
(`headless/server.mjs` handlers.key) and client (`public/runtime/headless-client.js`).
Subagent research round failed on infrastructure; grounding was done locally.

## Exact protocol shapes (verified in protocol.d.ts)

`Input.dispatchKeyEvent` parameters:

- `type: "keyDown" | "keyUp" | "rawKeyDown" | "char"`
- `modifiers?: number` — **bitmask: Alt=1, Ctrl=2, Meta/Command=4, Shift=8**
- `timestamp?`, `text?` (layout-generated text; not needed for `keyUp`/`rawKeyDown`),
  `unmodifiedText?` (shortcut handling), `keyIdentifier?`, `code?`, `key?` (DOM key string),
  `windowsVirtualKeyCode?`, `nativeVirtualKeyCode?`, `autoRepeat?`, `isKeypad?`, `isSystemKey?`,
  `location?` (1=Left, 2=Right), `commands?: string[]` (editing commands like `selectAll`).

`Input.insertText { text }` — "emulates inserting text that doesn't come from a key press, for
example an emoji keyboard or an IME."

## What we already have (and why it mostly works)

The server uses **Playwright's Keyboard API** (`page.keyboard.press/down/up`), which wraps
dispatchKeyEvent and **tracks modifier state internally**: after `keyboard.down("Control")`, a
`keyboard.down("c")` correctly carries the Ctrl modifier. The client forwards raw
`KeyboardEvent.key` for down/up. Single printable chars without Ctrl/Meta use `press()`; combos use
explicit down/up pairs with server-side modifier tracking. This is sound.

## Gaps and implementation-ready recommendations

1. **IME / dead-key / emoji composition**: local composition produces `key === "Process"` events.
   Client: listen for `compositionend` on the canvas and send the composed string via a new
   `insert-text` message; server maps it to `page.keyboard.insertText` (the exact CDP
   `Input.insertText`). Ignore `keydown` while `event.isComposing` to avoid double text.
2. **Paste into the remote page**: the canvas `paste` event (fired by the local browser's Ctrl/Cmd+V
   since the canvas has focus) carries `clipboardData`. Forward it as `insert-text`. This makes
   paste work even where key-level replay of Ctrl+V is flaky.
3. **Copy from the remote page**: add a server handler that evaluates
   `window.getSelection().toString()` (plus a fallback to the active element's value/selectionStart)
   and returns it; the client writes it with `navigator.clipboard.writeText` inside the user
   gesture of the menu-item click. Firefox requires user activation — the menu click provides it.
   If `writeText` rejects (focus quirks), fail honestly with a toast, never with silent success.
4. **Meta→Ctrl mapping**: the remote Chromium is Linux; web shortcuts are Ctrl-based. Map local
   Meta (Cmd on Mac clients) to Control at the server modifier layer for the remote page, keeping
   Shift intact. This mirrors noVNC/Guacamole's OS-key translation. The local shell keeps seeing the
   real Meta for its own shortcuts.
5. **Modifier hygiene on blur**: when the canvas loses focus, the client must send `keyup` for every
   modifier it currently holds (track locally), or the remote page keeps a stuck Ctrl. Also clear
   server-side `session.modifiers` on client disconnect (already deleted implicitly via session end,
   but blur handling is new).
6. **Reserved combos stay local, honestly documented**: Ctrl/Cmd+T, +W, +N, Shift+Q etc. are
   consumed by the *local* browser before the page ever sees them — they cannot be forwarded, and
   the help text must say so. The panic key remains a document-level listener in the shell and keeps
   working because canvas keydown events still bubble.
7. **Key repeat**: local auto-repeat arrives as repeated keydowns and is forwarded as repeated
   events; acceptable. (Playwright's public API does not expose `autoRepeat`; noted as a limitation,
   not a blocker.)
8. **Browser-level shortcuts in the remote Chromium**: dispatched Ctrl+T would target the remote
   Chromium's tab strip. We never forward browser-level combos (only page-visible keys arrive),
   and the remote context runs a single page per session, so this is out of scope by construction.

## Not verified

- Dead-key input on non-US hardware layouts (no physical hardware here) — the compositionend
  path is the standard mitigation; flagged for feel-check.
- Behavior of `commands: ["selectAll"]` editing-command routing (not used; `insertText` chosen).
