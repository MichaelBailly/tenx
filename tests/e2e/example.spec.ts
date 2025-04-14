import { expect, test } from "@playwright/test";

test("homepage has correct title and content", async ({ page }) => {
  await page.goto("/");

  // Check for the red div with "Hello" text
  const element = page.locator("div.bg-red-500");
  await expect(element).toBeVisible();
  await expect(element).toHaveText("Hello");
});
