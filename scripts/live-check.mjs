// Live deployment check: logs in through the optional password gate, then
// loads a real HTTPS destination through every engine via the deployed relay.
// Never part of CI; run it deliberately against your own site.
//
//   LIVE_SITE_PASSWORD=your-site-password npm run test:live
import { chromium, expect } from "@playwright/test";
import { ENGINES } from "../public/shared.js";

const base = process.env.LIVE_SITE || "https://ojjyproxy.ojjy.deno.net/";
const password = process.env.LIVE_SITE_PASSWORD;
if (!password) {
  console.error("Set LIVE_SITE_PASSWORD (the site password) before running.");
  process.exit(1);
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(base);
  if (await page.locator('input[name="password"]').count()) {
    await page.locator('input[name="password"]').fill(password);
    await page.locator("button[type=submit]").click();
  }
  await expect(page.getByRole("heading", { name: "ojjyProxy", exact: true })).toBeVisible();
  for (const engine of ENGINES) {
    await page.goto(base);
    await page.getByRole("button", { name: "customize", exact: true }).click();
    await page.locator("#engine-select").selectOption(engine.id);
    await page.getByRole("button", { name: "save settings", exact: true }).click();
    await page.locator("#new-tab").click();
    await page.locator("#home-input").fill("https://example.com/");
    await page.locator("#home-form").evaluate((form) => form.requestSubmit());
    await expect(
      page.frameLocator(".runtime-frame:not([hidden])").frameLocator("#website").getByRole(
        "heading",
        { name: "Example Domain" },
      ),
    ).toBeVisible({ timeout: 60000 });
    console.log(`${engine.id}: PASS`);
  }
  console.log("All engines loaded through the deployed relay.");
} finally {
  await browser.close();
}
