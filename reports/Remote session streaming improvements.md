# Remote session streaming: implementation and evidence

The implementation retains JPEG-over-WebSocket transport. It prioritizes readable
text, bounds memory and capture work, and keeps local browser controls separate
from destination-page input. It adds no clipboard-read permission to remote sites.

## Evidence and its limits

The three files in `research_notes/Remote session streaming improvements/` are
historical preimplementation notes, not verified descriptions of the final code.
This synthesis corrects their assumptions using inspected implementation,
the official CDP schema and MDN references. The earlier research pass successfully
fetched the official upstream JSON schema and MDN pages; the CDP method-page URLs
returned redirect stubs, so the JSON schema was the protocol reference.

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| [Capture helpers](../headless/helpers.mjs), [service](../headless/server.mjs) | Requested budgets, actual JPEG checks and fallback logic | Production throughput or text-quality measurements |
| [Client](../public/runtime/headless-client.js) | Input lifecycle, local zoom, fullscreen and clipboard behavior | Physical-device IME or clipboard permission success |
| [Browser regressions](../tests/browser/proxy.spec.mjs) | Executable service/client integration cases | A test pass until the parent actually runs them |
| [Official CDP schema](https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/browser_protocol.json) | Screencast, input and device-metrics protocol contracts | Guaranteed physical-pixel screencast output |
| MDN [fullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) and [clipboard](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) | User activation, iframe policy and permission constraints | Uniform cross-browser acceptance |

The implementation plan records executed checks. This report is source/protocol
analysis, not an independent production deployment or performance benchmark.

## Capture resolution is checked, not assumed

The client reports CSS viewport dimensions and DPR clamped to 1–2. `captureSize`
fits the viewport and derives a scale bounded by pixel area and maximum dimension.
The service creates its context with that scale and updates device metrics on
resize. JPEG quality defaults to **78**; `HEADLESS_QUALITY` remains authoritative,
bounded to 0–100. There is no per-client quality override.

CDP screencast maximum dimensions are ceilings, not promises of physical-pixel
output. The service reads dimensions from each JPEG. If an axis is more than two
pixels below the requested target, that session switches to serialized device-scale
screenshots. The fallback waits 150 ms after each completed attempt: roughly 6.7
captures/second is a theoretical ceiling before capture overhead, not a guarantee.

Every screencast event is acknowledged immediately, including dropped frames.
That is **producer acknowledgment, not client-painted backpressure**. Socket
buffer caps and the client's one-active/one-newest-pending decoder bound separate
queues. Decoded ImageBitmaps are closed, including stale and failed-paint cases.
The current upstream schema includes newer in-flight options; the implementation
does not depend on them or assume exactly one unacknowledged frame.

## Physical keys and committed text have different paths

Physical keys, including printable characters and Space, use keyboard down/up so
destination shortcut handlers and native button activation continue to work.
Local insertion is prevented for replayed physical keys, avoiding duplicate text.
The client tracks physical `event.code` and retains the original forwarded key,
so releasing Shift before releasing a letter still sends the matching keyup.

A focusable, nearly invisible textarea handles IME composition, paste and virtual
keyboard input. Those committed strings use `insert-text`; composition-state and
commit-deduplication checks avoid inserting the same commit twice. This does not
reproduce destination-side candidate-window UI or rich clipboard formats.

Ctrl/Cmd map to the **server OS** accelerator: Meta on macOS, Control elsewhere.
Source-modifier tracking avoids releasing a mapped modifier still held by another
source. Blur, cancellation, menu opening and teardown release held input.
Native macOS Control-specific actions and non-US/AltGr layouts remain compatibility
limits. Browser-reserved window/tab shortcuts stay local; transparent forwarding
of Ctrl/Cmd+T/W/N is not promised.

Touch/pen mouse-down is deferred until a short tap is established or movement
crosses the drag threshold. A long-press opens local actions without completing a
remote click. Navigation starts in receive order but does not occupy the serialized
input lane while waiting for a document to commit; replacement navigation can
interrupt an unresponsive request. Superseded navigation errors are not reported
as failures of the current request.

## Zoom, fullscreen and copy remain local, permission-bound controls

View zoom ranges from **0.5× to 3×**, in 1.2× steps, with reset and status
announcements. Overflow scrollbars pan the enlarged canvas. Ordinary dragging
still targets the destination, rather than becoming a hidden pan gesture.
Coordinates use transformed bounds and the remote CSS viewport ratio; wheel
deltas normalize their mode and divide by zoom. Zoom cannot invent image detail.

Fullscreen targets the view container so input, menus and scrollbars remain
available. Permission belongs to the shell's **outer runtime iframe**, not the
hidden inner website iframe. Fullscreen changes resize the remote viewport;
fullscreen Escape stays local. Denials produce an explicit notice.

Paste reads a user-triggered event, never clipboard polling. Copy requests the
main document's selection or focused input selection (excluding passwords), then
attempts local `writeText`. Transient activation may expire during that remote
round-trip; failures are reported honestly. Nested-frame selection, rich clipboard
synchronization and a dedicated cut operation are not implemented.

## Resource budgets and deployment

| Resource | Bound/default |
| --- | --- |
| Capture | 2,400,000 pixels; 2,400 pixels per axis; DPR 1–2 |
| JPEG quality | 78 by default, operator override 0–100 |
| Socket buffer | 4 MiB |
| Input queue | 128 messages; consecutive moves/resizes coalesced |
| Control payload | 128 KiB |
| Text insertion/selection | 65,536 characters |
| Local zoom | 50–300%, not persisted |

The helper reserves rounding headroom for scaled captures. These limits bound
work; they do not promise a particular bandwidth, latency or frame rate.

Deploy service and client together, including `helpers.mjs`, `menus.js` and
`workspace.css`. The [service guide](../headless/README.md) defines the flat Docker
context, CloudFront/Caddy paths, deliberate container replacement and rollback.
A frontend push does not replace an existing service container.

Authentication for direct service admission and DNS-aware private-network egress
protection remain preexisting production gaps. Origin allowlists and the shell
password gate are not substitutes. Do not describe the service as hardened public
isolation or as preventing monitoring/filtering.
