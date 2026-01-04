/**
 * Guide App Test Helpers
 * Utility functions for E2E and unit tests
 */

import { Page } from '@playwright/test';

// Base URLs
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const GUIDE_BASE_URL = `${BASE_URL}/id/guide`;

/**
 * Login as guide user
 */
export async function loginAsGuide(page: Page, email = 'guide@test.com', password = 'password123') {
  await page.goto(`${BASE_URL}/id/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /masuk|login/i }).click();
  
  // Wait for redirect to guide dashboard
  await page.waitForURL(/\/guide\/dashboard|\/guide$/);
}

/**
 * Navigate to guide page
 */
export async function navigateToGuidePage(page: Page, path: string) {
  await page.goto(`${GUIDE_BASE_URL}${path}`);
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for skeleton loaders to disappear
  await page.waitForFunction(() => {
    const skeletons = document.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]');
    return skeletons.length === 0;
  }, { timeout: 10000 });
}

/**
 * Mock geolocation
 */
export async function mockGeolocation(page: Page, latitude = -8.6785, longitude = 115.2618) {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude, longitude });
}

/**
 * Mock camera permission
 */
export async function mockCameraPermission(page: Page) {
  await page.context().grantPermissions(['camera']);
}

/**
 * Mock microphone permission
 */
export async function mockMicrophonePermission(page: Page) {
  await page.context().grantPermissions(['microphone']);
}

/**
 * Take photo for tests (click camera button and confirm)
 */
export async function capturePhoto(page: Page) {
  await page.getByRole('button', { name: /foto|camera|capture/i }).click();
  // Wait for camera UI
  await page.waitForSelector('[data-testid="camera-preview"]', { timeout: 5000 }).catch(() => {
    // Fallback if no camera preview
  });
  await page.getByRole('button', { name: /ambil|capture|take/i }).click();
}

/**
 * Set offline mode
 */
export async function setOfflineMode(page: Page, offline = true) {
  await page.context().setOffline(offline);
}

/**
 * Fill in attendance check-in form
 */
export async function fillCheckInForm(page: Page, options: {
  happiness?: number;
  description?: string;
} = {}) {
  const { happiness = 5, description = 'Ready for the trip!' } = options;
  
  // Select happiness level
  const happinessSelector = `[data-happiness="${happiness}"]`;
  await page.click(happinessSelector).catch(() => {
    // Fallback to clicking star icons
    for (let i = 0; i < happiness; i++) {
      page.locator('[data-testid="happiness-star"]').nth(i).click();
    }
  });
  
  // Fill description
  await page.getByPlaceholder(/deskripsi|description|notes/i).fill(description);
}

/**
 * Trigger SOS alert
 */
export async function triggerSOS(page: Page, options: {
  incidentType?: string;
  message?: string;
} = {}) {
  const { incidentType = 'medical', message = 'Test SOS alert' } = options;
  
  // Navigate to SOS page or find SOS button
  await page.getByRole('button', { name: /sos|emergency|darurat/i }).click();
  
  // Select incident type
  await page.getByRole('combobox', { name: /jenis|type/i }).click();
  await page.getByRole('option', { name: new RegExp(incidentType, 'i') }).click();
  
  // Fill message
  await page.getByPlaceholder(/pesan|message/i).fill(message);
  
  // Confirm SOS
  await page.getByRole('button', { name: /kirim|send|confirm/i }).click();
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string | RegExp) {
  const toastSelector = '[role="status"], [data-sonner-toast], .toast';
  await page.waitForSelector(toastSelector, { timeout: 5000 });
  
  if (message) {
    await page.waitForFunction(
      (msg) => {
        const toasts = document.querySelectorAll('[role="status"], [data-sonner-toast], .toast');
        return Array.from(toasts).some(t => 
          typeof msg === 'string' 
            ? t.textContent?.includes(msg)
            : new RegExp(msg).test(t.textContent || '')
        );
      },
      message instanceof RegExp ? message.source : message,
      { timeout: 5000 }
    );
  }
}

/**
 * Format currency for assertions
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for assertions
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get text content without extra whitespace
 */
export async function getCleanText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  const text = await element.textContent();
  return text?.replace(/\s+/g, ' ').trim() || '';
}

/**
 * Check if element is visible with retry
 */
export async function isVisibleWithRetry(page: Page, selector: string, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      if (i === retries - 1) return false;
      await page.waitForTimeout(500);
    }
  }
  return false;
}

/**
 * Scroll to element and click
 */
export async function scrollAndClick(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.click();
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      return typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
    },
    { timeout: 10000 }
  );
}

/**
 * Assert API was called with correct body
 */
export async function assertApiCalledWith(
  page: Page,
  urlPattern: string | RegExp,
  expectedBody: Record<string, unknown>
): Promise<boolean> {
  const response = await waitForApiResponse(page, urlPattern);
  const request = response.request();
  const actualBody = JSON.parse(request.postData() || '{}');
  
  return Object.keys(expectedBody).every(key => 
    JSON.stringify(actualBody[key]) === JSON.stringify(expectedBody[key])
  );
}

