// Context menus, pinned tabs, folders and undo — behavior checks that run on
// every browser engine. Motion assertions read settled computed styles, not
// mid-transition values. Menu items are matched by exact text so "Open" never
// collides with "Open in new tab".
import { expect, test } from "@playwright/test";
import http from "node:http";
const KEY = "ojjyproxy-app-v1";
const state = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);

// A minimal destination site: menu tests only need a page that loads through
// the engine. proxy.spec.mjs starts its own richer fixture while its file runs;
// with workers=1 the files never overlap, so this one binds the same port.
let fixture;
test.beforeAll(async () => {
  fixture = http.createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      "<!doctype html><html><head><title>ojjy fixture</title></head>" +
        '<body><h1>owned relay works</h1><input id="remote-field" /></body></html>',
    );
  });
  await new Promise((resolve) => fixture.listen(8899, resolve));
});
test.afterAll(async () => {
  await new Promise((resolve) => fixture.close(resolve));
});

const topMenu = (page) => page.locator(".context-menu2:not(.submenu)");
const menuItem = (page, label) =>
  topMenu(page).locator(".menu-item").filter({
    has: page.getByText(label, { exact: true }),
  });
const menuItemRegex = (page, pattern) =>
  topMenu(page).locator(".menu-item").filter({ hasText: pattern });

async function openCardMenu(page, name, method = "pointer") {
  const cell = page.locator(".shortcut-cell").filter({ hasText: name });
  if (method === "pointer") await cell.locator(".shortcut-card").click({ button: "right" });
  else await cell.locator(".card-menu").click();
  await expect(topMenu(page)).toBeVisible();
}

async function browseFixture(page) {
  await page.locator("#home-input").fill("http://localhost:8899/");
  await page.locator("#home-form").evaluate((form) => form.requestSubmit());
  await expect(
    page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website").getByRole(
      "heading",
      {
        name: "owned relay works",
      },
    ),
  ).toBeVisible({ timeout: 25000 });
}

test("shortcut context menu opens by pointer and keyboard and lists every action", async ({ page }) => {
  await page.goto("/");
  await openCardMenu(page, "Wikipedia");
  for (
    const label of [
      "Open",
      "Open in new tab",
      "Open with engine",
      "Edit shortcut",
      "Unfavorite",
      "Copy address",
      "Move to folder",
      "Remove",
    ]
  ) {
    await expect(menuItem(page, label)).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(topMenu(page)).toBeHidden();
  // Menu key opens the same menu from the keyboard, anchored to the card.
  await page.locator(".shortcut-cell").filter({ hasText: "Wikipedia" }).locator(".shortcut-card")
    .focus();
  await page.keyboard.press("Shift+F10");
  await expect(topMenu(page)).toBeVisible();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await expect(topMenu(page).locator(".menu-item:focus")).toHaveText(/Open in new tab/);
  await page.keyboard.press("Enter");
  await expect(page.locator("#browser")).toBeVisible();
  expect((await state(page)).bookmarks).toHaveLength(3);
  await page.locator("#nav-home").click();
  await expect(page.locator("#home")).toBeVisible();
});

test("menu actions favorite, copy and remove with an exact undo restore", async ({ page }) => {
  await page.goto("/");
  await openCardMenu(page, "GitHub");
  await menuItem(page, "Favorite").click();
  await expect(
    page.locator(".shortcut-cell").filter({ hasText: "GitHub" }).locator(".card-star"),
  ).toBeVisible();
  await openCardMenu(page, "GitHub");
  await menuItem(page, "Unfavorite").click();
  await expect(
    page.locator(".shortcut-cell").filter({ hasText: "GitHub" }).locator(".card-star"),
  ).toBeHidden();
  // Copy address is verified through a clipboard stub: Firefox never exposes
  // readText, and headless write permission behavior differs per engine.
  await page.evaluate(() => {
    let stored = null;
    navigator.clipboard.writeText = (text) => {
      stored = text;
      return Promise.resolve();
    };
    self.__copied = () => stored;
  });
  await openCardMenu(page, "GitHub");
  await menuItem(page, "Copy address").click();
  await expect(page.locator("#toast")).toContainText("Address copied");
  await expect.poll(() => page.evaluate(() => self.__copied())).toBe("https://github.com/");
  // Remove acts instantly; undo restores the exact saved record.
  const before = (await state(page)).bookmarks.find((item) => item.name === "GitHub");
  await openCardMenu(page, "GitHub");
  await menuItem(page, "Remove").click();
  await expect(page.locator(".shortcut-cell")).toHaveCount(2);
  await expect(page.locator("#toast")).toContainText("Shortcut removed.");
  await page.getByRole("button", { name: "undo", exact: true }).click();
  await expect(page.locator(".shortcut-cell")).toHaveCount(3);
  expect((await state(page)).bookmarks.find((item) => item.name === "GitHub")).toEqual(before);
  // Expiry without a click drops the undo permanently.
  await openCardMenu(page, "GitHub");
  await menuItem(page, "Remove").click();
  await page.waitForTimeout(7200);
  await expect(page.locator(".shortcut-cell")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "undo", exact: true })).toHaveCount(0);
});

test("one submenu level lists engines and folders with arrow-key control", async ({ page }) => {
  await page.goto("/");
  await openCardMenu(page, "Wikipedia");
  await menuItem(page, "Open with engine").click();
  const sub = page.locator(".context-menu2.submenu");
  await expect(sub).toBeVisible();
  await expect(sub.locator(".menu-item")).toHaveCount(6);
  await expect(sub.locator(".menu-item").first()).toBeFocused();
  // Escape closes only the submenu; the parent menu stays.
  await page.keyboard.press("Escape");
  await expect(sub).toBeHidden();
  await expect(topMenu(page)).toBeVisible();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await expect(sub).toBeVisible();
  // Escape closes the submenu first, then the menu itself.
  await page.keyboard.press("Escape");
  await expect(sub).toBeHidden();
  await expect(topMenu(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(topMenu(page)).toBeHidden();
});

test("default menu shows workspace actions on home and navigation while browsing", async ({ page }) => {
  await page.goto("/");
  await page.locator("#home .home-heading").click({ button: "right" });
  await expect(topMenu(page)).toBeVisible();
  for (const label of ["New tab", "Backgrounds", "Customize", "Connection log", "Panic exit"]) {
    await expect(menuItem(page, label)).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await browseFixture(page);
  // Right-click chrome (not the runtime iframe, which owns its own document).
  await page.locator("#nav-back").click({ button: "right" });
  await expect(topMenu(page)).toBeVisible();
  for (const label of ["Back", "Forward", "Reload", "New tab", "Settings"]) {
    await expect(menuItem(page, label)).toBeVisible();
  }
  await page.keyboard.press("Escape");
});

test("pinned tabs are icon-only, lead the strip, persist across reload", async ({ page }) => {
  await page.goto("/");
  await browseFixture(page);
  const first = page.locator("#tabs .tab").first();
  await first.click({ button: "right" });
  await menuItem(page, "Pin tab").click();
  const pinned = page.locator("#tabs .tab").first();
  await expect(pinned).toHaveClass(/pinned/);
  await expect(pinned.locator(".tab-title")).toBeHidden();
  await expect(pinned.locator(".tab-select")).toHaveAttribute("title", /Pinned/);
  // Middle-click still closes a pinned tab.
  await pinned.click({ button: "middle" });
  await expect(page.locator("#tabs .tab.pinned")).toHaveCount(0);
  // Re-pin and confirm the pin survives the restore path.
  const second = page.locator("#tabs .tab").first();
  await second.click({ button: "right" });
  await menuItem(page, "Pin tab").click();
  await page.reload();
  await expect(page.locator("#tabs .tab").first()).toHaveClass(/pinned/);
  await page.locator("#tabs .tab").first().click({ button: "right" });
  await menuItem(page, "Unpin tab").click();
  await expect(page.locator("#tabs .tab").first()).not.toHaveClass(/pinned/);
});

test("bulk tab actions confirm first; reopen restores a closed tab", async ({ page }) => {
  await page.goto("/");
  await browseFixture(page); // tab 1 browses; closed browsing tabs are reopenable
  await page.locator("#new-tab").click();
  await page.locator("#new-tab").click();
  await expect(page.locator("#tabs .tab")).toHaveCount(3);
  await page.locator("#tabs .tab").nth(2).click({ button: "right" });
  await menuItemRegex(page, /Close other tabs \(2\)/).click();
  await expect(page.locator("#menu-confirm")).toBeVisible();
  await expect(page.locator("#confirm-text")).toContainText("Close 2 other tabs?");
  await page.locator("#menu-confirm [data-close]").click();
  await expect(page.locator("#tabs .tab")).toHaveCount(3);
  await page.locator("#tabs .tab").nth(2).click({ button: "right" });
  await menuItemRegex(page, /Close other tabs \(2\)/).click();
  await page.locator("#confirm-accept").click();
  await expect(page.locator("#tabs .tab")).toHaveCount(1);
  await page.locator("#tabs .tab").first().click({ button: "right" });
  await menuItem(page, "Reopen closed tab").click();
  await expect(page.locator("#tabs .tab")).toHaveCount(2);
  await expect(page.locator("#address")).toHaveValue("http://localhost:8899/");
});

test("pinned order controls keyboard navigation, numbering and the active tab after close", async ({ page }) => {
  await page.goto("/");
  await page.locator("#new-tab").click();
  await page.locator("#new-tab").click();
  const original = await page.locator("#tabs .tab").evaluateAll((nodes) =>
    nodes.map((node) => node.dataset.tabId)
  );
  await page.locator("#tabs .tab").nth(2).click({ button: "right" });
  await menuItem(page, "Pin tab").click();
  await expect(page.locator("#tabs .tab").first()).toHaveAttribute("data-tab-id", original[2]);
  await page.locator("#tabs .tab").first().click({ button: "right" });
  await menuItem(page, "New tab to the right").click();
  await expect(page.locator("#tabs .tab")).toHaveCount(4);
  await expect(page.locator("#tabs .tab.active")).not.toHaveAttribute("data-tab-id", original[0]);
  await expect(page.locator("#tabs .tab").nth(2)).toHaveAttribute("data-tab-id", original[0]);
  await page.locator("#tabs .tab").nth(1).click({ button: "middle" });
  await expect(page.locator("#tabs .tab").nth(1)).toHaveAttribute("data-number", "2");
  await page.locator("#tabs .tab-select").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#tabs .tab.active")).toHaveAttribute("data-tab-id", original[0]);
  await page.locator("#tabs .tab").nth(1).click({ button: "middle" });
  await expect(page.locator("#tabs .tab.active")).toHaveAttribute("data-tab-id", original[1]);
  await page.locator("#tabs .tab").first().click({ button: "right" });
  await menuItemRegex(page, /Close tabs to the right \(1\)/).click();
  await page.locator("#confirm-accept").click();
  await expect(page.locator("#tabs .tab")).toHaveCount(1);
  await expect(page.locator("#tabs .tab")).toHaveAttribute("data-tab-id", original[2]);
});

// Regression for Playwright's Firefox COOP channel collision (#42731). Keep
// actual server headers and trusted input: interception can mask this failure.
test("runtime browsing and reload retain trusted input and page evaluation", async ({ page }) => {
  const response = await page.goto("/");
  expect(response.headers()["cross-origin-opener-policy"]).toBe("same-origin");
  await browseFixture(page);
  await page.reload();
  await page.locator(".brand").click({ button: "right" });
  await expect(menuItem(page, "Reload")).toBeVisible();
  expect(await page.evaluate(() => document.readyState)).toBe("complete");
  await page.keyboard.press("Escape");
  await page.locator("#tabs .tab").first().click({ button: "right" });
  await menuItem(page, "Pin tab").click();
  await expect(page.locator("#tabs .tab")).toHaveClass(/pinned/);
});

test("opening a bookmark with another engine dismisses the library modal", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "ojjyproxy-app-v1",
      JSON.stringify({
        bookmarks: [{
          id: "fixture",
          name: "Fixture",
          url: "http://localhost:8899/",
          favorite: true,
        }],
      }),
    )
  );
  await page.goto("/");
  await page.locator('[data-panel="bookmarks"]').click();
  await page.locator("#library .row-menu").click();
  await menuItem(page, "Open with engine").click();
  await page.locator(".context-menu2.submenu").getByRole("menuitem", {
    name: "Engine stable (1.1.0)",
    exact: true,
  }).click();
  await expect(page.locator("#library")).not.toBeVisible();
  await expect(page.locator("#tabs .tab")).toHaveCount(2);
  await expect(page.locator("#address")).toHaveValue("http://localhost:8899/");
});

test("folders render as sections and move by menu and by drag-drop", async ({ page }) => {
  await page.goto("/");
  await openCardMenu(page, "Wikipedia", "button");
  await menuItem(page, "Edit shortcut").click();
  await page.locator('#bookmark-form [name="folder"]').fill("School");
  await page.getByRole("button", { name: "save bookmark", exact: true }).click();
  const section = page.locator(".folder-section").filter({ hasText: "School" });
  await expect(section).toBeVisible();
  await expect(section.locator(".shortcut-cell")).toHaveCount(1);
  // Menu move for another card.
  await openCardMenu(page, "GitHub");
  await menuItem(page, "Move to folder").click();
  await page.locator(".context-menu2.submenu").locator(".menu-item").filter({ hasText: "School" })
    .click();
  await expect(section.locator(".shortcut-cell")).toHaveCount(2);
  // Drag GitHub onto an unfiled card: back to unfiled.
  const card = page.locator(".shortcut-cell").filter({ hasText: "GitHub" });
  const unfiled = page.locator("#shortcut-grid > .shortcut-cell").filter({ hasText: "DuckDuckGo" });
  await card.dragTo(unfiled);
  await expect(section.locator(".shortcut-cell")).toHaveCount(1);
  // Drag it onto the section header: into the folder again.
  await card.dragTo(section.locator("summary"));
  await expect(section.locator(".shortcut-cell")).toHaveCount(2);
  expect((await state(page)).bookmarks.find((item) => item.name === "GitHub").folder).toBe(
    "School",
  );
  // The sort picker still applies inside sections.
  await page.locator("#shortcut-sort").selectOption("az");
  await expect(
    section.locator(".site-name"),
  ).toHaveText(["GitHub", "Wikipedia"].sort((a, b) => a.localeCompare(b)));
});

test("history rows get a menu with undo removal and a confirmed day clear", async ({ page }) => {
  await page.goto("/");
  await browseFixture(page);
  await page.locator("#nav-home").click();
  await page.getByRole("button", { name: "history", exact: true }).first().click();
  const row = page.locator(".library-row").first();
  await expect(row).toBeVisible();
  await row.click({ button: "right" });
  await menuItem(page, "Remove visit").click();
  await expect(page.locator("#toast")).toContainText("Visit removed.");
  await page.getByRole("button", { name: "undo", exact: true }).click();
  await expect(page.locator(".library-row")).toHaveCount(1);
  await row.click({ button: "right" });
  await menuItem(page, "Clear this day").click();
  await expect(page.locator("#menu-confirm")).toBeVisible();
  await page.locator("#confirm-accept").click();
  await expect(page.locator(".library-empty")).toBeVisible();
});

test("menus stack above open dialogs and stay opacity-only under reduced motion", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "bookmarks", exact: true }).click();
  await expect(page.locator("#library")).toBeVisible();
  await page.locator(".library-row").first().click({ button: "right" });
  const menu = topMenu(page);
  await expect(menu).toBeVisible();
  // Let the 150 ms entrance settle so the probe hits the final geometry.
  await page.waitForTimeout(300);
  const above = await menu.evaluate((node) => {
    const dialog = document.getElementById("library");
    const menuRect = node.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const x = Math.max(menuRect.x + 8, dialogRect.x + 4);
    const y = Math.min(menuRect.y + 8, dialogRect.bottom - 4);
    const hit = document.elementFromPoint(x, y);
    return {
      covered: hit === node || node.contains(hit),
      popover: node.matches(":popover-open"),
      hit: hit ? hit.className || hit.tagName : null,
    };
  });
  expect(above.covered).toBe(true);
  expect(above.popover).toBe(true);
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".library-row").first().click({ button: "right" });
  await expect(menu).toBeVisible();
  expect(await menu.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  await page.keyboard.press("Escape");
});

test("long-press opens the shortcut menu on touch pointers without activating the card", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".shortcut-cell").filter({ hasText: "Wikipedia" }).locator(
    ".shortcut-card",
  );
  const box = await card.boundingBox();
  await card.dispatchEvent("pointerdown", {
    pointerType: "touch",
    clientX: box.x + 12,
    clientY: box.y + 12,
    isPrimary: true,
  });
  await page.waitForTimeout(700);
  await card.dispatchEvent("pointerup", { pointerType: "touch", isPrimary: true });
  await expect(topMenu(page)).toBeVisible();
  await expect(page.locator("#home")).toBeVisible();
  await expect(page.locator("#browser")).toBeHidden();
  await card.dispatchEvent("click", { bubbles: true, cancelable: true });
  await expect(page.locator("#home")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("menus clamp to short mobile viewports and checked states remain accessible with motion off", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 360 });
  await page.goto("/");
  await page.locator("#global-settings").click();
  await page.locator('#settings-form [name="motion"]').selectOption("off");
  await page.getByRole("button", { name: "save settings", exact: true }).click();
  const card = page.locator(".shortcut-cell").filter({ hasText: "Wikipedia" });
  await card.dispatchEvent("contextmenu", { clientX: 389, clientY: 359, bubbles: true });
  await expect(topMenu(page)).toBeVisible();
  const box = await topMenu(page).boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(7);
  expect(box.y).toBeGreaterThanOrEqual(7);
  expect(box.x + box.width).toBeLessThanOrEqual(383);
  expect(box.y + box.height).toBeLessThanOrEqual(353);
  await expect(topMenu(page)).toHaveCSS("opacity", "1");
  await expect(topMenu(page)).toHaveCSS("transform", "none");
  await expect(menuItem(page, "Unfavorite")).toHaveAttribute("aria-checked", "true");
  await page.screenshot({ path: "test-results/menu-mobile-clamped.png" });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1366, height: 768 });
  await openCardMenu(page, "GitHub");
  await page.screenshot({ path: "test-results/menu-desktop.png" });
});

test("collection options rename and remove with confirmation without changing open tabs", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("ojjyproxy-app-v1")) {
      localStorage.setItem(
        "ojjyproxy-app-v1",
        JSON.stringify({
          settings: { showCollections: true },
          collections: [{
            id: "reading",
            name: "Reading",
            tabs: [{ url: "https://example.com/", engine: "sj-1.1.0", title: "Example" }],
          }],
        }),
      );
    }
  });
  await page.goto("/");
  const collection = page.locator("#collection-shortcuts [data-menu=collection]");
  await collection.click({ button: "right" });
  await menuItem(page, "Rename collection").click();
  await expect(page.locator("#collections-dialog")).toBeVisible();
  await expect(page.locator("#collection-list input")).toBeFocused();
  await page.keyboard.press("Escape");
  await collection.click({ button: "right" });
  await menuItem(page, "Remove collection").click();
  await expect(page.locator("#menu-confirm")).toBeVisible();
  await page.locator("#menu-confirm [data-close]").click();
  await expect(collection).toHaveCount(1);
  await collection.click({ button: "right" });
  await menuItem(page, "Remove collection").click();
  await page.locator("#confirm-accept").click();
  await expect(collection).toHaveCount(0);
  await expect(page.locator("#tabs .tab")).toHaveCount(1);
});
