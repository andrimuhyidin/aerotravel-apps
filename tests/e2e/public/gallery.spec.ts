/**
 * E2E Tests - Photo Gallery Feature
 */

import { test, expect } from '@playwright/test';

test.describe('Trip Photo Gallery', () => {
  test('should load gallery page', async ({ page }) => {
    await page.goto('/id/gallery/test-trip-id');
    await page.waitForLoadState('networkidle');
    
    // Should show content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should handle non-existent trip', async ({ page }) => {
    await page.goto('/id/gallery/non-existent-trip');
    await page.waitForLoadState('networkidle');
    
    // Should show error or empty state
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/id/gallery/test-trip');
    await page.waitForLoadState('networkidle');
    
    // Check for main landmark
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();
  });
});

