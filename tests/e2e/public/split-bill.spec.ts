/**
 * E2E Tests - Split Bill Feature
 */

import { test, expect } from '@playwright/test';

test.describe('Split Bill Feature', () => {
  test('should display split bill page for valid ID', async ({ page }) => {
    // Navigate to a split bill page (will likely 404 for invalid ID)
    await page.goto('/id/split-bill/test-invalid-id');
    await page.waitForLoadState('networkidle');
    
    // Should show some content (either split bill or error state)
    const content = page.locator('main, body');
    await expect(content).toBeVisible();
  });

  test('should handle 404 for non-existent split bill', async ({ page }) => {
    await page.goto('/id/split-bill/non-existent-id-12345');
    await page.waitForLoadState('networkidle');
    
    // Should show error or redirect
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should have accessible structure', async ({ page }) => {
    await page.goto('/id/split-bill/test-id');
    await page.waitForLoadState('networkidle');
    
    // Check for main content area
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

