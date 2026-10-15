// Unit tests for the headless engine's navigation guards. These run without
// starting the headless service — the guards are pure functions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNavigatable, isPrivateHost } from "../headless/guards.mjs";

test("private and loopback hosts are refused before the browser dials them", () => {
  for (
    const host of [
      "localhost",
      "foo.localhost",
      "127.0.0.1",
      "127.255.0.9",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "0.0.0.0",
      "::1",
      "fc00::1",
      "fd12:3456::1",
      "fe80::1",
      "::ffff:10.0.0.1",
      "metadata.google.internal",
      "",
    ]
  ) {
    assert.ok(isPrivateHost(host), `${host || "(empty)"} must be private`);
  }
  for (const host of ["example.com", "8.8.8.8", "www.wikipedia.org", "2606:4700::1"]) {
    assert.ok(!isPrivateHost(host), `${host} must be public`);
  }
});

test("navigations allow public HTTP(S) and refuse everything dangerous", () => {
  const ok = assertNavigatable("https://example.com/path?x=1");
  assert.equal(ok.hostname, "example.com");
  assertNavigatable("http://example.com");
  for (
    const [input, message] of [
      ["javascript:alert(1)", /HTTP and HTTPS/i],
      ["data:text/html,hi", /HTTP and HTTPS/i],
      ["file:///etc/passwd", /HTTP and HTTPS/i],
      ["https://user:pass@example.com", /credentials/i],
      ["http://127.0.0.1/server-status", /private network/i],
      ["http://169.254.169.254/latest/meta-data/", /private network/i],
      ["http://192.168.0.10/admin", /private network/i],
      ["https://[::1]/", /private network/i],
      ["not a url", /valid website address/i],
      ["", /Enter a website address/i],
    ]
  ) {
    assert.throws(() => assertNavigatable(input), message, input);
  }
});

test("the shell's per-tab blocklist is enforced with the filter wording", () => {
  assert.throws(
    () => assertNavigatable("https://ads.example.com/", ["example.com"]),
    /blocked by your ojjyProxy domain filter/,
  );
  assert.throws(
    () => assertNavigatable("https://example.com/", ["example.com"]),
    /blocked by your ojjyProxy domain filter/,
  );
  assert.doesNotThrow(() => assertNavigatable("https://example.org/", ["example.com"]));
});

test("allowPrivate lifts only the private-network rule (dev/test escape hatch)", () => {
  assert.doesNotThrow(() =>
    assertNavigatable("http://localhost:8899/", [], { allowPrivate: true }));
  assert.throws(
    () => assertNavigatable("javascript:alert(1)", [], { allowPrivate: true }),
    /HTTP and HTTPS/i,
  );
  assert.throws(
    () => assertNavigatable("http://localhost:8899/", ["localhost"], { allowPrivate: true }),
    /blocked by your ojjyProxy domain filter/,
  );
  assert.throws(
    () => assertNavigatable("http://127.0.0.1:8899/", []),
    /private network/i,
  );
});
