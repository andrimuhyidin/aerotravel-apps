/**
 * Unit Tests: License Checker
 * Purpose: Test business license checking utilities
 */

import { describe, expect, it } from 'vitest';

import {
  calculateDaysUntilExpiry,
  determineLicenseStatus,
} from '@/lib/compliance/license-checker';

describe('License Checker', () => {
  describe('calculateDaysUntilExpiry', () => {
    it('should calculate days until expiry correctly', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);

      const days = calculateDaysUntilExpiry(futureDate.toISOString().split('T')[0] ?? '');
      expect(days).toBe(30);
    });

    it('should return negative for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const days = calculateDaysUntilExpiry(pastDate.toISOString().split('T')[0] ?? '');
      expect(days).toBeLessThan(0);
    });

    it('should handle invalid dates', () => {
      const days = calculateDaysUntilExpiry('invalid-date');
      expect(isNaN(days)).toBe(true);
    });
  });

  describe('determineLicenseStatus', () => {
    it('should return "valid" for dates more than 30 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      const status = determineLicenseStatus(futureDate.toISOString().split('T')[0] ?? '');
      expect(status).toBe('valid');
    });

    it('should return "expiring_soon" for dates within 30 days', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 15);

      const status = determineLicenseStatus(soonDate.toISOString().split('T')[0] ?? '');
      expect(status).toBe('expiring_soon');
    });

    it('should return "expired" for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const status = determineLicenseStatus(pastDate.toISOString().split('T')[0] ?? '');
      expect(status).toBe('expired');
    });

    it('should return "valid" for null expiry date (no expiry)', () => {
      const status = determineLicenseStatus(null);
      expect(status).toBe('valid');
    });
  });
});

