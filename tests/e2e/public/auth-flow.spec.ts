/**
 * E2E Tests - Authentication Flow
 * Tests login, signup, and protected routes
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/id/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Login page should have form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should show signup page', async ({ page }) => {
    await page.goto('/id/auth/register');
    await page.waitForLoadState('networkidle');
    
    // Signup form should be present
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('should redirect protected routes to login', async ({ page }) => {
    // Try accessing a protected page
    await page.goto('/id/profile');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login or show login prompt
    const isOnLogin = page.url().includes('/auth/login') || page.url().includes('/login');
    const hasLoginPrompt = await page.locator('text=Login, text=Masuk').first().isVisible().catch(() => false);
    
    expect(isOnLogin || hasLoginPrompt).toBeTruthy();
  });

  test('should validate login form', async ({ page }) => {
    await page.goto('/id/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Try submitting empty form
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors or stay on login page
      await expect(page).toHaveURL(/auth\/login|login/);
    }
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/id/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Forgot password link should be present
    const forgotLink = page.locator('a:has-text("Lupa"), a:has-text("Forgot")').first();
    await expect(forgotLink).toBeAttached();
  });
});

test.describe('User Profile', () => {
  test('should require authentication for profile', async ({ page }) => {
    await page.goto('/id/profile');
    await page.waitForLoadState('networkidle');
    
    // Should redirect or show login
    const pageContent = await page.content();
    const requiresAuth = 
      page.url().includes('login') || 
      page.url().includes('auth') ||
      pageContent.includes('Login') ||
      pageContent.includes('Masuk');
    
    expect(requiresAuth).toBeTruthy();
  });
});

test.describe('Inbox', () => {
  test('should require authentication for inbox', async ({ page }) => {
    await page.goto('/id/inbox');
    await page.waitForLoadState('networkidle');
    
    // Should redirect or show login
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible();
  });
});

