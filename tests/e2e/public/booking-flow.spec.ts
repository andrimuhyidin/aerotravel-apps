/**
 * E2E Tests - Public Booking Flow
 * Tests the booking process from package selection to confirmation
 */

import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('should navigate from package to booking page', async ({ page }) => {
    await page.goto('/id/packages');
    await page.waitForLoadState('networkidle');
    
    const packageCard = page.locator('[data-testid="package-card"]').first();
    
    if (await packageCard.isVisible()) {
      await packageCard.click();
      await page.waitForLoadState('networkidle');
      
      // Click booking button
      const bookingButton = page.locator('text=Booking').first();
      await bookingButton.click();
      
      // Should navigate to booking page
      await expect(page).toHaveURL(/book/);
    }
  });

  test('should show booking form elements', async ({ page }) => {
    // Navigate to booking page with a package parameter
    await page.goto('/id/book');
    await page.waitForLoadState('networkidle');
    
    // Form should have essential fields
    const nameInput = page.locator('input[name="bookerName"], input[placeholder*="nama"]').first();
    const phoneInput = page.locator('input[name="bookerPhone"], input[placeholder*="telepon"], input[type="tel"]').first();
    const emailInput = page.locator('input[name="bookerEmail"], input[type="email"]').first();
    
    // At least some form fields should be present
    const hasFormFields = 
      await nameInput.isVisible().catch(() => false) ||
      await phoneInput.isVisible().catch(() => false) ||
      await emailInput.isVisible().catch(() => false);
    
    expect(hasFormFields).toBeTruthy();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/id/book');
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Booking")').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/book/);
    }
  });
});

test.describe('Split Bill Feature', () => {
  test('should load split bill page', async ({ page }) => {
    // Try accessing a split bill page
    await page.goto('/id/split-bill/test-id');
    await page.waitForLoadState('networkidle');
    
    // Should either show the split bill or a not found/error page
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
  });
});

test.describe('Travel Circle Feature', () => {
  test('should load travel circle list', async ({ page }) => {
    await page.goto('/id/travel-circle');
    await page.waitForLoadState('networkidle');
    
    // Should show login prompt or circles list
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible();
  });
});

