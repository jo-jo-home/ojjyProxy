export const ENGINES = [
  { id: "sj-1.1.0", label: "Scramjet stable (1.1.0)", short: "Scramjet stable", port: 8100 },
  { id: "sj-2.0.0-alpha", label: "Scramjet 2.0.0-alpha", short: "Scramjet α0", port: 8200 },
  { id: "sj-2.0.2-alpha", label: "Scramjet 2.0.2-alpha", short: "Scramjet α2", port: 8300 },
  { id: "sj-2.0.67-alpha.2", label: "Scramjet 2.0.67-alpha.2", short: "Scramjet α67", port: 8400 },
  { id: "uv-3.2.10", label: "Ultraviolet (3.2.10) — legacy", short: "Ultraviolet", port: 8500 },
];
export const SEARCH = {
  duckduckgo: "https://duckduckgo.com/?q=",
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  brave: "https://search.brave.com/search?q=",
  yahoo: "https://search.yahoo.com/search?p=",
};
export function toUrl(input, provider = "duckduckgo") {
  const text = input.trim();
  if (!text) throw new Error("Enter a website address or a search.");
  if (/^[a-z][a-z\d+.-]*:/i.test(text) && !/^[\w.-]+:\d+(?:\/|$)/.test(text)) {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only HTTP and HTTPS website addresses are supported.");
    }
    if (url.username || url.password) {
      throw new Error("Use the website's login form instead of URL credentials.");
    }
    return url.href;
  }
  if (
    !/\s/.test(text) &&
    /^(?:localhost|[\w-]+(?:\.[\w-]+)+|\[[\da-f:]+\])(?::\d+)?(?:[/?#]|$)/i.test(text)
  ) {
    return new URL(`https://${text}`).href;
  }
  return (SEARCH[provider] || SEARCH.duckduckgo) + encodeURIComponent(text);
}
export function flattenHeaders(headers) {
  if (Array.isArray(headers)) return headers;
  if (headers instanceof Headers) return [...headers.entries()];
  return Object.entries(headers || {}).flatMap(([name, value]) =>
    (Array.isArray(value) ? value : [value]).map((item) => [name, String(item)])
  );
}
export function validateWisp(value, secure = false) {
  const url = new URL(value);
  if (!["ws:", "wss:"].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error("Use a ws:// or wss:// Wisp endpoint without credentials or a fragment.");
  }
  if (secure && url.protocol !== "wss:") {
    throw new Error("An HTTPS website needs a secure wss:// relay.");
  }
  return url.href;
}
// Manually-switchable backup relay operated by another site. Traffic through it
// is visible to that operator; switching is always an explicit user action.
export const BACKUP_WISP = "wss://dhf5wz2rpzatr.cloudfront.net/wisr/";
