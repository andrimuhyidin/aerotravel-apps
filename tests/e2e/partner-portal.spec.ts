/**
 * E2E Tests: Partner Portal
 * Test critical flows for Partner/Mitra portal
 */

import { test, expect } from '@playwright/test';

test.describe('Partner Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/id/partner');
  });

  test('should display partner dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Partner|Dashboard/i);
  });

  test('should show wallet balance card', async ({ page }) => {
    await expect(page.locator('text=/Saldo|Wallet|Balance/i')).toBeVisible();
  });

  test('should navigate to bookings list', async ({ page }) => {
    await page.goto('/id/partner/bookings');
    await expect(page.locator('h1')).toContainText(/Booking/i);
  });

  test('should navigate to wallet topup page', async ({ page }) => {
    await page.goto('/id/partner/wallet/topup');
    await expect(page.locator('h1')).toContainText(/Top-up|Wallet/i);
  });
});
