import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should complete user registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Register');
    await expect(page).toHaveURL('/auth/register');

    // Fill out registration form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.check('[data-testid="accept-terms-checkbox"]');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
  });

  test('should complete user login flow', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login');
    await expect(page).toHaveURL('/auth/login');

    // Fill out login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/auth/register');

    // Try to submit with invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'weak');
    await page.fill('[data-testid="name-input"]', 'A');
    await page.click('[data-testid="register-button"]');

    // Should show validation errors
    await expect(page.locator('text=Invalid email format')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible();
  });

  test('should handle login with incorrect credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/auth/login');
  });

  test('should logout user successfully', async ({ page }) => {
    // First login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');

    // Open user menu and logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Register')).toBeVisible();
  });

  test('should persist login state across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.check('[data-testid="remember-me-checkbox"]');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/markets');

    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('text=Please log in to continue')).toBeVisible();
  });

  test('should redirect back to intended page after login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/markets');
    await expect(page).toHaveURL('/auth/login');

    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Should redirect back to originally requested page
    await expect(page).toHaveURL('/markets');
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to all main sections', async ({ page }) => {
    // Test navigation to Markets
    await page.click('text=Markets');
    await expect(page).toHaveURL('/markets');
    await expect(page.locator('h1:has-text("Markets")')).toBeVisible();

    // Test navigation to Opportunities
    await page.click('text=Opportunities');
    await expect(page).toHaveURL('/opportunities');
    await expect(page.locator('h1:has-text("Opportunities")')).toBeVisible();

    // Test navigation to Boards
    await page.click('text=Boards');
    await expect(page).toHaveURL('/boards');
    await expect(page.locator('h1:has-text("Boards")')).toBeVisible();

    // Test navigation to Strategy
    await page.click('text=Strategy');
    await expect(page).toHaveURL('/strategy');
    await expect(page.locator('h1:has-text("Strategy")')).toBeVisible();
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.click('text=Markets');
    
    const marketsLink = page.locator('[data-testid="nav-markets"]');
    await expect(marketsLink).toHaveClass(/active/);
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu should be hidden initially
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).not.toBeVisible();

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();

    // Navigate using mobile menu
    await page.click('[data-testid="mobile-nav-markets"]');
    await expect(page).toHaveURL('/markets');
  });
});

test.describe('User Profile', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display user information correctly', async ({ page }) => {
    await page.click('[data-testid="user-menu-button"]');
    
    await expect(page.locator('text=Test User')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
    await expect(page.locator('[data-testid="credit-balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-tier"]')).toBeVisible();
  });

  test('should allow user to update profile', async ({ page }) => {
    await page.click('[data-testid="user-menu-button"]');
    await page.click('text=Profile');

    await expect(page).toHaveURL('/dashboard/preferences');

    // Update profile information
    await page.fill('[data-testid="name-input"]', 'Updated Test User');
    await page.fill('[data-testid="bio-input"]', 'This is my updated bio');
    await page.click('[data-testid="save-profile-button"]');

    // Should show success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Verify changes are reflected in UI
    await page.click('[data-testid="user-menu-button"]');
    await expect(page.locator('text=Updated Test User')).toBeVisible();
  });

  test('should allow user to change preferences', async ({ page }) => {
    await page.goto('/dashboard/preferences');

    // Change theme preference
    await page.selectOption('[data-testid="theme-select"]', 'dark');
    
    // Change notification preferences
    await page.uncheck('[data-testid="email-notifications-checkbox"]');
    await page.check('[data-testid="push-notifications-checkbox"]');

    await page.click('[data-testid="save-preferences-button"]');

    // Should show success message
    await expect(page.locator('text=Preferences updated successfully')).toBeVisible();

    // Verify theme change
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});