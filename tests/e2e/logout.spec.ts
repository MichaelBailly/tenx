import { expect, test } from "@playwright/test";

test.describe("Logout Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // First we need to login
    await page.goto("/login");
    await page.fill('input[name="username"]', "test_user");
    await page.fill('input[name="password"]', "test_password");
    await page.click('button[type="submit"]');

    // Verify we're logged in and on the app page
    await expect(page).toHaveURL("/app");
  });

  test("logs out the user when clicking logout button", async ({ page }) => {
    // Click the logout button
    await page.click('button[aria-label="Log out"]');

    // Verify redirect to login page
    await expect(page).toHaveURL("/login");

    // Try to access app page directly
    await page.goto("/app");

    // Verify we get redirected back to login (since we're logged out)
    await expect(page).toHaveURL("/login");
  });

  test("logout button is accessible via keyboard", async ({ page }) => {
    // Focus the logout button and press Enter
    await page.focus('button[aria-label="Log out"]');
    await page.keyboard.press("Enter");

    // Verify redirect to login page
    await expect(page).toHaveURL("/login");
  });
});
