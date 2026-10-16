# ojjyProxy headless engine service

Remote browser isolation for ojjyProxy: a Node service that drives a
server-side headless Chromium and streams it to the browser as a live pixel
stream. The client never contacts destinations — this service does — and page
content crosses the network as JPEG frames, which URL- and content-keyword
filters (school proxies) cannot read the way they read rewritten HTML.

This service is also the remote-session engine's **runtime origin**: it serves the
runtime page (`/runtime/index.html`), its config, and the client module, and
accepts the engine's WebSocket at `/session/`.

## Run locally

```sh
HEADLESS_SERVICE=1 npm run dev      # dev stack + headless service on :9100
```

The engine appears in Settings → Engine & version as **Remote session
(isolation)**. It needs Playwright's Chromium:

```sh
npx playwright install chromium
```

## Environment

| variable | default | meaning |
|---|---|---|
| `HEADLESS_PORT` | `9100` | HTTP + WebSocket port (binds per `HEADLESS_HOST`) |
| `HEADLESS_HOST` | `127.0.0.1` | bind address; use `0.0.0.0` inside Docker |
| `HEADLESS_PARENT` | — | **required**: the ojjyProxy shell origin allowed to embed this runtime page |
| `HEADLESS_SELF` | — | this service's public origin (WebSocket allowlist default) |
| `HEADLESS_ORIGINS` | `HEADLESS_SELF` | exact WebSocket origins allowed |
| `HEADLESS_TOKEN` | — | optional shared secret the client must send in `hello` |
| `HEADLESS_MAX_SESSIONS` | `2` | concurrent isolated browser contexts |
| `HEADLESS_IDLE_MS` | `120000` | close sessions idle this long |
| `HEADLESS_MAX_AGE_MS` | `1800000` | hard session age cap |
| `HEADLESS_QUALITY` | `78` | operator-authoritative JPEG quality (0–100) |

## Deploy on the relay host (EC2 + Caddy + CloudFront)

The service sits next to the Wisp relay and rides the same domain, TLS and
CloudFront distribution — no new DNS or CDN work.

```sh
# 2 GiB swap keeps Chromium comfortable on a 1 GiB instance
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile &&
  sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

mkdir -p /opt/ojjyproxy-headless
# copy headless/server.mjs, headless/guards.mjs, headless/helpers.mjs, headless/package.json and
# the runtime files (public/runtime/*, public/shared.js, public/menus.js,
# public/workspace.css) into
# /opt/ojjyproxy-headless/ using this flat build-context layout:
# server.mjs, guards.mjs, helpers.mjs, package.json,
# runtime/ (contents of public/runtime/), shared.js, menus.js, workspace.css.
# Do not nest these under headless/ or public/ in the build context.
cat > /opt/ojjyproxy-headless/Dockerfile <<'EOF'
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npx playwright-core install --with-deps chromium-headless-shell && rm -rf /root/.npm
COPY server.mjs guards.mjs helpers.mjs ./
COPY runtime ./runtime
COPY shared.js ./shared.js
COPY menus.js workspace.css ./
ENV HEADLESS_HOST=0.0.0.0
EXPOSE 9100
CMD ["node", "server.mjs"]
EOF
cd /opt/ojjyproxy-headless && sudo docker build -t ojjyproxy-headless .
sudo docker run -d --name ojjyproxy-headless --restart unless-stopped \
  -p 127.0.0.1:9100:9100 \
  -e HEADLESS_PARENT=https://ojjyproxy.ojjy.deno.net \
  -e HEADLESS_SELF=https://d11zfagyzg18az.cloudfront.net \
  -e HEADLESS_ORIGINS=https://d11zfagyzg18az.cloudfront.net \
  ojjyproxy-headless
```

Then extend the Caddy site (same file that locks the relay behind the origin
secret) so these paths proxy to `127.0.0.1:9100` instead of the relay, still
requiring the `X-Ojjy-Origin-Secret` header CloudFront adds:

```
@remote {
    path /runtime/* /shared.js /workspace.css /session /session/*
    header X-Ojjy-Origin-Secret <your-origin-secret>
}
handle @remote { reverse_proxy 127.0.0.1:9100 }
```

Validate and reload (`caddy validate`, then `caddy reload`) for Caddy config
changes. Code/image changes instead require replacing the service container;
restarting an old container does not load a newly built image. CloudFront needs no change: the default
behavior already forwards every path and supports WebSocket upgrades.

### Upgrade an existing service

Retain the existing deployment's environment, resource limits, loopback binding
and restart policy from its trusted configuration. The example above is for
first installation, not a substitute for operator-specific settings. Build the
new image before stopping the running service.

Stop the existing container and rename it to a unique backup name; keep it for
rollback. Rerun the deployment's original `docker run` command with the new image
and retained settings. The old name must be free before creating the replacement.
This causes a brief outage and disconnects active remote sessions.

Check local `/health`, browser-facing `/runtime/headless-helpers.mjs`,
`/runtime/menus.js` and `/workspace.css`, then verify actual canvas output and
navigation through CloudFront. If verification fails, stop and remove **only
the failed replacement**, rename the retained old container back to its original
name and start it. Remove the backup only after successful verification and an
operator-approved rollback window.

Finally, register the engine on the website: add the origin to
`RUNTIME_ORIGINS` on the outer Deno app and redeploy:

```json
{
  "sj-1.1.0": "https://ojjyproxy-stable.ojjy.deno.net",
  "sj-2.0.0-alpha": "https://ojjyproxy-alpha0.ojjy.deno.net",
  "sj-2.0.2-alpha": "https://ojjyproxy-alpha2.ojjy.deno.net",
  "sj-2.0.67-alpha.2": "https://ojjyproxy-alpha67.ojjy.deno.net",
  "uv-3.2.10": "https://ojjyproxy-uv.ojjy.deno.net",
  "headless": "https://d11zfagyzg18az.cloudfront.net"
}
```

Use the browser-facing CloudFront origin in both places, not the DuckDNS
origin locked behind CloudFront's secret header. The WebSocket `Origin` is
the runtime iframe's origin, not the parent Deno shell's origin. Merely seeing
the engine in the menu does not verify this configuration: select it and load
an HTTPS page, then confirm that the remote canvas paints and navigation works.

The origin allowlist is not user authentication (non-browser clients can forge
it). The shell password gate does not authenticate direct headless connections.
Do not treat this deployment as a hardened public browser service; authenticated
session admission and DNS-aware private-network egress protection remain needed.

## Protocol

JSON text frames for control, binary frames (`0x01` + JPEG bytes) for pixels.
Client → `hello{width,height,dpr,blocked}`, `navigate{url}`, `back`, `forward`,
`reload`, `clear-cache`, `mouse{action,x,y,button,clickCount}`, `wheel`,
`key{action,key}`, `resize{width,height,dpr}`, `release-input`,
`insert-text{text}`, `copy-selection{id}`, `inspect`, `ping`. Server → `hello-ok`,
`navigating{url}`, `loaded{url,title}`, `popup{url}`, `links{links}`,
`error{message}`, `cache-cleared`, `pong`, `selection{id,text}`,
`viewport{width,height,scale,pixelWidth,pixelHeight}` and
`capture{width,height,scale,scaleY,mode}`. `hello-ok` includes the requested
capture scale and bounded CSS viewport. Only `capture` confirms actual JPEG
resolution; inspect `__remote.session` / `__remote.capture` in runtime diagnostics.

## View controls and capture bounds

- Capture adapts to DPR 1–2, at most 2.4 million pixels and 2400 pixels per
  dimension. Oversized CSS viewports are fitted to that budget as well.
- Chromium screencast dimensions are maximums, not guaranteed output sizes.
  The service reads actual JPEG dimensions and switches to serialized device-scale
  screenshots if screencast output is smaller than requested. Screenshot fallback
  waits at least 150 ms between captures; navigation can interrupt a capture.
- Slow sockets drop frames rather than buffer them (4 MiB bound). The client has
  one decode in flight plus one latest pending frame, and closes every bitmap.
  Control messages are serialized with a 128-message queue and 128 KiB payload cap.
- Right-click, long-press or Menu / Shift+F10 opens local navigation, copy,
  zoom and fullscreen controls. Ctrl/Cmd+wheel zooms 50–300%; scrollbars pan
  the enlarged view. Ordinary drags always belong to the remote page.
- A small local textarea receives paste and IME composition and forwards plain
  text (up to 65,536 characters). No remote clipboard-read permission is granted.
  Ctrl/Cmd maps to the server platform's accelerator (Meta on macOS, Control on Linux).
  Focus loss releases held keys
  and mouse buttons. Copy-selected-text reads remote selection (not password
  inputs), then attempts a local clipboard write; permission, focus or expired
  activation can cause an honest failure notice. It is not guaranteed across browsers.
- Fullscreen requires the menu gesture and permission on the **shell's runtime
  iframe**; the nested website iframe's permission does not grant this. A denied
  request displays a notice. Escape remains native while fullscreen.
- Cache clearing clears HTTP cache only, never session cookies. Session creation
  and production `/session/` URLs are unchanged; no eager sessions are added.

## Limits (deliberate, v1)

- Pixel rendering: no client-side text selection or find-in-page; text is an
  image by design.
- Host-browser-reserved shortcuts (Ctrl/Cmd+T, +W, +N, F11…) remain local;
  an observable keydown does not guarantee interception or remote passthrough.
- Popups are reported to the shell as URLs (it opens engine tabs for them);
  the popup page itself is not streamed.
- Guard blocks literal private hostnames (loopback, RFC1918, link-local,
  cloud metadata); DNS rebinding is left to deployment egress rules.
- Popups and downloads stay inside the server browser. Zoom above the capture
  scale can soften the image; view zoom does not increase capture resolution.
