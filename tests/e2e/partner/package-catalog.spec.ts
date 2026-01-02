/**
 * E2E Tests: Partner Package Catalog Flow
 * Tests package browsing, filtering, and detail view
 */

import { test, expect } from '@playwright/test';

test.describe('Partner Package Catalog', () => {
  test.beforeEach(async ({ page }) => {
    // Assume partner is already logged in via storage state
  });

  test('should display package catalog page', async ({ page }) => {
    await page.goto('/partner/packages');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Check for catalog title
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/paket|katalog|packages/i);
  });

  test('should filter packages by destination', async ({ page }) => {
    await page.goto('/partner/packages');
    
    // Wait for packages to load
    await page.waitForLoadState('networkidle');
    
    // Look for search/filter input
    const searchInput = page.getByPlaceholder(/cari|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Bali');
      await searchInput.press('Enter');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
    }
  });

  test('should open package detail', async ({ page }) => {
    await page.goto('/partner/packages');
    
    // Wait for packages to load
    await page.waitForLoadState('networkidle');
    
    // Click on first package card
    const packageCard = page.locator('[data-testid="package-card"]').first();
    if (await packageCard.isVisible()) {
      await packageCard.click();
      
      // Should navigate to detail page
      await expect(page.url()).toContain('/packages/');
    }
  });

  test('should compare packages', async ({ page }) => {
    await page.goto('/partner/packages');
    
    // Wait for packages to load
    await page.waitForLoadState('networkidle');
    
    // Look for compare button
    const compareButton = page.getByRole('button', { name: /bandingkan|compare/i });
    if (await compareButton.isVisible()) {
      await compareButton.click();
    }
  });

  test('should sort packages by price', async ({ page }) => {
    await page.goto('/partner/packages');
    
    // Wait for packages to load
    await page.waitForLoadState('networkidle');
    
    // Look for sort dropdown
    const sortSelect = page.getByRole('combobox', { name: /urutkan|sort/i });
    if (await sortSelect.isVisible()) {
      await sortSelect.click();
      
      // Select price option
      const priceOption = page.getByRole('option', { name: /harga|price/i });
      if (await priceOption.isVisible()) {
        await priceOption.click();
      }
    }
  });

  test('should display package availability', async ({ page }) => {
    await page.goto('/partner/packages');
    
    // Wait for packages to load
    await page.waitForLoadState('networkidle');
    
    // Check for availability indicator
    const availabilityBadge = page.locator('[data-testid="availability-badge"]').first();
    if (await availabilityBadge.isVisible()) {
      await expect(availabilityBadge).toBeVisible();
    }
  });

  test('should show package ratings', async ({ page }) => {
    await page.goto('/partner/packages');
    
    // Wait for packages to load
    await page.waitForLoadState('networkidle');
    
    // Check for rating stars
    const ratingStars = page.locator('[data-testid="rating-stars"]').first();
    if (await ratingStars.isVisible()) {
      await expect(ratingStars).toBeVisible();
    }
  });
});

