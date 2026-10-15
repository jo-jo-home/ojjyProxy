import { expect, test } from "@playwright/test";
const KEY = "ojjyproxy-app-v1";
const form = (page) => page.locator("#settings-form");
const field = (page, name) => form(page).locator(`[name="${name}"]`);
const open = (page) => page.locator("#global-settings").click();
const save = async (page) => {
  await page.getByRole("button", { name: "save settings", exact: true }).click();
  await expect(page.locator("#settings")).not.toBeVisible();
};
const state = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
// A complete 2×2 RGB PNG with valid chunk CRCs (Firefox rejects corrupt PNGs
// that Chromium's decoder tolerates).
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGPQy94LRAwQCgAjOgVZ0ti5iwAAAABJRU5ErkJggg==",
  "base64",
);

test("workspace previews cancel, save, preserve connections and reset appearance only", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await page.screenshot({
    path: "test-results/appearance-studio-desktop.png",
    animations: "disabled",
  });
  await field(page, "wisp").fill("ws://localhost:9000/wisp/");
  const before = (await state(page)).settings;
  await page.locator('[data-preset="study"]').click();
  await expect(page.locator("body")).toHaveAttribute("data-layout", "sidebar");
  expect((await state(page)).settings.theme).toBe(before.theme);
  await page.keyboard.press("Escape");
  await expect(page.locator("#settings")).not.toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-layout", "top");
  await open(page);
  await page.locator('[data-preset="desk"]').click();
  await save(page);
  expect((await state(page)).settings.wisp).toBe(before.wisp);
  expect((await state(page)).settings.engine).toBe("sj-1.1.0");
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-layout", "classic");
  await open(page);
  await page.locator("#reset-appearance").click();
  await save(page);
  await expect(page.locator("body")).toHaveAttribute("data-layout", "top");
  expect((await state(page)).settings.theme).toBe("default");
});

test("settings categories, search, empty results and unsaved fields", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await page.getByRole("button", { name: "Privacy", exact: true }).click();
  await expect(field(page, "discreet")).toBeVisible();
  await expect(page.locator("#preset-grid")).not.toBeVisible();
  await page.locator("#settings-search").fill("relay endpoint");
  await expect(field(page, "wisp")).toBeVisible();
  await field(page, "wisp").fill("ws://localhost:9999/wisp/");
  await page.locator("#settings-search").fill("no-settings-match-this");
  await expect(page.locator("#settings-empty")).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(field(page, "wisp")).toHaveValue("ws://localhost:9999/wisp/");
  await page.keyboard.press("Escape");
  expect((await state(page)).settings.wisp).toBe("ws://localhost:9000/wisp/");
});

test("all layouts remain usable at desktop and phone widths; focus has an escape", async ({ page }) => {
  await page.goto("/");
  for (const layout of ["sidebar", "rail", "classic", "bottom", "focus"]) {
    await open(page);
    await field(page, "layout").selectOption(layout);
    await save(page);
    await expect(page.locator("body")).toHaveAttribute("data-layout", layout);
    if (layout === "sidebar") {
      await page.locator("#sidebar-toggle").click();
      await expect(page.locator("body")).toHaveAttribute("data-layout", "rail");
      await page.locator("#sidebar-toggle").click();
      await expect(page.locator("body")).toHaveAttribute("data-layout", "sidebar");
    }
    if (layout === "focus") {
      await expect(page.locator("#restore-workspace")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("body")).toHaveAttribute("data-layout", "top");
      await open(page);
      await field(page, "layout").selectOption("focus");
      await save(page);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    if (layout === "focus") await page.locator("#restore-workspace").click();
    else {
      await expect(page.locator("#new-tab")).toBeVisible();
      if (["rail", "sidebar"].includes(layout)) {
        await expect(page.locator("#tabs")).toHaveAttribute("aria-orientation", "horizontal");
      }
    }
    await page.setViewportSize({ width: 1280, height: 800 });
  }
});

test("dashboard visibility, shortcut density and bookmarks-bar persist", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await field(page, "showWelcome").uncheck();
  await field(page, "showRecent").check();
  await field(page, "showCollections").check();
  await field(page, "shortcutDensity").selectOption("list");
  await field(page, "bookmarksBar").selectOption("always");
  await save(page);
  await page.reload();
  await expect(page.locator(".home-heading")).not.toBeVisible();
  await expect(page.locator("#recent-dashboard")).toBeVisible();
  await expect(page.locator("#collections-dashboard")).toBeVisible();
  await expect(page.locator("#home")).toHaveAttribute("data-density", "list");
  await expect(page.locator("#bookmarks-bar")).toBeVisible();
  await expect(page.locator("#bookmarks-bar button")).toHaveCount(2);
  await open(page);
  await field(page, "history").uncheck();
  await save(page);
  await expect(page.locator("#recent-dashboard")).not.toBeVisible();
});

test("collections sanitize, rename, append lazily, export and delete with confirmation", async ({ page }) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(
      key,
      JSON.stringify({
        settings: { showCollections: true },
        tabs: [{ id: "home", url: "", engine: "sj-1.1.0", title: "home" }],
        activeId: "home",
        collections: [{
          id: "reading",
          name: "Reading",
          tabs: [{ title: "Example", url: "https://example.com/", engine: "sj-1.1.0" }, {
            url: "javascript:alert(1)",
            engine: "sj-1.1.0",
          }],
        }],
      }),
    );
  }, KEY);
  await page.goto("/");
  await page.getByRole("button", { name: "tab collections", exact: true }).click();
  await expect(page.locator(".collection-row small")).toHaveText("1 tabs");
  await page.locator(".collection-row input").fill("Research");
  await page.getByRole("button", { name: "rename", exact: true }).click();
  await page.getByRole("button", { name: "open tabs", exact: true }).click();
  await expect(page.locator("#tabs .tab")).toHaveCount(2);
  await expect(page.locator(".runtime-frame")).toHaveCount(0);
  await page.locator("#collection-name").fill("Saved copy");
  await page.getByRole("button", { name: "save current tabs" }).click();
  await expect(page.locator(".collection-row")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await page.reload();
  expect((await state(page)).collections.map((item) => item.name)).toEqual([
    "Research",
    "Saved copy",
  ]);
  await open(page);
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#export-data").click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  let text = "";
  for await (const part of stream) text += part;
  expect(JSON.parse(text).collections).toHaveLength(2);
  expect(text).not.toContain("blob:");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "tab collections", exact: true }).click();
  await page.locator(".collection-row").first().getByRole("button", { name: "remove", exact: true })
    .click();
  expect((await state(page)).collections).toHaveLength(2);
  await page.getByRole("button", { name: "confirm remove", exact: true }).click();
  expect((await state(page)).collections).toHaveLength(1);
});

test("local wallpaper stages, cancels, persists and removes; invalid images fail honestly", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await page.locator("#wallpaper-file").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.locator("#wallpaper-message")).toContainText("Image ready");
  await expect(page.locator("#home")).toHaveClass(/has-wallpaper/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#home")).not.toHaveClass(/has-wallpaper/);
  await open(page);
  await page.locator("#wallpaper-file").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.locator("#wallpaper-message")).toContainText("Image ready");
  await save(page);
  await page.reload();
  await expect(page.locator("#home")).toHaveClass(/has-wallpaper/);
  await page.screenshot({ path: "test-results/home-local-wallpaper.png", animations: "disabled" });
  await open(page);
  await page.locator("#wallpaper-file").setInputFiles({
    name: "unsafe.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(page.locator("#wallpaper-message")).toContainText("Choose a PNG");
  await page.locator("#wallpaper-file").setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.locator("#wallpaper-message")).not.toContainText("Image ready");
  await page.locator("#wallpaper-remove").click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#home")).toHaveClass(/has-wallpaper/);
  await open(page);
  await page.locator("#wallpaper-remove").click();
  await save(page);
  await page.reload();
  await expect(page.locator("#home")).not.toHaveClass(/has-wallpaper/);
});

test("reduced motion and keyboard-opened settings never move; tabs have no entrance animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#global-settings").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#settings")).toBeVisible();
  expect(await page.locator("#settings").evaluate((node) => node.getAnimations().length)).toBe(0);
  await page.keyboard.press("Escape");
  await page.locator("#new-tab").click();
  expect(
    await page.locator("#tabs").evaluate((node) => node.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await open(page);
  expect(
    await page.locator("#settings").evaluate((node) =>
      node.getAnimations().flatMap((animation) => animation.effect.getKeyframes()).every((frame) =>
        !frame.transform || frame.transform === "none"
      )
    ),
  ).toBe(true);
});

test("wallpaper storage failure keeps settings open and does not claim a save", async ({ page }) => {
  await page.addInitScript(() => {
    const original = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (name, ...args) {
      if (name === "ojjyproxy-appearance-v1") {
        throw new DOMException("Storage denied", "SecurityError");
      }
      return original.call(this, name, ...args);
    };
  });
  await page.goto("/");
  await open(page);
  await page.locator("#wallpaper-file").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.locator("#wallpaper-message")).toContainText("Image ready");
  await field(page, "theme").selectOption("mint");
  await page.getByRole("button", { name: "save settings", exact: true }).click();
  await expect(page.locator("#settings-message")).toContainText("Storage denied");
  await expect(page.locator("#settings")).toBeVisible();
  expect((await state(page)).settings.theme).toBe("default");
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).toHaveAttribute("data-theme", "default");
});

test("collections respect tab capacity and skip unavailable engines without loading", async ({ page }) => {
  await page.route("**/api/config", async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.runtimes = { "sj-1.1.0": config.runtimes["sj-1.1.0"] };
    await route.fulfill({ response, json: config });
  });
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        settings: { restore: true },
        tabs: Array.from(
          { length: 19 },
          (_, index) => ({ id: `blank-${index}`, url: "", title: "new tab", engine: "sj-1.1.0" }),
        ),
        collections: [{
          id: "large",
          name: "Large",
          tabs: Array.from(
            { length: 4 },
            (_, index) => ({
              title: "Example",
              url: "https://example.com",
              engine: index === 0 ? "uv-3.2.10" : "sj-1.1.0",
            }),
          ),
        }],
      }),
    );
  }, KEY);
  await page.goto("/");
  await page.getByRole("button", { name: "tab collections", exact: true }).click();
  await page.getByRole("button", { name: "open tabs", exact: true }).click();
  await expect(page.locator("#tabs .tab")).toHaveCount(20);
  await expect(page.locator(".runtime-frame")).toHaveCount(0);
  await expect(page.locator("#toast")).toContainText("Some tabs skipped");
  expect((await state(page)).tabs.at(-1).engine).toBe("sj-1.1.0");
});

test("palette gallery previews every theme without persisting and supports pointer cancellation", async ({ page }) => {
  await page.goto("/");
  await open(page);
  const ids = await page.locator("#palette-grid button").evaluateAll((nodes) =>
    nodes.map((node) => node.dataset.theme)
  );
  expect(ids).toHaveLength(18);
  for (const id of ids) {
    await page.locator(`#palette-grid [data-theme="${id}"]`).click();
    await expect(page.locator("body")).toHaveAttribute("data-theme", id);
    expect((await state(page)).settings.theme).toBe("default");
  }
  await page.locator('#settings [aria-label="Close settings"]').click();
  await expect(page.locator("#settings")).not.toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-theme", "default");
});

test("tab keyboard navigation follows layout orientation and never animates", async ({ page }) => {
  await page.goto("/");
  await page.locator("#new-tab").click();
  await page.locator("#new-tab").click();
  await page.locator('#tabs [role="tab"]').last().focus();
  await page.keyboard.press("Home");
  await expect(page.locator('#tabs [role="tab"]').first()).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('#tabs [role="tab"]').nth(1)).toBeFocused();
  await open(page);
  await field(page, "layout").selectOption("sidebar");
  await save(page);
  await page.locator('#tabs [role="tab"]').nth(1).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('#tabs [role="tab"]').last()).toBeFocused();
  expect(
    await page.locator("#tabs").evaluate((node) => node.getAnimations({ subtree: true }).length),
  ).toBe(0);
});

test("collection imports are additive and cannot import traffic routing or wallpaper bytes", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await page.locator("#import-data").setInputFiles({
    name: "collection.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      format: "ojjyproxy-v1",
      bookmarks: [],
      settings: { wisp: "wss://untrusted.example/wisp/", theme: "mint" },
      wallpaper: "unsafe",
      collections: [{
        name: "Imported",
        tabs: [{ url: "https://example.com/", title: "Example", engine: "sj-1.1.0" }, {
          url: "data:text/html,bad",
          engine: "sj-1.1.0",
        }],
      }],
    })),
  });
  await expect(page.locator("#toast")).toContainText("Bookmarks and collections imported");
  const data = await state(page);
  expect(data.collections).toHaveLength(1);
  expect(data.collections[0].tabs).toHaveLength(1);
  expect(data.settings.wisp).toBe("ws://localhost:9000/wisp/");
  expect(data.settings.theme).toBe("default");
  expect(data.wallpaper).toBeUndefined();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "tab collections", exact: true }).click();
  await page.locator("#collection-name").fill("Empty");
  await page.getByRole("button", { name: "save current tabs" }).click();
  await expect(page.locator("#collection-message")).toContainText("Open at least one website");
});
