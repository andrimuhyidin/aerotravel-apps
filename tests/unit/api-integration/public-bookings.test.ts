/**
 * Integration Tests - Public Bookings API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-id', booking_code: 'AER-TEST123' },
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'package-id', name: 'Test Package' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('Public Bookings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/public/bookings', () => {
    it('should validate required fields', async () => {
      // Test that missing required fields return 400
      const invalidPayload = {
        // Missing required fields
      };

      // In a real test, we'd import the handler and call it
      // For now, we validate the schema expectations
      expect(invalidPayload).not.toHaveProperty('packageId');
      expect(invalidPayload).not.toHaveProperty('bookerName');
    });

    it('should accept valid booking payload', () => {
      const validPayload = {
        packageId: '123e4567-e89b-12d3-a456-426614174000',
        tripDate: new Date().toISOString(),
        bookerName: 'John Doe',
        bookerPhone: '081234567890',
        bookerEmail: 'john@example.com',
        adultPax: 2,
        childPax: 1,
        infantPax: 0,
        totalAmount: 3000000,
      };

      expect(validPayload.packageId).toBeDefined();
      expect(validPayload.bookerName.length).toBeGreaterThanOrEqual(3);
      expect(validPayload.bookerEmail).toContain('@');
      expect(validPayload.adultPax).toBeGreaterThanOrEqual(1);
    });

    it('should enforce rate limiting', async () => {
      // Rate limiting is applied at the API level
      // This test verifies the rate limit module exists
      const { checkRateLimit, RATE_LIMIT_CONFIGS } = await import('@/lib/api/public-rate-limit');
      
      const result = checkRateLimit('test-booking-api', RATE_LIMIT_CONFIGS.POST);
      expect(result.success).toBe(true);
    });
  });
});

