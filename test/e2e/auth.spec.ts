import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.selectOption('select[name="role"]', 'analyst');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show welcome message
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill with invalid credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL('/auth/login');
  });

  test('should logout user', async ({ page }) => {
    // First login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Click user menu and logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Should not show user menu
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
    
    // Should show message
    await expect(page.locator('text=Please login to continue')).toBeVisible();
  });
});