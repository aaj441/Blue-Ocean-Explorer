import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login page", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should display register page", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test("should show validation errors for invalid login", async ({ page }) => {
    await page.goto("/auth/login");

    // Try to submit with invalid email
    await page.locator('input[type="email"]').fill("invalid-email");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]').click();

    // Should show error (validation or server error)
    await expect(page.locator("text=/error|invalid/i")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should show error for non-existent user", async ({ page }) => {
    await page.goto("/auth/login");

    await page.locator('input[type="email"]').fill("nonexistent@example.com");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]').click();

    // Should show unauthorized error
    await expect(
      page.locator("text=/invalid|unauthorized|not found/i"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should navigate between login and register", async ({ page }) => {
    await page.goto("/auth/login");

    // Click link to register
    await page.locator('a[href*="register"]').click();
    await expect(page).toHaveURL(/.*register/);

    // Click link back to login
    await page.locator('a[href*="login"]').click();
    await expect(page).toHaveURL(/.*login/);
  });

  test("should validate password requirements on register", async ({
    page,
  }) => {
    await page.goto("/auth/register");

    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[type="password"]').fill("short");
    await page.locator('button[type="submit"]').click();

    // Should show password length error
    await expect(page.locator("text=/8 characters/i")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Protected Routes", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test("should redirect to dashboard after login", async ({ page }) => {
    // This test would require a test user account
    // Skip in CI or create fixture data
    test.skip(
      !process.env.TEST_USER_EMAIL,
      "Requires test user credentials",
    );

    await page.goto("/auth/login");
    await page
      .locator('input[type="email"]')
      .fill(process.env.TEST_USER_EMAIL!);
    await page
      .locator('input[type="password"]')
      .fill(process.env.TEST_USER_PASSWORD!);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });
});
