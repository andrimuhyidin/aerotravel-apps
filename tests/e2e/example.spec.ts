import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  
  // Check if the main heading is visible
  await expect(page.getByRole('heading', { name: /MyAeroTravel ID/i })).toBeVisible();
  
  // Check if the description is visible
  await expect(page.getByText(/Integrated Travel Ecosystem/i)).toBeVisible();
});

test('page has correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/MyAeroTravel ID/);
});

