import { test, expect } from '@playwright/test';

test.describe('Opportunities Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display opportunities constellation view', async ({ page }) => {
    await page.goto('/opportunities');

    // Should show constellation chart
    await expect(page.locator('[data-testid="constellation-chart"]')).toBeVisible();

    // Should show opportunity nodes
    await expect(page.locator('[data-testid="opportunity-node"]')).toHaveCount(1);
  });

  test('should create new opportunity', async ({ page }) => {
    await page.goto('/opportunities');
    
    // Click create button
    await page.click('button:has-text("Create Opportunity")');

    // Fill opportunity form
    await page.fill('input[name="title"]', 'AI-Powered Analytics Platform');
    await page.fill('textarea[name="description"]', 'Develop an AI platform for business analytics');
    await page.selectOption('select[name="type"]', 'INNOVATION');
    await page.fill('input[name="potentialValue"]', '5000000');
    await page.fill('input[name="timeToMarket"]', '12');
    await page.selectOption('select[name="riskLevel"]', 'MEDIUM');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Opportunity created successfully')).toBeVisible();
  });

  test('should view opportunity details', async ({ page }) => {
    await page.goto('/opportunities');

    // Click on an opportunity
    await page.click('[data-testid="opportunity-node"]');

    // Should show opportunity details panel
    await expect(page.locator('[data-testid="opportunity-details"]')).toBeVisible();
    await expect(page.locator('text=EV Charging Infrastructure')).toBeVisible();
    await expect(page.locator('text=Score: 0.85')).toBeVisible();
  });

  test('should add opportunity to board', async ({ page }) => {
    await page.goto('/opportunities');

    // Select an opportunity
    await page.click('[data-testid="opportunity-node"]');

    // Click add to board
    await page.click('button:has-text("Add to Board")');

    // Select a board
    await page.selectOption('select[name="boardId"]', { label: 'Strategic Initiatives' });
    await page.click('button:has-text("Add")');

    // Should show success message
    await expect(page.locator('text=Added to board')).toBeVisible();
  });

  test('should filter opportunities by type', async ({ page }) => {
    await page.goto('/opportunities');

    // Apply type filter
    await page.click('button:has-text("Filters")');
    await page.check('input[value="BLUE_OCEAN"]');
    await page.click('button:has-text("Apply")');

    // Should update constellation view
    await expect(page.locator('[data-testid="filter-badge"]:has-text("Blue Ocean")')).toBeVisible();
  });

  test('should create and simulate scenarios', async ({ page }) => {
    await page.goto('/opportunities/1/scenarios');

    // Click create scenario
    await page.click('button:has-text("Create Scenario")');

    // Fill scenario form
    await page.fill('input[name="name"]', 'Best Case Scenario');
    await page.fill('textarea[name="description"]', 'Market conditions are favorable');
    await page.fill('input[name="probability"]', '0.7');
    await page.fill('input[name="impact"]', '0.9');

    // Add assumptions
    await page.click('button:has-text("Add Assumption")');
    await page.fill('input[name="assumptions[0].key"]', 'Market Growth');
    await page.fill('input[name="assumptions[0].value"]', '30%');

    // Submit
    await page.click('button[type="submit"]');

    // Should show created scenario
    await expect(page.locator('text=Best Case Scenario')).toBeVisible();
    await expect(page.locator('text=Probability: 70%')).toBeVisible();
  });
});