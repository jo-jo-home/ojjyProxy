import { expect, test } from "@playwright/test";
import http from "node:http";
import { ENGINES } from "../../public/shared.js";
let fixture;
test.beforeAll(async () => {
  fixture = http.createServer((request, response) => {
    if (request.url === "/api/ping") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, cookies: request.headers.cookie || "" }));
      return;
    }
    response.writeHead(200, {
      "content-type": "text/html",
      "set-cookie": "servercookie=two; Path=/",
    });
    response.end(
      `<!doctype html><html><head><title>ojjyProxy fixture</title></head><body><h1>${
        request.url === "/next" ? "next fixture page" : "owned relay works"
      }</h1><a href="/next">next page</a><script>document.body.dataset.script="rewritten-script-ran";document.cookie="clientcookie=one; path=/";setTimeout(()=>fetch('/api/ping').then(r=>r.json()).then(data=>{document.body.dataset.fetched=String(data.ok);document.body.dataset.cookies=data.cookies}),100);</script></body></html>`,
    );
  });
  await new Promise((resolve) => fixture.listen(8899, resolve));
});
test.afterAll(async () => {
  await new Promise((resolve) => fixture.close(resolve));
});
test("blue home, full selector, bookmarks and responsive settings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ojjyProxy", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/home-desktop.png", animations: "disabled" });
  await page.getByRole("button", { name: "customize", exact: true }).click();
  await expect(page.locator("#engine-select")).toHaveValue("sj-1.1.0");
  await expect(page.locator("#engine-select option")).toHaveCount(5);
  await page.locator("#settings [data-close]").first().click();
  await page.getByRole("button", { name: /add a shortcut/ }).click();
  await page.locator("#bookmark-form [name=name]").fill("My fixture");
  await page.locator("#bookmark-form [name=url]").fill("http://localhost:8899/");
  await page.getByRole("button", { name: "save bookmark", exact: true }).click();
  await expect(page.locator("#shortcut-grid")).toContainText("My fixture");
  await page.reload();
  await expect(page.locator("#shortcut-grid")).toContainText("My fixture");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "customize", exact: true }).click();
  await expect(page.getByRole("button", { name: "save settings", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/settings-mobile.png" });
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});
for (const engine of ENGINES) {
  test(`${engine.id} loads through the owned Wisp relay`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "customize", exact: true }).click();
    await page.locator("#engine-select").selectOption(engine.id);
    if (process.env.PROXY_TEST_TRANSPORT) {
      await page.locator("#settings-form [name=transport]").selectOption(
        process.env.PROXY_TEST_TRANSPORT,
      );
    }
    await page.getByRole("button", { name: "save settings", exact: true }).click();
    // The existing blank tab retains its selected engine until explicitly switched.
    await page.locator("#new-tab").click();
    await page.locator("#home-input").fill("http://localhost:8899/");
    await page.locator("#home-form").evaluate((form) => form.requestSubmit());
    const runtime = page.frameLocator(".runtime-frame:not([hidden])");
    const website = runtime.frameLocator("#website");
    await expect(website.getByRole("heading", { name: "owned relay works" })).toBeVisible({
      timeout: 40000,
    });
    expect(errors).toEqual([]);
    await expect(website.locator("body")).toHaveAttribute("data-script", "rewritten-script-ran");
    await expect(website.locator("body")).toHaveAttribute("data-fetched", "true");
    await expect(website.locator("body")).toHaveAttribute("data-cookies", /clientcookie=one/);
    await expect(website.locator("body")).toHaveAttribute("data-cookies", /servercookie=two/);
    await expect(page.locator("#browser-error")).toBeHidden();
    expect(errors).toEqual([]);
    await page.locator("#nav-collapse").click();
    await expect(page.locator("#show-controls")).toBeVisible();
    await page.locator("#show-controls").click();
    await page.locator("#nav-bookmark").click();
    await expect(page.locator("#bookmark-form [name=url]")).toHaveValue("http://localhost:8899/");
    await page.locator("#bookmark-dialog [data-close]").click();
    await website.getByRole("link", { name: "next page", exact: true }).click();
    await expect(website.getByRole("heading", { name: "next fixture page" })).toBeVisible();
    await expect(page.locator("#address")).toHaveValue("http://localhost:8899/next");
    await page.locator("#nav-back").click();
    await expect(website.getByRole("heading", { name: "owned relay works" })).toBeVisible();
    await page.locator("#nav-settings").click();
    await page.locator("#settings-form [name=blocked]").fill("localhost");
    await page.locator("#switch-engine").click();
    await expect(
      website.getByText("This domain is blocked by your ojjyProxy domain filter.", { exact: true }),
    ).toBeVisible();
  });
}
if (process.env.LIVE_PROXY_TESTS === "1") {
  for (const id of ["sj-1.1.0", "sj-2.0.67-alpha.2"]) {
    test(`${id} HTTPS destination through owned Wisp`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "customize", exact: true }).click();
      await page.locator("#engine-select").selectOption(id);
      await page.getByRole("button", { name: "save settings", exact: true }).click();
      await page.locator("#new-tab").click();
      await page.locator("#home-input").fill("https://example.com/");
      await page.locator("#home-form").evaluate((form) => form.requestSubmit());
      await expect(
        page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website").getByRole(
          "link",
          { name: "Learn more" },
        ),
      ).toBeVisible({ timeout: 45000 });
    });
  }
}
