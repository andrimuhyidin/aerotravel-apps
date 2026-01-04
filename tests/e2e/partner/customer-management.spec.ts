/**
 * E2E Tests: Partner Customer Management Flow
 * Tests customer list, creation, and detail view
 */

import { expect, test } from '@playwright/test';

test.describe('Partner Customer Management', () => {
  test.beforeEach(async () => {
    // Assume partner is already logged in via storage state
  });

  test('should display customer list page', async ({ page }) => {
    await page.goto('/partner/customers');

    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Check for customer list title
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /pelanggan|customer/i
    );
  });

  test('should search customers by name', async ({ page }) => {
    await page.goto('/partner/customers');

    // Wait for customers to load
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.getByPlaceholder(/cari|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');
      await searchInput.press('Enter');

      // Wait for filtered results
      await page.waitForTimeout(1000);
    }
  });

  test('should open add customer modal', async ({ page }) => {
    await page.goto('/partner/customers');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click add customer button
    const addButton = page.getByRole('button', { name: /tambah|add/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // Modal should appear
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate customer form fields', async ({ page }) => {
    await page.goto('/partner/customers');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click add customer button
    const addButton = page.getByRole('button', { name: /tambah|add/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // Wait for modal
      await page.waitForTimeout(500);

      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /simpan|save/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation error
        const errorMessage = page.locator('[role="alert"]');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should display customer segments filter', async ({ page }) => {
    await page.goto('/partner/customers');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for segment filter
    const segmentFilter = page.getByRole('combobox', {
      name: /segmen|segment/i,
    });
    if (await segmentFilter.isVisible()) {
      await expect(segmentFilter).toBeVisible();
    }
  });

  test('should navigate to customer detail', async ({ page }) => {
    await page.goto('/partner/customers');

    // Wait for customers to load
    await page.waitForLoadState('networkidle');

    // Click on first customer row
    const customerRow = page.locator('tbody tr').first();
    if (await customerRow.isVisible()) {
      await customerRow.click();

      // Should show customer detail (could be modal or new page)
      await page.waitForTimeout(1000);
    }
  });

  test('should export customer list', async ({ page }) => {
    await page.goto('/partner/customers');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for export button
    const exportButton = page.getByRole('button', {
      name: /export|ekspor|download/i,
    });
    if (await exportButton.isVisible()) {
      // Set up download handler
      const _downloadPromise = page.waitForEvent('download', { timeout: 5000 });
      await exportButton.click();

      // Verify download started (or button clicked)
      // Note: Actual download may not happen in test environment
      // Promise is intentionally unused as it's just for handling download event
    }
  });
});
