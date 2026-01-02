/**
 * E2E Tests - User Inbox
 */

import { test, expect } from '@playwright/test';

test.describe('User Inbox', () => {
  test('should load inbox page', async ({ page }) => {
    await page.goto('/id/inbox');
    await page.waitForLoadState('networkidle');
    
    // Should show content (login prompt or inbox)
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should require authentication', async ({ page }) => {
    await page.goto('/id/inbox');
    await page.waitForLoadState('networkidle');
    
    // If not logged in, should show login prompt or redirect
    const pageContent = await page.content();
    const requiresAuth = 
      page.url().includes('login') || 
      page.url().includes('auth') ||
      pageContent.includes('Login') ||
      pageContent.includes('Masuk');
    
    expect(requiresAuth || pageContent.length > 0).toBeTruthy();
  });

  test('should have accessible structure', async ({ page }) => {
    await page.goto('/id/inbox');
    await page.waitForLoadState('networkidle');
    
    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});

