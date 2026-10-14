export const ENGINES = [
  { id: "sj-1.1.0", label: "Scramjet stable (1.1.0)", short: "Scramjet stable", port: 8100, warm: ["/runtime/vendor/app.js", "/runtime/vendor/app.wasm"] },
  { id: "sj-2.0.0-alpha", label: "Scramjet 2.0.0-alpha", short: "Scramjet α0", port: 8200, warm: ["/runtime/vendor/app.js", "/runtime/vendor/app.wasm"] },
  { id: "sj-2.0.2-alpha", label: "Scramjet 2.0.2-alpha", short: "Scramjet α2", port: 8300, warm: ["/runtime/vendor/bundled.js"] },
  { id: "sj-2.0.67-alpha.2", label: "Scramjet 2.0.67-alpha.2", short: "Scramjet α67", port: 8400, warm: ["/runtime/vendor/main.js", "/runtime/vendor/main.wasm"] },
  { id: "uv-3.2.10", label: "Ultraviolet (3.2.10) — legacy", short: "Ultraviolet", port: 8500, warm: ["/runtime/vendor/bundle.js"] },
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
// Manually-switchable backup relay: ojjyProxy's own CloudFront endpoint. The
// website's default endpoint comes from WISP_URL and may be another site's
// relay; switching between the two is always an explicit user action.
export const BACKUP_WISP = "wss://d11zfagyzg18az.cloudfront.net/wisp/";

// The 11 editable palette slots, in the order the color editor shows them.
export const COLOR_TOKENS = [
  "bg", "bg2", "bg3", "border", "accent", "text", "text2", "muted", "star", "danger", "success",
];

// Built-in interface themes. The first entry is the default hub palette and must
// keep its exact colors. `glow` feeds the page's background gradient, `scheme`
// switches native controls to light rendering. Tests validate every palette
// against a contrast budget, so add themes through this table only.
export const THEMES = [
  {
    id: "default",
    label: "ojjy’s game hub blue",
    scheme: "dark",
    glow: "#0e2040",
    colors: {
      bg: "#0a1628", bg2: "#111d2e", bg3: "#162a42", border: "#1e3a5f", accent: "#2e6bbd",
      text: "#e2e8f0", text2: "#c8d6e5", muted: "#90a3b9", star: "#f0c040",
      danger: "#e05555", success: "#4ade80",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    scheme: "dark",
    glow: "#131c30",
    colors: {
      bg: "#0b101b", bg2: "#141b29", bg3: "#1d2940", border: "#2a3c5a", accent: "#4f7fb8",
      text: "#e6eaf2", text2: "#c3cddd", muted: "#8b99ad", star: "#f0c040",
      danger: "#e05555", success: "#4ade80",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    scheme: "dark",
    glow: "#0b2f3f",
    colors: {
      bg: "#071b24", bg2: "#0c2632", bg3: "#153b49", border: "#245064", accent: "#227c9b",
      text: "#e2f0f4", text2: "#c2d9e0", muted: "#8aa8b3", star: "#f0c040",
      danger: "#e05555", success: "#4ade80",
    },
  },
  {
    id: "lunar",
    label: "Lunar (purple)",
    scheme: "dark",
    glow: "#1d1236",
    colors: {
      bg: "#140b23", bg2: "#1c1133", bg3: "#291a4d", border: "#3b2a66", accent: "#8b5cf6",
      text: "#ece7f6", text2: "#d0c6e6", muted: "#9d92b8", star: "#f0c040",
      danger: "#e05555", success: "#4ade80",
    },
  },
  {
    id: "ember",
    label: "Ember (warm orange)",
    scheme: "dark",
    glow: "#2a1a10",
    colors: {
      bg: "#16100d", bg2: "#1f1712", bg3: "#2b1e15", border: "#43301f", accent: "#e0763b",
      text: "#f4ece4", text2: "#ddcfc2", muted: "#a89483", star: "#f0c040",
      danger: "#e05555", success: "#7fc98a",
    },
  },
  {
    id: "moss",
    label: "Moss (green)",
    scheme: "dark",
    glow: "#10261a",
    colors: {
      bg: "#0c1410", bg2: "#121e16", bg3: "#1a2b20", border: "#27402f", accent: "#4f9e6b",
      text: "#e8f2ea", text2: "#c9dccf", muted: "#93ac9a", star: "#f0c040",
      danger: "#e06555", success: "#6fce85",
    },
  },
  {
    id: "rose",
    label: "Rosewood (pink)",
    scheme: "dark",
    glow: "#2a1522",
    colors: {
      bg: "#170d12", bg2: "#221420", bg3: "#301b28", border: "#47283a", accent: "#d4648a",
      text: "#f6e8ee", text2: "#e0ccd5", muted: "#ab93a0", star: "#f0c040",
      danger: "#e05555", success: "#7fc98a",
    },
  },
  {
    id: "graphite",
    label: "Graphite (mono)",
    scheme: "dark",
    glow: "#1a1d21",
    colors: {
      bg: "#101214", bg2: "#17191c", bg3: "#1f2226", border: "#2b2f35", accent: "#8a94a3",
      text: "#eef0f3", text2: "#d3d7dc", muted: "#9aa1aa", star: "#f0c040",
      danger: "#e05555", success: "#4ade80",
    },
  },
  {
    id: "daylight",
    label: "Daylight (light)",
    scheme: "light",
    glow: "#dce8f8",
    colors: {
      bg: "#f3f6fa", bg2: "#ffffff", bg3: "#e8edf5", border: "#c8d4e4", accent: "#2563eb",
      text: "#16233b", text2: "#33445e", muted: "#61708a", star: "#b8831c",
      danger: "#c23a3a", success: "#1e7f45",
    },
  },
  {
    id: "paper",
    label: "Paper (light warm)",
    scheme: "light",
    glow: "#eadfc8",
    colors: {
      bg: "#f6f1e7", bg2: "#fffbf2", bg3: "#efe7d8", border: "#d9cdb5", accent: "#8a4f24",
      text: "#241c12", text2: "#453a2b", muted: "#77644d", star: "#a3741f",
      danger: "#b23434", success: "#2f7d4f",
    },
  },
  {
    id: "frost",
    label: "Frost (light cool)",
    scheme: "light",
    glow: "#d7e8f4",
    colors: {
      bg: "#eef4f8", bg2: "#ffffff", bg3: "#e0eaf2", border: "#c3d3e0", accent: "#0e6e8c",
      text: "#122733", text2: "#2e4552", muted: "#587080", star: "#b07d1a",
      danger: "#bb3a3a", success: "#1a7a52",
    },
  },
  {
    id: "sakura",
    label: "Sakura (light pink)",
    scheme: "light",
    glow: "#f1dbe3",
    colors: {
      bg: "#f9eef2", bg2: "#fff7fa", bg3: "#f2dfe6", border: "#e0c3cf", accent: "#c2487c",
      text: "#2e1520", text2: "#54374a", muted: "#6f4a63", star: "#a8721c",
      danger: "#bd3a3a", success: "#237a4e",
    },
  },
];

function channelLuminance(value) {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

// WCAG relative luminance for a #rrggbb color.
export function hexLuminance(hex) {
  const match = /^#([\da-f]{6})$/i.exec(String(hex).trim());
  if (!match) throw new Error(`Not a #rrggbb color: ${hex}`);
  const digits = match[1];
  return 0.2126 * channelLuminance(Number.parseInt(digits.slice(0, 2), 16)) +
    0.7152 * channelLuminance(Number.parseInt(digits.slice(2, 4), 16)) +
    0.0722 * channelLuminance(Number.parseInt(digits.slice(4, 6), 16));
}

export function contrastRatio(one, two) {
  const first = hexLuminance(one);
  const second = hexLuminance(two);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

// Pick near-black or near-white text for a filled accent surface, so primary
// buttons stay readable under any theme or accent override.
export function readableInk(hex) {
  const light = "#f7fafc";
  const dark = "#10131a";
  return contrastRatio(hex, light) >= contrastRatio(hex, dark) ? light : dark;
}
