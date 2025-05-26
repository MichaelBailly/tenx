import { expect, test } from "@playwright/test";

test.describe("Redirection Logic (US1.6)", () => {
  test("redirects from paths starting with /app to /login when not authenticated", async ({
    page,
  }) => {
    // Try to access protected pages directly without logging in
    await page.goto("/app");
    await expect(page).toHaveURL("/login");

    // Try with a subpath
    await page.goto("/app/music");
    await expect(page).toHaveURL("/login");
  });

  test("redirects from paths starting with /login to /app when already authenticated", async ({
    page,
  }) => {
    // First, log in
    await page.goto("/login");
    await page.fill('input[name="username"]', "test_user");
    await page.fill('input[name="password"]', "test_password");
    await page.click('button[type="submit"]');

    // Verify we're on the app page
    await expect(page).toHaveURL("/app");

    // Try to access login page and login subpaths while authenticated
    await page.goto("/login");
    await expect(page).toHaveURL("/app");
  });

  test("non-protected paths don't trigger redirects", async ({ page }) => {
    // Try to access a non-protected path without being logged in
    await page.goto("/");
    await expect(page).toHaveURL("/");

    await page.goto("/about");
    await expect(page).toHaveURL("/about");
  });
});
