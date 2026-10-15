// Pure navigation guards for the headless engine service. Kept free of any
// side effects so tests can import them without starting the server.

// Hostnames a cloud-hosted browser must never reach: loopback, RFC1918 and
// link-local ranges (including the cloud metadata endpoint), and IPv6
// equivalents. Literal hostnames only — DNS rebinding is a documented
// limitation handled by deployment-level egress rules.
export function isPrivateHost(rawHostname) {
  let host = String(rawHostname || "").toLowerCase().trim();
  if (!host) return true;
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "metadata.google.internal") return true;
  if (/^(\d{1,3})(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (host.includes(":")) {
    const lower = host.replace(/^\[|\]$/g, "");
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") ||
      lower.startsWith("feb")) return true; // fe80::/10
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateHost(mapped[1]);
  }
  return false;
}

// Validate a navigation target before the headless browser touches it.
// `allowPrivate` (dev/test only) lifts the private-network block so a locally
// hosted fixture can be driven; scheme, credentials and blocklist still apply.
export function assertNavigatable(raw, blockedDomains = [], options = {}) {
  const allowPrivate = !!options.allowPrivate;
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Enter a website address.");
  }
  if (raw.length > 2048) throw new Error("That address is too long.");
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("That is not a valid website address.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS website addresses are supported.");
  }
  if (url.username || url.password) {
    throw new Error("Use the website's login form instead of URL credentials.");
  }
  const host = url.hostname.toLowerCase();
  if (!allowPrivate && isPrivateHost(host)) {
    throw new Error("That address points at a private network and cannot be opened.");
  }
  for (const domain of blockedDomains) {
    const entry = String(domain || "").toLowerCase().trim();
    if (entry && (host === entry || host.endsWith("." + entry))) {
      throw new Error("This domain is blocked by your ojjyProxy domain filter.");
    }
  }
  return url;
}
