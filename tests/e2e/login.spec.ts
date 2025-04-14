import { expect, test } from "@playwright/test";

test.describe("Login Page", () => {
  test("shows error message with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.fill('input[name="username"]', "invalid_user");
    await page.fill('input[name="password"]', "invalid_password");

    // Submit the form
    await page.click('button[type="submit"]');

    // Check for error message
    const errorMessage = await page.locator('div[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("Invalid credentials");
  });

  test("redirects to /app with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in valid credentials (assuming these exist in test database)
    await page.fill('input[name="username"]', "test_user");
    await page.fill('input[name="password"]', "test_password");

    // Submit the form
    await page.click('button[type="submit"]');

    // Check redirection
    await expect(page).toHaveURL("/app");
  });

  test("shows loading state during submission", async ({ page }) => {
    await page.goto("/login");

    // Fill in credentials
    await page.fill('input[name="username"]', "test_user");
    await page.fill('input[name="password"]', "test_password");

    // Start intercepting the login request
    const loginPromise = page.waitForRequest("/api/auth/login");

    // Submit the form
    await page.click('button[type="submit"]');

    // Check loading state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText("Signing in...");

    // Wait for request to complete
    await loginPromise;
  });
});
