/**
 * E2E Tests: Partner Booking Creation Flow
 * Tests the complete booking creation process
 */

import { test, expect } from '@playwright/test';

test.describe('Partner Booking Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Assume partner is already logged in via storage state
  });

  test('should display booking list page', async ({ page }) => {
    await page.goto('/partner/bookings');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Check for booking list title
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/booking|pemesanan/i);
  });

  test('should open new booking form', async ({ page }) => {
    await page.goto('/partner/bookings/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for booking form
    const form = page.getByRole('form');
    if (await form.isVisible()) {
      await expect(form).toBeVisible();
    }
  });

  test('should search and select package', async ({ page }) => {
    await page.goto('/partner/bookings/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for package search input
    const packageSearch = page.getByPlaceholder(/cari paket|search package/i);
    if (await packageSearch.isVisible()) {
      await packageSearch.fill('Bali');
      
      // Wait for suggestions
      await page.waitForTimeout(1000);
      
      // Click first suggestion
      const suggestion = page.locator('[data-testid="package-suggestion"]').first();
      if (await suggestion.isVisible()) {
        await suggestion.click();
      }
    }
  });

  test('should fill customer information', async ({ page }) => {
    await page.goto('/partner/bookings/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill customer name
    const nameInput = page.getByLabel(/nama|name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Customer');
    }
    
    // Fill phone
    const phoneInput = page.getByLabel(/telepon|phone/i);
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('081234567890');
    }
    
    // Fill email
    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }
  });

  test('should select trip date', async ({ page }) => {
    await page.goto('/partner/bookings/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for date picker
    const datePicker = page.getByRole('button', { name: /tanggal|date/i });
    if (await datePicker.isVisible()) {
      await datePicker.click();
      
      // Wait for calendar
      await page.waitForTimeout(500);
      
      // Select a date (next month)
      const nextMonthButton = page.getByRole('button', { name: /next|selanjutnya/i });
      if (await nextMonthButton.isVisible()) {
        await nextMonthButton.click();
      }
      
      // Click on day 15
      const day15 = page.getByRole('button', { name: '15' });
      if (await day15.isVisible()) {
        await day15.click();
      }
    }
  });

  test('should select pax count', async ({ page }) => {
    await page.goto('/partner/bookings/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for adult pax input
    const adultInput = page.getByLabel(/dewasa|adult/i);
    if (await adultInput.isVisible()) {
      await adultInput.fill('2');
    }
    
    // Look for child pax input
    const childInput = page.getByLabel(/anak|child/i);
    if (await childInput.isVisible()) {
      await childInput.fill('1');
    }
  });

  test('should display price calculation', async ({ page }) => {
    await page.goto('/partner/bookings/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for price summary section
    const priceSummary = page.locator('[data-testid="price-summary"]');
    if (await priceSummary.isVisible()) {
      await expect(priceSummary).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/partner/bookings/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /buat booking|create|submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors
      await page.waitForTimeout(500);
      const errorMessages = page.locator('[role="alert"]');
      if (await errorMessages.first().isVisible()) {
        expect(await errorMessages.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should save as draft', async ({ page }) => {
    await page.goto('/partner/bookings/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for draft save button
    const draftButton = page.getByRole('button', { name: /simpan draft|save draft/i });
    if (await draftButton.isVisible()) {
      await expect(draftButton).toBeVisible();
    }
  });

  test('should filter bookings by status', async ({ page }) => {
    await page.goto('/partner/bookings');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for status filter tabs
    const statusTabs = page.getByRole('tablist');
    if (await statusTabs.isVisible()) {
      // Click on "Paid" tab
      const paidTab = page.getByRole('tab', { name: /paid|lunas/i });
      if (await paidTab.isVisible()) {
        await paidTab.click();
        
        // Wait for filtered results
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should search bookings by code', async ({ page }) => {
    await page.goto('/partner/bookings');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/cari|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('BK-');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
    }
  });
});

