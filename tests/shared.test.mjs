import { test } from "node:test";
import assert from "node:assert/strict";
import { BACKUP_WISP, ENGINES, flattenHeaders, toUrl, validateWisp } from "../public/shared.js";
test("stable default and exact selectable releases", () => {
  assert.equal(ENGINES[0].id, "sj-1.1.0");
  assert.deepEqual(ENGINES.map((engine) => engine.id), [
    "sj-1.1.0",
    "sj-2.0.0-alpha",
    "sj-2.0.2-alpha",
    "sj-2.0.67-alpha.2",
    "uv-3.2.10",
  ]);
});
test("URLs, query strings, fragments and searches survive canonicalization", () => {
  assert.equal(toUrl("example.com/path?x=a%2Fb#anchor"), "https://example.com/path?x=a%2Fb#anchor");
  assert.equal(toUrl("http://example.com/a"), "http://example.com/a");
  assert.equal(toUrl("hello world"), "https://duckduckgo.com/?q=hello%20world");
  assert.equal(toUrl("blue theme", "google"), "https://www.google.com/search?q=blue%20theme");
});
test("untrusted active schemes and URL credentials cannot become website navigations", () => {
  for (
    const input of [
      "javascript:alert(1)",
      "data:text/html,<script>1</script>",
      "file:///etc/passwd",
      "ftp://example.com",
      "https://user:pass@example.com",
    ]
  ) assert.throws(() => toUrl(input));
});
test("Wisp endpoint validation distinguishes secure website requirements", () => {
  assert.equal(validateWisp("wss://relay.example/wisp/", true), "wss://relay.example/wisp/");
  assert.equal(validateWisp("ws://localhost:9000/wisp/"), "ws://localhost:9000/wisp/");
  for (
    const value of [
      "https://relay.example",
      "wss://user:pass@relay.example",
      "wss://relay.example/#secret",
    ]
  ) assert.throws(() => validateWisp(value));
  assert.throws(() => validateWisp("ws://relay.example/wisp/", true));
});
test("transport header normalization preserves repeated Set-Cookie", () => {
  assert.deepEqual(
    flattenHeaders({ "set-cookie": ["one=1", "two=2"], location: "https://example.com/" }),
    [["set-cookie", "one=1"], ["set-cookie", "two=2"], ["location", "https://example.com/"]],
  );
});
test("the official backup relay is a valid secure endpoint", () => {
  assert.equal(validateWisp(BACKUP_WISP, true), BACKUP_WISP);
});
