import { expect, test } from "@playwright/test";

test("neutral shell metadata, engine picker and linked credits", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("ojjy");
  await expect(page.getByRole("heading", { name: "ojjy", exact: true })).toBeVisible();
  expect(await page.locator('meta[name="description"]').getAttribute("content")).not.toMatch(
    /proxy|scramjet|titanium|ultraviolet/i,
  );
  await page.locator("#global-settings").click();
  const names = await page.locator("#engine-select option").allTextContents();
  expect(names).toHaveLength(6);
  expect(names.join(" ")).not.toMatch(/scramjet|ultraviolet|titanium|headless|proxy/i);
  expect(await page.locator("#engine-select").inputValue()).toBe("sj-1.1.0");
  await page.keyboard.press("Escape");
  await page.locator("#home-more > summary").click();
  await page.getByRole("button", { name: "about & credits", exact: true }).click();
  await expect(page.locator('#library-content a[href="/credits.html"]')).toBeVisible();
  const credits = await page.request.get("/credits.html");
  expect(credits.ok()).toBe(true);
  const text = await credits.text();
  expect(text).toContain("massive credits to The Fool");
  expect(text).toContain("https://github.com/jo-jo-home/ojjyProxy");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page).toHaveTitle("ojjy");
});
