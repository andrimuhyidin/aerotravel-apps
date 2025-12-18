/**
 * E2E Tests: Guide App
 * Test critical flows for Guide mobile app
 */

import { test, expect } from '@playwright/test';

test.describe('Guide App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to guide section
    await page.goto('/id/guide');
  });

  test('should display guide dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Guide|Pemandu/i);
  });

  test('should navigate to attendance page', async ({ page }) => {
    await page.goto('/id/guide/attendance');
    // Should show attendance UI elements
    await expect(page.locator('text=/Check-in|Lokasi|Absensi/i')).toBeVisible();
  });

  test('should navigate to SOS page', async ({ page }) => {
    await page.goto('/id/guide/sos');
    // Should show SOS button
    await expect(page.locator('text=/SOS|Darurat/i')).toBeVisible();
  });

  test('should navigate to manifest page', async ({ page }) => {
    await page.goto('/id/guide/manifest');
    // Should show manifest UI
    await expect(page.locator('text=/Manifest|Penumpang|Trip/i')).toBeVisible();
  });
});
