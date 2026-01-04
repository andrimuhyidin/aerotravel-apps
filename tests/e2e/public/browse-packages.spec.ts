/**
 * E2E Tests - Public Package Browsing
 * Tests the package listing and detail pages
 */

import { test, expect } from '@playwright/test';

test.describe('Public Package Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/id/packages');
  });

  test('should load packages page', async ({ page }) => {
    // Page should load successfully
    await expect(page).toHaveTitle(/Paket Wisata|Packages/i);
    
    // Main content should be visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display package cards', async ({ page }) => {
    // Wait for packages to load
    await page.waitForLoadState('networkidle');
    
    // Check for package cards or empty state
    const packageCards = page.locator('[data-testid="package-card"]');
    const emptyState = page.locator('text=Tidak ada paket');
    
    // Either packages are shown or empty state
    const hasPackages = await packageCards.count() > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasPackages || isEmpty).toBeTruthy();
  });

  test('should navigate to package detail', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find and click a package card
    const packageCard = page.locator('[data-testid="package-card"]').first();
    
    if (await packageCard.isVisible()) {
      await packageCard.click();
      
      // Should navigate to detail page
      await expect(page).toHaveURL(/packages\/detail/);
      
      // Detail page should have booking button
      await expect(page.locator('text=Booking')).toBeVisible();
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
    
    // Check for main landmark
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();
    
    // Check for navigation landmark
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
  });

  test('should load package detail with structured data', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Navigate to a package detail
    const packageCard = page.locator('[data-testid="package-card"]').first();
    
    if (await packageCard.isVisible()) {
      await packageCard.click();
      await page.waitForLoadState('networkidle');
      
      // Check for JSON-LD structured data
      const jsonLd = page.locator('script[type="application/ld+json"]');
      await expect(jsonLd).toBeAttached();
    }
  });
});

test.describe('Package Detail Page', () => {
  test('should display package information', async ({ page }) => {
    // Go directly to a known package detail (if exists)
    await page.goto('/id/packages');
    await page.waitForLoadState('networkidle');
    
    const packageCard = page.locator('[data-testid="package-card"]').first();
    
    if (await packageCard.isVisible()) {
      await packageCard.click();
      await page.waitForLoadState('networkidle');
      
      // Check for essential elements
      await expect(page.locator('text=Booking').first()).toBeVisible();
      
      // Back button should be present
      const backButton = page.locator('a[href*="/packages"]').first();
      await expect(backButton).toBeVisible();
    }
  });

  test('should show reviews section', async ({ page }) => {
    await page.goto('/id/packages');
    await page.waitForLoadState('networkidle');
    
    const packageCard = page.locator('[data-testid="package-card"]').first();
    
    if (await packageCard.isVisible()) {
      await packageCard.click();
      await page.waitForLoadState('networkidle');
      
      // Reviews section should exist
      const reviewsSection = page.locator('text=Review').first();
      await expect(reviewsSection).toBeAttached();
    }
  });
});

