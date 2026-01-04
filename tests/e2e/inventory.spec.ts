/**
 * E2E Tests: Inventory Management
 * Test inventory management flows
 */

import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test('should display inventory page', async ({ page }) => {
    await page.goto('/id/console/operations/inventory');
    await expect(page.locator('h1, h2')).toContainText(/Inventory/i);
  });

  test('should show inventory stats', async ({ page }) => {
    await page.goto('/id/console/operations/inventory');
    // Should show stats cards
    await expect(page.locator('text=/Total|Stok/i')).toBeVisible();
  });
});
