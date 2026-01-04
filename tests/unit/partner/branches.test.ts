/**
 * Unit Tests: Partner Branches API
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createBranchSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
});

describe('Branches API Validation', () => {
  describe('createBranchSchema', () => {
    it('should validate valid branch with minimal data', () => {
      const validData = { name: 'Branch Jakarta' };
      const result = createBranchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate valid branch with full data', () => {
      const validData = {
        name: 'Branch Jakarta Selatan',
        address: 'Jl. TB Simatupang No. 45',
        phone: '021-12345678',
      };
      const result = createBranchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const invalidData = { name: 'B' };
      const result = createBranchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept empty optional fields', () => {
      const validData = {
        name: 'Branch Bali',
        address: '',
        phone: '',
      };
      const result = createBranchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Branch Statistics', () => {
  function calculateBranchPerformance(
    bookingsCount: number,
    revenue: number,
    teamSize: number
  ): { rating: string; revenuePerPerson: number } {
    const revenuePerPerson = teamSize > 0 ? revenue / teamSize : 0;
    
    let rating: string;
    if (revenuePerPerson >= 100000000) {
      rating = 'excellent';
    } else if (revenuePerPerson >= 50000000) {
      rating = 'good';
    } else if (revenuePerPerson >= 25000000) {
      rating = 'average';
    } else {
      rating = 'needs_improvement';
    }
    
    return { rating, revenuePerPerson };
  }

  it('should rate branch as excellent for high revenue per person', () => {
    const result = calculateBranchPerformance(100, 500000000, 5);
    expect(result.rating).toBe('excellent');
    expect(result.revenuePerPerson).toBe(100000000);
  });

  it('should rate branch as good for medium revenue per person', () => {
    const result = calculateBranchPerformance(50, 250000000, 5);
    expect(result.rating).toBe('good');
    expect(result.revenuePerPerson).toBe(50000000);
  });

  it('should handle zero team size', () => {
    const result = calculateBranchPerformance(10, 100000000, 0);
    expect(result.revenuePerPerson).toBe(0);
    expect(result.rating).toBe('needs_improvement');
  });
});

