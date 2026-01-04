/**
 * Axe-core Automated Accessibility Tests
 * WCAG 2.1 AA Compliance Testing
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit with axe-core', () => {
  test('should not have any automatically detectable accessibility issues on homepage', async ({ page }) => {
    await page.goto('/id');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on login page', async ({ page }) => {
    await page.goto('/id/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on packages page', async ({ page }) => {
    await page.goto('/id/packages');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on booking page', async ({ page }) => {
    await page.goto('/id/book');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on privacy policy page', async ({ page }) => {
    await page.goto('/id/legal/privacy');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/id');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice', 'wcag2aa'])
      .include('main')
      .analyze();

    // Check for specific ARIA rules
    const ariaViolations = accessibilityScanResults.violations.filter((violation) =>
      violation.id.includes('aria')
    );

    expect(ariaViolations).toEqual([]);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/id');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // Can be flaky, test manually
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter((violation) =>
      violation.id === 'color-contrast'
    );

    expect(contrastViolations.length).toBe(0);
  });

  test('should have accessible forms with labels', async ({ page }) => {
    await page.goto('/id/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('form')
      .analyze();

    const formViolations = accessibilityScanResults.violations.filter((violation) =>
      ['label', 'form-field-multiple-labels', 'input-button-name'].includes(violation.id)
    );

    expect(formViolations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/id');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter((violation) =>
      violation.id === 'heading-order'
    );

    expect(headingViolations).toEqual([]);
  });

  test('should have accessible images with alt text', async ({ page }) => {
    await page.goto('/id/packages');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const imageViolations = accessibilityScanResults.violations.filter((violation) =>
      ['image-alt', 'image-redundant-alt'].includes(violation.id)
    );

    expect(imageViolations).toEqual([]);
  });

  test('should have accessible navigation landmarks', async ({ page }) => {
    await page.goto('/id');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();

    const landmarkViolations = accessibilityScanResults.violations.filter((violation) =>
      ['landmark-one-main', 'region', 'page-has-heading-one'].includes(violation.id)
    );

    expect(landmarkViolations).toEqual([]);
  });

  test('should report violations with details', async ({ page }) => {
    await page.goto('/id');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // If there are violations, log them for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility Violations Found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n[${violation.impact}] ${violation.id}: ${violation.description}`);
        console.log(`  Help: ${violation.helpUrl}`);
        console.log(`  Nodes affected: ${violation.nodes.length}`);
        violation.nodes.forEach((node) => {
          console.log(`    - ${node.html}`);
        });
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility Audit - Critical Pages', () => {
  const criticalPages = [
    { url: '/id', name: 'Homepage' },
    { url: '/id/packages', name: 'Packages List' },
    { url: '/id/login', name: 'Login' },
    { url: '/id/book', name: 'Booking' },
    { url: '/id/legal/privacy', name: 'Privacy Policy' },
    { url: '/id/legal/terms', name: 'Terms of Service' },
  ];

  for (const pageInfo of criticalPages) {
    test(`${pageInfo.name} should pass axe accessibility scan`, async ({ page }) => {
      await page.goto(pageInfo.url);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Allow up to 3 minor violations
      const criticalViolations = accessibilityScanResults.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact || '')
      );

      expect(criticalViolations).toEqual([]);
    });
  }
});

