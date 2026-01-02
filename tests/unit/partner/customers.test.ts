/**
 * Unit Tests: Partner Customers API
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).optional().nullable(),
  address: z.string().optional().nullable(),
  birthdate: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  special_notes: z.string().optional().nullable(),
});

describe('Customers API Validation', () => {
  describe('createCustomerSchema', () => {
    it('should validate valid customer with minimal data', () => {
      const validData = { name: 'John Doe' };
      const result = createCustomerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate valid customer with full data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '08123456789012', // Min 10 characters
        address: 'Jl. Sudirman No. 123',
        birthdate: '1990-01-15',
        segment: 'vip',
        preferences: { smoking: false },
        special_notes: 'Prefers window seat',
      };
      const result = createCustomerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = { name: '' };
      const result = createCustomerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'not-an-email',
      };
      const result = createCustomerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short phone number', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '12345',
      };
      const result = createCustomerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept null email and phone', () => {
      const validData = {
        name: 'John Doe',
        email: null,
        phone: null,
      };
      const result = createCustomerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Customer Segment Logic', () => {
  function calculateCustomerSegment(bookingsCount: number, totalSpend: number): string {
    if (bookingsCount >= 10 || totalSpend >= 50000000) {
      return 'platinum';
    }
    if (bookingsCount >= 5 || totalSpend >= 25000000) {
      return 'gold';
    }
    if (bookingsCount >= 2 || totalSpend >= 10000000) {
      return 'silver';
    }
    return 'bronze';
  }

  it('should assign platinum for high bookings', () => {
    expect(calculateCustomerSegment(10, 0)).toBe('platinum');
  });

  it('should assign platinum for high spend', () => {
    expect(calculateCustomerSegment(0, 50000000)).toBe('platinum');
  });

  it('should assign gold for medium bookings', () => {
    expect(calculateCustomerSegment(5, 0)).toBe('gold');
  });

  it('should assign silver for low bookings', () => {
    expect(calculateCustomerSegment(2, 0)).toBe('silver');
  });

  it('should assign bronze for new customers', () => {
    expect(calculateCustomerSegment(0, 0)).toBe('bronze');
    expect(calculateCustomerSegment(1, 5000000)).toBe('bronze');
  });
});

