/**
 * E2E Tests: Admin Compliance Management
 * Purpose: Test compliance features for admin users
 */

import { expect, test } from '@playwright/test';

test.describe('Admin - Business Licenses Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@aerotravel.com');
    await page.fill('input[name="password"]', 'adminpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display business licenses dashboard', async ({ page }) => {
    await page.goto('/dashboard/compliance/licenses');

    await expect(page.locator('text=Lisensi Bisnis')).toBeVisible();
    await expect(page.locator('text=NIB')).toBeVisible();
    await expect(page.locator('text=ASITA')).toBeVisible();
  });

  test('should show expiring licenses alert', async ({ page }) => {
    await page.goto('/dashboard/compliance/licenses');

    // Check for expiring licenses section
    const expiringSection = page.locator('text=Akan Kadaluarsa');
    if (await expiringSection.isVisible()) {
      await expect(page.locator('text=hari lagi')).toBeVisible();
    }
  });
});

test.describe('Admin - Permenparekraf Self-Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@aerotravel.com');
    await page.fill('input[name="password"]', 'adminpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display assessment dashboard', async ({ page }) => {
    await page.goto('/dashboard/compliance/permenparekraf');

    await expect(page.locator('text=Self-Assessment Standar Usaha')).toBeVisible();
    await expect(page.locator('text=Permenparekraf')).toBeVisible();
  });

  test('should allow creating new assessment', async ({ page }) => {
    await page.goto('/dashboard/compliance/permenparekraf');

    // Click create button
    await page.click('button:has-text("Buat Assessment Baru")');

    // Fill form
    await page.selectOption('select[name="assessmentType"]', 'agen_perjalanan_wisata');
    await page.fill('input[name="legalitas"]', '85');
    await page.fill('input[name="sdm"]', '90');
    await page.fill('input[name="saranaPrasarana"]', '80');
    await page.fill('input[name="pelayanan"]', '88');
    await page.fill('input[name="keuangan"]', '75');
    await page.fill('input[name="lingkungan"]', '82');

    // Submit
    await page.click('button:has-text("Simpan Assessment")');

    // Should show success and redirect
    await expect(page.locator('text=Assessment berhasil disimpan')).toBeVisible();
  });

  test('should display assessment history', async ({ page }) => {
    await page.goto('/dashboard/compliance/permenparekraf');

    // Switch to history tab
    await page.click('button[role="tab"]:has-text("Riwayat")');

    // Should display assessments if any
    await expect(page.locator('text=Assessment').first()).toBeVisible();
  });
});

test.describe('Admin - Guide MRA-TP Certifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@aerotravel.com');
    await page.fill('input[name="password"]', 'adminpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display guide certifications list', async ({ page }) => {
    await page.goto('/dashboard/guides/certifications');

    await expect(page.locator('text=Sertifikasi Guide')).toBeVisible();
    await expect(page.locator('text=MRA-TP')).toBeVisible();
  });

  test('should allow verifying guide certification', async ({ page }) => {
    await page.goto('/dashboard/guides/certifications');

    // Find pending certification
    const pendingCert = page.locator('text=Menunggu Verifikasi').first();
    if (await pendingCert.isVisible()) {
      // Click verify button
      await page.click('button:has-text("Verifikasi")');

      // Confirm verification
      await page.click('button:has-text("Setujui")');

      // Should show success
      await expect(page.locator('text=Sertifikasi berhasil diverifikasi')).toBeVisible();
    }
  });
});

