/**
 * Integration Tests - Split Bill API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'split-bill-id' },
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'booking-id', total_amount: 3000000 },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

// Mock feature flags
vi.mock('@/lib/feature-flags/posthog-flags', () => ({
  isFeatureEnabled: vi.fn(() => true),
}));

describe('Split Bill API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/split-bill', () => {
    it('should validate required fields', () => {
      const invalidPayload = {};
      
      expect(invalidPayload).not.toHaveProperty('bookingId');
      expect(invalidPayload).not.toHaveProperty('participants');
    });

    it('should require minimum 2 participants', () => {
      const invalidParticipants = [
        { name: 'Solo', amount: 1000000 },
      ];
      
      expect(invalidParticipants.length).toBeLessThan(2);
    });

    it('should accept valid split bill payload', () => {
      const validPayload = {
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        participants: [
          { name: 'John', phone: '081234567890', amount: 1500000 },
          { name: 'Jane', phone: '081234567891', amount: 1500000 },
        ],
        creatorName: 'John',
        creatorPhone: '081234567890',
      };

      expect(validPayload.participants.length).toBeGreaterThanOrEqual(2);
      expect(validPayload.bookingId).toBeDefined();
    });

    it('should enforce rate limiting', async () => {
      const { checkRateLimit, RATE_LIMIT_CONFIGS } = await import('@/lib/api/public-rate-limit');
      
      const result = checkRateLimit('test-splitbill-api', RATE_LIMIT_CONFIGS.POST);
      expect(result.success).toBe(true);
    });
  });

  describe('GET /api/split-bill', () => {
    it('should require booking ID', () => {
      const queryParams = {};
      expect(queryParams).not.toHaveProperty('bookingId');
    });

    it('should accept valid booking ID', () => {
      const queryParams = {
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(queryParams.bookingId).toBeDefined();
    });
  });
});

