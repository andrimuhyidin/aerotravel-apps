/**
 * E2E Tests: Partner Booking Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Partner Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as partner (mock or use test credentials)
    // This would need actual auth setup
  });

  test('should complete booking wizard flow', async ({ page }) => {
    // Navigate to booking wizard
    await page.goto('/partner/bookings/new');
    
    // Step 1: Select package
    await page.waitForSelector('[data-testid="package-select"]');
    // ... test package selection
    
    // Step 2: Select date
    await page.waitForSelector('[data-testid="date-picker"]');
    // ... test date selection
    
    // Step 3: Enter customer details
    await page.fill('[name="customerName"]', 'Test Customer');
    await page.fill('[name="customerPhone"]', '081234567890');
    
    // Step 4: Select payment method
    await page.click('[value="wallet"]');
    
    // Submit booking
    await page.click('[data-testid="submit-booking"]');
    
    // Verify success
    await expect(page).toHaveURL(/\/partner\/bookings\/[a-z0-9-]+/);
  });

  test('should validate wallet balance before booking', async ({ page }) => {
    // Test insufficient balance scenario
    // This would require mocking wallet balance
  });

  test('should show availability dates correctly', async ({ page }) => {
    // Test availability display
    await page.goto('/partner/bookings/new?packageId=test-package-id');
    
    // Verify availability dates are shown
    await expect(page.locator('[data-testid="availability-info"]')).toBeVisible();
  });
});

