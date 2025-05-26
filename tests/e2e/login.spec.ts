import { expect, test } from "@playwright/test";

test.describe("Login Page", () => {
  test("shows error message with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Wait for Vue component to be fully hydrated
    await page.waitForFunction(() => {
      return (
        document.readyState === "complete" &&
        document.querySelector("#__nuxt") &&
        !document.querySelector("[data-island-uid]")
      );
    });
    await page.waitForTimeout(500);

    // Fill in invalid credentials
    await page.fill('input[name="username"]', "invalid_user");
    await page.fill('input[name="password"]', "invalid_password");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the error message to appear
    await page.waitForSelector('[role="alert"]', { state: "visible" });

    // Check for error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("Invalid credentials");
  });

  test("shows form validation for empty fields", async ({ page }) => {
    await page.goto("/login");

    // Try to submit without filling any fields
    await page.click('button[type="submit"]');

    // Check that form validation prevents submission (should stay on login page)
    await expect(page).toHaveURL("/login");
  });

  test("shows loading state during submission", async ({ page }) => {
    await page.goto("/login");

    // Wait for Vue component to be fully hydrated
    await page.waitForFunction(() => {
      return (
        document.readyState === "complete" &&
        document.querySelector("#__nuxt") &&
        !document.querySelector("[data-island-uid]")
      );
    });
    await page.waitForTimeout(500);

    // Add artificial delay to the login API to ensure we can catch the loading state
    await page.route("**/api/auth/login", async (route) => {
      // Add a delay before processing the request to simulate slow network
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.continue();
    });

    // Fill in some credentials (doesn't matter if they're valid for this test)
    await page.fill('input[name="username"]', "some_user");
    await page.fill('input[name="password"]', "some_password");

    // Start monitoring network requests
    const loginRequestPromise = page.waitForRequest("**/api/auth/login");

    // Submit the form
    await page.click('button[type="submit"]');

    // Immediately check for loading state (should be more reliable now with the delay)
    const submitButton = page.locator('button[type="submit"]');

    // The button should be disabled during submission
    await expect(submitButton).toBeDisabled({ timeout: 100 });

    // The button text should change to "Signing in..."
    await expect(submitButton).toContainText("Signing in...", { timeout: 100 });

    // Wait for the request to complete
    await loginRequestPromise;

    // Wait for loading to finish
    await expect(submitButton).not.toBeDisabled({ timeout: 1000 });
    await expect(submitButton).toContainText("Sign in", { timeout: 1000 });
  });

  test("handles slow network response", async ({ page }) => {
    await page.goto("/login");

    // Wait for Vue component to be fully hydrated
    await page.waitForFunction(() => {
      return (
        document.readyState === "complete" &&
        document.querySelector("#__nuxt") &&
        !document.querySelector("[data-island-uid]")
      );
    });
    await page.waitForTimeout(500);

    // Slow down network to better test loading states
    await page.route("**/api/auth/login", async (route) => {
      // Add a delay before processing the request
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Continue with the original request
      await route.continue();
    });

    await page.fill('input[name="username"]', "test_user");
    await page.fill('input[name="password"]', "test_password");

    // Submit the form
    await page.click('button[type="submit"]');

    // Check loading state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText("Signing in...");

    // Wait for form to be enabled again (after response)
    await expect(submitButton).not.toBeDisabled({ timeout: 2000 });
  });
});
