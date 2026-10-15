import { expect, test } from "@playwright/test";
const KEY = "ojjyproxy-app-v1";
const open = (page) => page.locator("#global-settings").click();
const save = async (page) => {
  await page.getByRole("button", { name: "save settings", exact: true }).click();
  await expect(page.locator("#settings")).not.toBeVisible();
};

test("quiet home fits a laptop, puts search first, and keeps secondary tools discoverable", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  const search = await page.locator("#home-form").boundingBox();
  const libraries = await page.locator(".home-nav").boundingBox();
  expect(search.y + search.height).toBeLessThan(libraries.y);
  expect(await page.locator(".freedom").count()).toBe(0);
  expect((await page.locator(".shortcut-card").first().boundingBox()).height).toBeLessThan(100);
  expect((await page.locator(".home-footer").boundingBox()).y).toBeLessThan(700);
  expect(await page.locator("#panic").evaluate((node) => node.closest(".topbar") !== null)).toBe(
    true,
  );
  await page.screenshot({ path: "test-results/quiet-home-laptop.png", animations: "disabled" });
  await page.locator("#home-more > summary").focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "connection log", exact: true }).click();
  await expect(page.locator("#library-title")).toHaveText("Connection log");
  await page.keyboard.press("Escape");
  await page.locator("#home-more > summary").click();
  await page.getByRole("button", { name: "keyboard shortcuts", exact: true }).click();
  await expect(page.locator("#help")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/quiet-home-mobile.png", animations: "disabled" });
  await page.setViewportSize({ width: 1280, height: 600 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
  await page.screenshot({ path: "test-results/quiet-home-short.png", animations: "disabled" });
});

test("native shortcut sort preserves favourites, recently opened and alphabetic ordering", async ({ page }) => {
  await page.goto("/");
  await page.locator("#shortcut-sort").selectOption("az");
  await expect(page.locator("#shortcut-grid .site-name")).toHaveText([
    "DuckDuckGo",
    "GitHub",
    "Wikipedia",
  ]);
  await page.locator("#shortcut-sort").selectOption("favorite");
  await expect(page.locator("#shortcut-grid .site-name")).toHaveText([
    "Wikipedia",
    "DuckDuckGo",
    "GitHub",
  ]);
  await page.locator("#shortcut-sort").selectOption("recent");
  await expect(page.locator("#shortcut-grid .site-name")).toHaveCount(3);
  expect(
    await page.locator("#shortcut-grid").evaluate((node) =>
      node.getAnimations({ subtree: true }).length
    ),
  ).toBe(0);
});

test("settings galleries start collapsed, work by keyboard and expand for matching searches", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await expect(page.locator("#preset-grid")).not.toBeVisible();
  await expect(page.locator("#palette-grid")).not.toBeVisible();
  await expect(page.locator('#settings-form [name="theme"]')).toBeVisible();
  await page.locator("#preset-grid-disclosure > summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#preset-grid")).toBeVisible();
  await page.locator("#settings-search").fill("palette");
  await expect(page.locator("#palette-grid")).toBeVisible();
  // A focused native search field consumes Escape to clear its own text.
  await page.locator("#settings .dialog-header h2").click();
  await page.keyboard.press("Escape");
  await open(page);
  await expect(page.locator("#preset-grid")).not.toBeVisible();
});

test("background themes preview and persist without changing palette; cancel restores prior scene", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Backgrounds", exact: true }).click();
  await expect(page.getByRole("button", { name: "Home", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#background-grid button")).toHaveCount(8);
  await page.locator('[data-background="mesh"]').click();
  await expect(page.locator("body")).toHaveAttribute("data-pattern", "mesh");
  await expect(page.locator("body")).toHaveAttribute("data-theme", "default");
  await save(page);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-pattern", "mesh");
  await expect(page.locator("body")).toHaveAttribute("data-background-source", "theme");
  expect(
    await page.locator("#workspace").evaluate((node) => getComputedStyle(node).backgroundImage),
  ).toContain("radial-gradient");
  await page.getByRole("button", { name: "Backgrounds", exact: true }).click();
  await page.locator('[data-background="dusk"]').click();
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).toHaveAttribute("data-pattern", "mesh");
  await page.screenshot({ path: "test-results/quiet-background-mesh.png", animations: "disabled" });
});

test("switching to a background theme preserves a custom image for later use", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Backgrounds", exact: true }).click();
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGPQy94LRAwQCgAjOgVZ0ti5iwAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.locator("#wallpaper-file").setInputFiles({
    name: "custom.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(page.locator("#wallpaper-message")).toContainText("Image ready");
  await save(page);
  await page.getByRole("button", { name: "Backgrounds", exact: true }).click();
  await page.locator('[data-background="coast"]').click();
  await save(page);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-background-source", "theme");
  await expect(page.locator("#home")).toHaveClass(/has-wallpaper/);
  expect(await page.locator("#home").evaluate((node) => getComputedStyle(node, "::before").display))
    .toBe("none");
  await page.getByRole("button", { name: "Backgrounds", exact: true }).click();
  await page.locator('#settings-form [name="backgroundSource"]').selectOption("image");
  await save(page);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-background-source", "image");
  await expect(page.locator("#home")).toHaveClass(/has-wallpaper/);
  expect(await page.locator("#home").evaluate((node) => getComputedStyle(node, "::before").display))
    .not.toBe("none");
  const data = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
  expect(data.settings.pattern).toBe("coast");
  expect(JSON.stringify(data)).not.toContain("blob:");
});

test("a repeated notification survives the prior toast's exit timer", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await page.clock.install();
  await page.locator("#clear-history").click();
  await expect(page.locator("#toast")).toHaveAttribute("data-visible", "true");
  await page.clock.runFor(4201);
  await expect(page.locator("#toast")).not.toHaveAttribute("data-visible", "true");
  await page.locator("#clear-history").click();
  await page.clock.runFor(200);
  await expect(page.locator("#toast")).toBeVisible();
  await expect(page.locator("#toast")).toHaveAttribute("data-visible", "true");
  await expect(page.locator("#toast")).toHaveText("Local app history cleared.");
  await page.clock.runFor(4400);
  await expect(page.locator("#toast")).toBeHidden();
});
