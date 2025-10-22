import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should display home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Blue Ocean Explorer|Home/i);
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for main navigation elements
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("should navigate to markets page", async ({ page }) => {
    await page.goto("/markets");
    await expect(page).toHaveURL(/.*markets/);
  });

  test("should navigate to opportunities page", async ({ page }) => {
    await page.goto("/opportunities");
    await expect(page).toHaveURL(/.*opportunities/);
  });

  test("should navigate to pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveURL(/.*pricing/);
  });

  test("should handle 404 pages gracefully", async ({ page }) => {
    const response = await page.goto("/nonexistent-page");
    // Should either show 404 or redirect
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Responsive Design", () => {
  test("should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should render without horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
  });

  test("should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page.locator("body")).toBeVisible();
  });

  test("should work on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    await expect(page.locator("body")).toBeVisible();
  });
});
