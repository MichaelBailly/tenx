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

    await page.goto("/login/reset-password");
    await expect(page).toHaveURL("/app");
  });

  test("stays on login page after invalid session is cleared", async ({
    page,
    context,
  }) => {
    // Set an invalid session cookie
    await context.addCookies([
      {
        name: "session",
        value: "invalid-session-id",
        domain: new URL(page.url()).hostname,
        path: "/",
      },
    ]);

    // Try to access login page with invalid session
    await page.goto("/login");

    // Verify we stay on login page
    await expect(page).toHaveURL("/login");

    // Verify the cookie was cleared
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((cookie) => cookie.name === "session");
    expect(sessionCookie?.value || "").not.toBe("invalid-session-id");
  });

  test("non-protected paths don't trigger redirects", async ({ page }) => {
    // Try to access a non-protected path without being logged in
    await page.goto("/");
    await expect(page).toHaveURL("/");

    await page.goto("/about");
    await expect(page).toHaveURL("/about");
  });
});
