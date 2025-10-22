import { test, expect } from '@playwright/test';

test.describe('Markets Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display markets list', async ({ page }) => {
    await page.goto('/markets');

    // Should show page title
    await expect(page.locator('h1')).toContainText('Markets');

    // Should show market cards
    await expect(page.locator('[data-testid="market-card"]')).toHaveCount(2);

    // Should show market details
    await expect(page.locator('text=Electric Vehicles')).toBeVisible();
    await expect(page.locator('text=Renewable Energy')).toBeVisible();
  });

  test('should create new market', async ({ page }) => {
    await page.goto('/markets/new');

    // Fill market form
    await page.fill('input[name="name"]', 'Quantum Computing');
    await page.fill('textarea[name="description"]', 'Analysis of quantum computing market potential');
    await page.selectOption('select[name="industry"]', 'Technology');
    await page.fill('input[name="size"]', '10000000000');
    await page.fill('input[name="growthRate"]', '0.5');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to market details
    await expect(page).toHaveURL(/\/markets\/\d+/);
    
    // Should show created market
    await expect(page.locator('h1')).toContainText('Quantum Computing');
  });

  test('should view market details', async ({ page }) => {
    await page.goto('/markets');

    // Click on a market
    await page.click('text=Electric Vehicles');

    // Should navigate to market details
    await expect(page).toHaveURL(/\/markets\/\d+/);

    // Should show market information
    await expect(page.locator('h1')).toContainText('Electric Vehicles');
    await expect(page.locator('text=Automotive')).toBeVisible();
    await expect(page.locator('text=25% growth')).toBeVisible();
  });

  test('should filter markets', async ({ page }) => {
    await page.goto('/markets');

    // Apply industry filter
    await page.selectOption('select[name="industry"]', 'Energy');

    // Should show only energy markets
    await expect(page.locator('[data-testid="market-card"]')).toHaveCount(1);
    await expect(page.locator('text=Renewable Energy')).toBeVisible();
    await expect(page.locator('text=Electric Vehicles')).not.toBeVisible();
  });

  test('should search markets', async ({ page }) => {
    await page.goto('/markets');

    // Search for a market
    await page.fill('input[name="search"]', 'Electric');

    // Should show matching markets
    await expect(page.locator('[data-testid="market-card"]')).toHaveCount(1);
    await expect(page.locator('text=Electric Vehicles')).toBeVisible();
    await expect(page.locator('text=Renewable Energy')).not.toBeVisible();
  });
});