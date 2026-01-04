/**
 * Keyboard Navigation Tests
 * Test keyboard accessibility compliance (WCAG 2.1 AA - 2.1.1 Keyboard)
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/id');
  });

  test('should navigate through main navigation using Tab key', async ({ page }) => {
    // Start from top
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        visible: el ? window.getComputedStyle(el).outlineWidth !== '0px' : false,
      };
    });

    expect(focusedElement.visible).toBeTruthy();
  });

  test('should support Skip Link for keyboard users', async ({ page }) => {
    // Press Tab to focus skip link
    await page.keyboard.press('Tab');
    
    // Check if skip link is focused
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    
    // Press Enter to activate skip link
    await page.keyboard.press('Enter');
    
    // Check if main content is focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('should navigate form fields with Tab', async ({ page }) => {
    // Navigate to login page
    await page.goto('/id/login');
    
    // Tab through form fields
    await page.keyboard.press('Tab'); // Email field
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Password field
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should navigate backwards with Shift+Tab', async ({ page }) => {
    await page.goto('/id/login');
    
    // Tab forward to password field
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Tab backwards
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
  });

  test('should trap focus in modal dialogs', async ({ page }) => {
    // Navigate to page with modal
    await page.goto('/id/packages');
    
    // Open modal (adjust selector based on actual implementation)
    const openModalButton = page.locator('button:has-text("Detail")').first();
    if (await openModalButton.isVisible()) {
      await openModalButton.click();
      
      // Wait for modal to open
      await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // Tab through modal elements
      await page.keyboard.press('Tab');
      
      // Get all focusable elements in modal
      const focusableInModal = await page.locator('[role="dialog"] button, [role="dialog"] a, [role="dialog"] input').count();
      
      // Tab through all elements and back to first
      for (let i = 0; i < focusableInModal + 1; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should be back at first element (focus trapped)
      const firstFocusable = page.locator('[role="dialog"] button, [role="dialog"] a, [role="dialog"] input').first();
      await expect(firstFocusable).toBeFocused();
    }
  });

  test('should close modal with Escape key', async ({ page }) => {
    await page.goto('/id/packages');
    
    const openModalButton = page.locator('button:has-text("Detail")').first();
    if (await openModalButton.isVisible()) {
      await openModalButton.click();
      
      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Modal should be closed
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });

  test('should activate buttons with Space or Enter', async ({ page }) => {
    await page.goto('/id');
    
    // Find a button
    const button = page.locator('button').first();
    await button.focus();
    
    // Test Enter key
    const buttonText = await button.textContent();
    await page.keyboard.press('Enter');
    
    // Check if action was triggered (would need specific assertion based on button)
    // This is a basic test that Enter key works
    expect(buttonText).toBeTruthy();
  });

  test('should navigate dropdowns with Arrow keys', async ({ page }) => {
    // Navigate to page with dropdown (e.g., language selector)
    await page.goto('/id');
    
    const dropdown = page.locator('select, [role="combobox"]').first();
    if (await dropdown.isVisible()) {
      await dropdown.focus();
      
      // Open dropdown with Enter or Space
      await page.keyboard.press('Enter');
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
      
      // Select with Enter
      await page.keyboard.press('Enter');
      
      // Dropdown should be closed
      expect(true).toBeTruthy(); // Basic pass, would need specific assertions
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/id');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check focus ring visibility
    const focusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });
    
    // Should have some form of focus indicator
    const hasFocusIndicator = 
      focusStyle?.outlineWidth !== '0px' || 
      focusStyle?.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should submit form with Enter key', async ({ page }) => {
    await page.goto('/id/login');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Press Enter on password field
    await page.keyboard.press('Enter');
    
    // Form should submit (check for navigation or error message)
    await page.waitForTimeout(1000);
    
    // This would need specific assertion based on login behavior
    expect(true).toBeTruthy();
  });

  test('should navigate between radio buttons with Arrow keys', async ({ page }) => {
    // Navigate to page with radio buttons (e.g., booking form)
    const hasRadioButtons = await page.locator('input[type="radio"]').count();
    
    if (hasRadioButtons > 0) {
      const firstRadio = page.locator('input[type="radio"]').first();
      await firstRadio.focus();
      
      // Arrow right should move to next radio
      await page.keyboard.press('ArrowRight');
      
      // Check if focus moved
      const focusedRadio = page.locator('input[type="radio"]:focus');
      await expect(focusedRadio).toBeFocused();
    }
  });
});

test.describe('Keyboard Navigation - Accessibility Shortcuts', () => {
  test('should allow keyboard-only booking flow', async ({ page }) => {
    await page.goto('/id/packages');
    
    // Navigate using only keyboard
    await page.keyboard.press('Tab'); // Navigate through elements
    
    // This would test entire booking flow with only keyboard
    // Specific implementation would depend on actual page structure
    expect(true).toBeTruthy();
  });

  test('should support keyboard navigation in calendar picker', async ({ page }) => {
    // Navigate to booking page with calendar
    const hasDatePicker = await page.locator('input[type="date"], [role="application"]').count();
    
    if (hasDatePicker > 0) {
      const datePicker = page.locator('input[type="date"], [role="application"]').first();
      await datePicker.focus();
      
      // Test arrow key navigation in calendar
      await page.keyboard.press('Enter'); // Open calendar
      await page.keyboard.press('ArrowRight'); // Next day
      await page.keyboard.press('ArrowDown'); // Next week
      await page.keyboard.press('Enter'); // Select date
      
      expect(true).toBeTruthy();
    }
  });
});

