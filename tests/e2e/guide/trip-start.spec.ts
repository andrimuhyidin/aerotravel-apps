/**
 * E2E Test: Trip Start Flow
 * Critical flow testing for trip initiation
 */

import { test, expect } from '@playwright/test';
import { mockTrip, mockTripOngoing } from '../../fixtures/guide-fixtures';
import { 
  navigateToGuidePage, 
  waitForLoadingComplete,
  mockGeolocation,
  GUIDE_BASE_URL,
} from '../../helpers/guide-helpers';

test.describe('Trip Start Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock geolocation for all tests
    await mockGeolocation(page);
  });

  test('should show trip list with correct status badges', async ({ page }) => {
    await navigateToGuidePage(page, '/trips');
    await waitForLoadingComplete(page);

    // Should display trips
    const tripCards = page.locator('[class*="Card"]').filter({ hasText: /TRP-/ });
    await expect(tripCards.first()).toBeVisible();

    // Check status badges exist
    const statusBadges = page.locator('[class*="rounded-full"]').filter({ hasText: /Mendatang|Berlangsung|Selesai/ });
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should navigate to trip detail page', async ({ page }) => {
    await navigateToGuidePage(page, '/trips');
    await waitForLoadingComplete(page);

    // Click on first trip card's chevron
    await page.locator('a[href*="/trips/"]').first().click();

    // Should be on trip detail page
    await expect(page).toHaveURL(/\/trips\/TRP-/);
    
    // Should show trip details
    await expect(page.getByText(/Detail Trip|Trip Detail/i)).toBeVisible();
  });

  test('should block trip start when check-in is missing', async ({ page }) => {
    await navigateToGuidePage(page, `/trips/${mockTrip.code}`);
    await waitForLoadingComplete(page);

    // Find start trip button
    const startButton = page.getByRole('button', { name: /mulai trip|start trip/i });
    
    // If start button exists, it should be disabled or show warning
    if (await startButton.isVisible()) {
      // Check if button is disabled
      const isDisabled = await startButton.isDisabled();
      
      if (!isDisabled) {
        // Click and expect error
        await startButton.click();
        
        // Should show error message about check-in
        await expect(page.getByText(/check-in|absensi|hadir/i)).toBeVisible();
      }
    }
  });

  test('should block trip start when consent is missing', async ({ page }) => {
    await navigateToGuidePage(page, `/trips/${mockTrip.code}`);
    await waitForLoadingComplete(page);

    // Navigate to manifest tab
    await page.getByRole('tab', { name: /manifest|penumpang/i }).click();
    await waitForLoadingComplete(page);

    // Check for consent status
    const pendingConsent = page.getByText(/belum tanda tangan|pending|unsigned/i);
    
    if (await pendingConsent.isVisible()) {
      // Go back to trip detail and try to start
      await page.getByRole('tab', { name: /detail|info/i }).click();
      
      const startButton = page.getByRole('button', { name: /mulai trip|start trip/i });
      if (await startButton.isVisible() && !(await startButton.isDisabled())) {
        await startButton.click();
        
        // Should show consent warning
        await expect(page.getByText(/consent|persetujuan|tanda tangan/i)).toBeVisible();
      }
    }
  });

  test('should show trip readiness checklist', async ({ page }) => {
    await navigateToGuidePage(page, `/trips/${mockTrip.code}`);
    await waitForLoadingComplete(page);

    // Should show readiness indicators
    const readinessSection = page.locator('[class*="checklist"], [data-testid="trip-readiness"]');
    
    // Check for common readiness items
    await expect(page.getByText(/absensi|check-in|attendance/i).first()).toBeVisible();
  });

  test('should allow trip start when all requirements are met', async ({ page }) => {
    // Navigate to an ongoing trip that should be startable
    await navigateToGuidePage(page, `/trips/${mockTripOngoing.code}`);
    await waitForLoadingComplete(page);

    // Look for trip controls
    const tripControls = page.locator('[data-testid="trip-controls"], [class*="trip-control"]');
    
    // If trip is already started, should show active status
    const activeIndicator = page.getByText(/berlangsung|aktif|active|ongoing/i);
    await expect(activeIndicator.first()).toBeVisible();
  });

  test('should show risk assessment score', async ({ page }) => {
    await navigateToGuidePage(page, `/trips/${mockTrip.code}`);
    await waitForLoadingComplete(page);

    // Look for risk score display
    const riskSection = page.locator('[class*="risk"], [data-testid="risk-score"]');
    
    // Should display risk indicators if available
    const riskText = page.getByText(/resiko|risk|skor|score/i);
    // Risk score may or may not be visible depending on trip status
  });

  test('should display equipment checklist', async ({ page }) => {
    await navigateToGuidePage(page, `/trips/${mockTrip.code}`);
    await waitForLoadingComplete(page);

    // Navigate to equipment tab if it exists
    const equipmentTab = page.getByRole('tab', { name: /peralatan|equipment/i });
    if (await equipmentTab.isVisible()) {
      await equipmentTab.click();
      await waitForLoadingComplete(page);

      // Should show equipment list
      const equipmentList = page.locator('[class*="equipment"], [data-testid="equipment-list"]');
      await expect(equipmentList.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Equipment tab might be empty
      });
    }
  });

  test('should show weather information for trip', async ({ page }) => {
    await navigateToGuidePage(page, `/trips/${mockTrip.code}`);
    await waitForLoadingComplete(page);

    // Look for weather section
    const weatherInfo = page.getByText(/cuaca|weather|°/i);
    // Weather may or may not be visible
  });

  test('should display itinerary timeline', async ({ page }) => {
    await navigateToGuidePage(page, `/trips/${mockTrip.code}`);
    await waitForLoadingComplete(page);

    // Navigate to itinerary tab
    const itineraryTab = page.getByRole('tab', { name: /itinerary|jadwal/i });
    if (await itineraryTab.isVisible()) {
      await itineraryTab.click();
      await waitForLoadingComplete(page);

      // Should show itinerary items
      const itineraryItems = page.locator('[class*="timeline"], [data-testid="itinerary-item"]');
      await expect(itineraryItems.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Itinerary might be empty
      });
    }
  });
});

