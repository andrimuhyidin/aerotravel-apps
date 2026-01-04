/**
 * Unit Tests: Partner Profile API
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const updateProfileSchema = z.object({
  companyName: z.string().min(3).optional(),
  companyAddress: z.string().min(10).optional(),
  npwp: z.string().min(15).max(15).optional(),
  phone: z.string().min(10).optional(),
  siupNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
});

describe('Profile API Validation', () => {
  describe('updateProfileSchema', () => {
    it('should validate valid partial update', () => {
      const validData = {
        companyName: 'PT Travel Sejahtera',
      };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate valid full update', () => {
      const validData = {
        companyName: 'PT Travel Sejahtera',
        companyAddress: 'Jl. Sudirman No. 123, Jakarta Selatan',
        npwp: '123456789012345',
        phone: '081234567890',
        siupNumber: 'SIUP-12345',
        bankName: 'BCA',
        bankAccountNumber: '1234567890',
        bankAccountName: 'PT Travel Sejahtera',
      };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short company name', () => {
      const invalidData = {
        companyName: 'PT',
      };
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short company address', () => {
      const invalidData = {
        companyAddress: 'Jakarta',
      };
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid NPWP length', () => {
      const invalidData = {
        npwp: '12345', // too short
      };
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      const invalidData2 = {
        npwp: '1234567890123456', // too long
      };
      const result2 = updateProfileSchema.safeParse(invalidData2);
      expect(result2.success).toBe(false);
    });

    it('should accept empty update', () => {
      const validData = {};
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Partner Tier Logic', () => {
  function calculatePartnerTier(
    totalBookings: number,
    totalRevenue: number,
    monthsActive: number
  ): string {
    const monthlyAvg = monthsActive > 0 ? totalBookings / monthsActive : 0;
    
    if (totalRevenue >= 1000000000 && monthlyAvg >= 50) {
      return 'platinum';
    }
    if (totalRevenue >= 500000000 && monthlyAvg >= 25) {
      return 'gold';
    }
    if (totalRevenue >= 100000000 && monthlyAvg >= 10) {
      return 'silver';
    }
    return 'bronze';
  }

  it('should assign platinum for top performers', () => {
    expect(calculatePartnerTier(600, 1200000000, 12)).toBe('platinum');
  });

  it('should assign gold for good performers', () => {
    expect(calculatePartnerTier(300, 600000000, 12)).toBe('gold');
  });

  it('should assign silver for average performers', () => {
    expect(calculatePartnerTier(120, 150000000, 12)).toBe('silver');
  });

  it('should assign bronze for new partners', () => {
    expect(calculatePartnerTier(5, 10000000, 1)).toBe('bronze');
  });
});

describe('Profile Completion', () => {
  function calculateProfileCompletion(profile: Record<string, unknown>): number {
    const requiredFields = [
      'companyName',
      'companyAddress',
      'npwp',
      'phone',
      'bankName',
      'bankAccountNumber',
      'bankAccountName',
    ];

    const filledFields = requiredFields.filter(field => {
      const value = profile[field];
      return value && typeof value === 'string' && value.trim().length > 0;
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  }

  it('should calculate 100% for complete profile', () => {
    const completeProfile = {
      companyName: 'PT Travel',
      companyAddress: 'Jakarta',
      npwp: '123456789012345',
      phone: '081234567890',
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountName: 'PT Travel',
    };
    expect(calculateProfileCompletion(completeProfile)).toBe(100);
  });

  it('should calculate 0% for empty profile', () => {
    expect(calculateProfileCompletion({})).toBe(0);
  });

  it('should calculate partial completion', () => {
    const partialProfile = {
      companyName: 'PT Travel',
      phone: '081234567890',
    };
    expect(calculateProfileCompletion(partialProfile)).toBe(29); // 2/7 = 28.57 rounded to 29
  });
});

