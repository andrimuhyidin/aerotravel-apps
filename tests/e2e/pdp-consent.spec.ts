/**
 * E2E Tests: User Consent Management
 * Purpose: Test PDP consent flow from user perspective
 */

import { expect, test } from '@playwright/test';

test.describe('User Consent Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display consent form on first login', async ({ page }) => {
    // Navigate to consent page
    await page.goto('/legal/sign/consent');

    // Check if consent form is displayed
    await expect(page.locator('text=Syarat dan Ketentuan')).toBeVisible();
    await expect(page.locator('text=Persetujuan Penggunaan Data')).toBeVisible();
  });

  test('should require mandatory consents before submission', async ({ page }) => {
    await page.goto('/legal/sign/consent');

    // Try to submit without agreeing
    await page.click('button:has-text("Lanjutkan")');

    // Should show error
    await expect(
      page.locator('text=Anda harus menyetujui semua persetujuan wajib')
    ).toBeVisible();
  });

  test('should allow submission after agreeing to mandatory consents', async ({ page }) => {
    await page.goto('/legal/sign/consent');

    // Agree to main terms
    await page.check('input[type="checkbox"]:near(text="Syarat dan Ketentuan")');

    // Wait for consent purposes to load
    await page.waitForTimeout(1000);

    // Check all mandatory consents (they should be pre-checked but we ensure)
    const mandatoryCheckboxes = await page.locator(
      'input[type="checkbox"][disabled]'
    );
    const count = await mandatoryCheckboxes.count();
    expect(count).toBeGreaterThan(0);

    // Submit
    await page.click('button:has-text("Lanjutkan")');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should display current consent status in settings', async ({ page }) => {
    await page.goto('/settings/privacy');

    // Should display consent management section
    await expect(page.locator('text=Pengaturan Persetujuan Data')).toBeVisible();
    await expect(page.locator('text=Marketing')).toBeVisible();
    await expect(page.locator('text=Analitik')).toBeVisible();
  });

  test('should allow user to revoke optional consent', async ({ page }) => {
    await page.goto('/settings/privacy');

    // Find an optional consent (marketing)
    const marketingCheckbox = page.locator(
      'input[type="checkbox"]:near(text="Marketing")'
    ).first();

    // Uncheck if checked
    if (await marketingCheckbox.isChecked()) {
      await marketingCheckbox.uncheck();
    }

    // Save changes
    await page.click('button:has-text("Simpan")');

    // Should show success message
    await expect(page.locator('text=Pengaturan berhasil disimpan')).toBeVisible();

    // Reload and verify
    await page.reload();
    expect(await marketingCheckbox.isChecked()).toBe(false);
  });
});

test.describe('Data Export Request', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should allow user to request data export', async ({ page }) => {
    await page.goto('/settings/privacy');

    // Click data export button
    await page.click('button:has-text("Ekspor Data Saya")');

    // Select format
    await page.selectOption('select[name="format"]', 'json');

    // Submit request
    await page.click('button:has-text("Minta Ekspor")');

    // Should show success message
    await expect(
      page.locator('text=Permintaan ekspor data berhasil')
    ).toBeVisible();
  });
});

