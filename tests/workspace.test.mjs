import { test } from "node:test";
import assert from "node:assert/strict";
import {
  APPEARANCE_KEYS,
  appearancePatch,
  BACKGROUNDS,
  HOME_DEFAULTS,
  LAYOUTS,
  prepareWallpaper,
  PRESETS,
  sanitizeCollections,
  sanitizeFolder,
} from "../public/workspace.js";
import { THEMES } from "../public/shared.js";
test("folder labels normalize whitespace, reject non-text and bound user data", () => {
  assert.equal(sanitizeFolder(null), "");
  assert.equal(sanitizeFolder({ toString: () => "unsafe" }), "");
  assert.equal(sanitizeFolder("  School   Games  "), "School Games");
  assert.equal(sanitizeFolder("a\u0000b"), "ab");
  assert.equal(sanitizeFolder("x".repeat(60)).length, 40);
});

test("background choices are bounded appearance-only IDs and preserve existing image mode", () => {
  assert.equal(BACKGROUNDS.length, 8);
  assert.equal(new Set(BACKGROUNDS.map((item) => item.id)).size, 8);
  assert.equal(HOME_DEFAULTS.backgroundSource, "image");
  assert.ok(APPEARANCE_KEYS.includes("backgroundSource"));
  for (const background of BACKGROUNDS) {
    assert.match(background.id, /^[a-z]+$/);
    assert.match(background.label, /\S/);
    assert.match(background.detail, /\S/);
    assert.deepEqual(
      appearancePatch({
        pattern: background.id,
        backgroundSource: "theme",
        wisp: "wss://not-an-appearance-setting",
      }),
      { pattern: background.id, backgroundSource: "theme" },
    );
  }
});

test("workspace presets only change supported appearance fields", () => {
  assert.equal(LAYOUTS.length, 6);
  assert.equal(PRESETS.length, 6);
  assert.equal(new Set(PRESETS.map((item) => item.id)).size, 6);
  for (const preset of PRESETS) {
    assert.ok(LAYOUTS.includes(preset.layout));
    assert.ok(THEMES.some((theme) => theme.id === preset.theme));
    assert.ok(!Object.hasOwn(appearancePatch(preset), "id"));
  }
  for (const key of ["wisp", "engine", "transport", "history", "blocked", "panicUrl"]) {
    assert.ok(!APPEARANCE_KEYS.includes(key));
  }
  assert.deepEqual(appearancePatch({ theme: "oled", wisp: "ws://bad", history: false }), {
    theme: "oled",
  });
  assert.equal(HOME_DEFAULTS.showRecent, false);
  assert.equal(HOME_DEFAULTS.bookmarksBar, "hidden");
});
test("collections reject corrupt records and active or credential URLs", () => {
  const tabs = [
    null,
    { url: "javascript:alert(1)", engine: "sj-1.1.0" },
    { url: "https://user:pass@example.com", engine: "sj-1.1.0" },
    { url: "https://example.com", engine: "unknown" },
    {
      url: "https://example.com/path#anchor",
      title: "x".repeat(300),
      engine: "sj-1.1.0",
      token: "secret",
    },
  ];
  assert.deepEqual(sanitizeCollections(null), []);
  assert.deepEqual(sanitizeCollections([{}, { name: "empty", tabs: [] }]), []);
  const [collection] = sanitizeCollections([{
    id: "safe",
    name: "  reading  ",
    tabs,
    token: "secret",
  }]);
  assert.equal(collection.name, "reading");
  assert.equal(collection.tabs.length, 1);
  assert.equal(collection.tabs[0].title.length, 120);
  assert.equal(collection.tabs[0].url, "https://example.com/path#anchor");
  assert.equal(JSON.stringify(collection).includes("secret"), false);
});
test("collection limits and duplicate IDs are bounded", () => {
  const value = {
    id: "duplicate",
    name: "n".repeat(90),
    tabs: Array.from({ length: 30 }, () => ({ url: "https://example.com", engine: "sj-1.1.0" })),
  };
  const result = sanitizeCollections(Array.from({ length: 25 }, () => value));
  assert.equal(result.length, 12);
  assert.equal(new Set(result.map((item) => item.id)).size, 12);
  assert.ok(result.every((item) => item.name.length === 60 && item.tabs.length === 20));
});
test("wallpaper validation rejects types and sizes before any decode", async () => {
  await assert.rejects(prepareWallpaper({ type: "image/svg+xml", size: 100 }), /PNG/);
  await assert.rejects(prepareWallpaper({ type: "image/gif", size: 100 }), /PNG/);
  await assert.rejects(prepareWallpaper({ type: "image/png", size: 4 * 1024 * 1024 }), /3 MB/);
  await assert.rejects(prepareWallpaper({ type: "image/jpeg", size: 0 }), /3 MB/);
});
