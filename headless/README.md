# ojjyProxy headless engine service

Remote browser isolation for ojjyProxy: a Node service that drives a
server-side headless Chromium and streams it to the browser as a live pixel
stream. The client never contacts destinations — this service does — and page
content crosses the network as JPEG frames, which URL- and content-keyword
filters (school proxies) cannot read the way they read rewritten HTML.

This service is also the headless engine's **runtime origin**: it serves the
runtime page (`/runtime/index.html`), its config, and the client module, and
accepts the engine's WebSocket at `/headless/`.

## Run locally

```sh
HEADLESS_SERVICE=1 npm run dev      # dev stack + headless service on :9100
```

The engine appears in Settings → Engine & version as **Headless browser
(remote isolation)**. It needs Playwright's Chromium:

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
| `HEADLESS_QUALITY` | `60` | JPEG quality for streamed frames |

## Deploy on the relay host (EC2 + Caddy + CloudFront)

The service sits next to the Wisp relay and rides the same domain, TLS and
CloudFront distribution — no new DNS or CDN work.

```sh
# 2 GiB swap keeps Chromium comfortable on a 1 GiB instance
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile &&
  sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

mkdir -p /opt/ojjyproxy-headless
# copy headless/server.mjs, headless/guards.mjs, headless/package.json and
# the runtime files (public/runtime/*, public/shared.js) into
# /opt/ojjyproxy-headless/ preserving that layout, then:
cat > /opt/ojjyproxy-headless/Dockerfile <<'EOF'
FROM mcr.microsoft.com/playwright:v1.58.2-noble
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.mjs guards.mjs ./
COPY runtime ./runtime
COPY shared.js ./shared.js
ENV HEADLESS_HOST=0.0.0.0
EXPOSE 9100
CMD ["node", "server.mjs"]
EOF
cd /opt/ojjyproxy-headless && sudo docker build -t ojjyproxy-headless .
sudo docker run -d --name ojjyproxy-headless --restart unless-stopped \
  -p 127.0.0.1:9100:9100 \
  -e HEADLESS_PARENT=https://ojjyproxy.ojjy.deno.net \
  -e HEADLESS_SELF=https://ojjyproxy-jonas-relay.duckdns.org \
  -e HEADLESS_ORIGINS=https://ojjyproxy-jonas-relay.duckdns.org \
  ojjyproxy-headless
```

Then extend the Caddy site (same file that locks the relay behind the origin
secret) so these paths proxy to `127.0.0.1:9100` instead of the relay, still
requiring the `X-Ojjy-Origin-Secret` header CloudFront adds:

```
@headless {
    path /runtime/* /shared.js /headless /headless/*
    header X-Ojjy-Origin-Secret <your-origin-secret>
}
handle @headless { reverse_proxy 127.0.0.1:9100 }
```

Validate and reload (`caddy validate`, then `caddy reload`) — never recreate
the container for a config change. CloudFront needs no change: the default
behavior already forwards every path and supports WebSocket upgrades.

Finally, register the engine on the website: add the origin to
`RUNTIME_ORIGINS` on the outer Deno app and redeploy:

```json
{
  "sj-1.1.0": "https://ojjyproxy-stable.ojjy.deno.net",
  "sj-2.0.0-alpha": "https://ojjyproxy-alpha0.ojjy.deno.net",
  "sj-2.0.2-alpha": "https://ojjyproxy-alpha2.ojjy.deno.net",
  "sj-2.0.67-alpha.2": "https://ojjyproxy-alpha67.ojjy.deno.net",
  "uv-3.2.10": "https://ojjyproxy-uv.ojjy.deno.net",
  "headless": "https://ojjyproxy-jonas-relay.duckdns.org"
}
```

## Protocol

JSON text frames for control, binary frames (`0x01` + JPEG bytes) for pixels.
Client → `hello{width,height,blocked}`, `navigate{url}`, `back`, `forward`,
`reload`, `clear-cache`, `mouse{action,x,y,button,clickCount}`, `wheel`,
`key{action,key}`, `resize`, `inspect`, `ping`. Server → `hello-ok`,
`navigating{url}`, `loaded{url,title}`, `popup{url}`, `links{links}`,
`error{message}`, `cache-cleared`, `pong`.

## Limits (deliberate, v1)

- Pixel rendering: no client-side text selection or find-in-page; text is an
  image by design.
- Host-browser-reserved shortcuts (Ctrl+T, Ctrl+W, F11…) never reach the page.
- Popups are reported to the shell as URLs (it opens engine tabs for them);
  the popup page itself is not streamed.
- Guard blocks literal private hostnames (loopback, RFC1918, link-local,
  cloud metadata); DNS rebinding is left to deployment egress rules.
- Popups and downloads stay inside the server browser; devicePixelRatio is 1.
