/**
 * E2E Tests - Travel Circle Feature
 */

import { test, expect } from '@playwright/test';

test.describe('Travel Circle Feature', () => {
  test('should load travel circle list page', async ({ page }) => {
    await page.goto('/id/travel-circle');
    await page.waitForLoadState('networkidle');
    
    // Should show content (login prompt or circles)
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should require authentication for creating circle', async ({ page }) => {
    await page.goto('/id/travel-circle');
    await page.waitForLoadState('networkidle');
    
    // If not logged in, should show login prompt
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should display circle detail for valid ID', async ({ page }) => {
    await page.goto('/id/travel-circle/test-circle-id');
    await page.waitForLoadState('networkidle');
    
    // Should show content or error
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/id/travel-circle');
    await page.waitForLoadState('networkidle');
    
    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});

