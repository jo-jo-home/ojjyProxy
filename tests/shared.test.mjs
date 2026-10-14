import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BACKUP_WISP, COLOR_TOKENS, ENGINES, THEMES, contrastRatio, flattenHeaders, readableInk, toUrl,
  validateWisp,
} from "../public/shared.js";
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
test("the backup relay is a valid secure endpoint", () => {
  assert.equal(validateWisp(BACKUP_WISP, true), BACKUP_WISP);
});
test("every engine declares warm-up assets", () => {
  assert.ok(
    ENGINES.every((engine) => Array.isArray(engine.warm) && engine.warm.length > 0 &&
      engine.warm.every((file) => file.startsWith("/runtime/vendor/"))),
  );
});
test("theme table is ordered, unique and carries complete palettes", () => {
  assert.ok(THEMES.length >= 12, "at least twelve built-in themes");
  assert.equal(THEMES[0].id, "default", "hub blue stays the default");
  const ids = THEMES.map((theme) => theme.id);
  assert.equal(new Set(ids).size, ids.length, "theme ids are unique");
  assert.ok(THEMES.some((theme) => theme.scheme === "light"), "light themes exist");
  for (const theme of THEMES) {
    assert.match(theme.label, /\S/, `${theme.id} has a label`);
    assert.ok(["dark", "light"].includes(theme.scheme), `${theme.id} scheme`);
    assert.match(theme.glow, /^#[\da-f]{6}$/i, `${theme.id} glow`);
    for (const token of COLOR_TOKENS) {
      assert.match(theme.colors[token], /^#[\da-f]{6}$/i, `${theme.id} ${token}`);
    }
  }
});
test("theme palettes meet the contrast budget", () => {
  for (const theme of THEMES) {
    const colors = theme.colors;
    const checks = [
      ["text on bg", colors.text, colors.bg, 7],
      ["text2 on bg2", colors.text2, colors.bg2, 7],
      ["muted on bg", colors.muted, colors.bg, 4.5],
      ["muted on bg2", colors.muted, colors.bg2, 4.5],
      ["accent on bg2", colors.accent, colors.bg2, 3],
      ["star on bg2", colors.star, colors.bg2, 3],
      ["danger on bg2", colors.danger, colors.bg2, 3],
      ["success on bg2", colors.success, colors.bg2, 3],
    ];
    for (const [name, one, two, minimum] of checks) {
      assert.ok(
        contrastRatio(one, two) >= minimum,
        `${theme.id}: ${name} is ${contrastRatio(one, two).toFixed(2)} < ${minimum}`,
      );
    }
  }
});
test("readable ink flips for dark and light accents", () => {
  assert.equal(readableInk("#2e6bbd"), "#f7fafc");
  assert.equal(readableInk("#f0c040"), "#10131a");
  assert.throws(() => readableInk("blue"));
});
test("runtime vendor URLs contain no filter-matched tool names", () => {
  // Keyword filters at schools block URLs naming known proxy tooling; every
  // URL the runtime can request must stay neutral.
  const flagged = /scramjet|ultraviolet|baremux|epoxy|libcurl|mercury|titanium|uv\./i;
  const sources = [
    ["../public/runtime/adapter.js"],
    ["../public/runtime/sw.js"],
    ["../public/runtime/alpha2-client.js"],
    ["../public/runtime/alpha2-shared.js"],
    ["../server.ts"],
  ];
  for (const [file] of sources) {
    const text = readFileSync(new URL(file, import.meta.url), "utf8");
    const urls = [...text.matchAll(/\/runtime\/vendor\/[\w./-]+/g)].map((match) => match[0]);
    assert.ok(urls.length > 0, `${file} exposes no vendor URLs`);
    for (const url of urls) assert.ok(!flagged.test(url), `${file} leaks a tool name in ${url}`);
  }
  for (const engine of ENGINES) {
    for (const url of engine.warm) assert.ok(!flagged.test(url), `warm list leaks in ${url}`);
  }
});
