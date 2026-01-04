/**
 * Unit Tests: Data Retention
 * Test GDPR data retention and cleanup functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockNot = vi.fn();
const mockLt = vi.fn();
const mockIn = vi.fn();
const mockGte = vi.fn();
const mockSingle = vi.fn();
const mockHead = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock('@/lib/storage/supabase-storage', () => ({
  deleteFile: vi.fn().mockResolvedValue(true),
  listFiles: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Data Retention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanupKtpPhotos', () => {
    it('should clean up KTP photos after retention period', async () => {
      const { cleanupKtpPhotos } = await import('@/lib/compliance/data-retention');

      const mockBookings = [
        {
          id: 'booking-1',
          code: 'BK001',
          ktp_photo_url: 'https://storage.supabase.co/documents/ktp1.jpg',
          trip_date: '2023-01-01',
          user_id: 'user-1',
        },
        {
          id: 'booking-2',
          code: 'BK002',
          ktp_photo_url: 'https://storage.supabase.co/documents/ktp2.jpg',
          trip_date: '2023-01-15',
          user_id: 'user-2',
        },
      ];

      mockSelect.mockReturnValue({
        not: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
          }),
        }),
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockInsert.mockResolvedValue({ error: null });

      const result = await cleanupKtpPhotos({ ktpRetentionDays: 30 });

      expect(result.ktpPhotosDeleted).toBe(2);
      expect(result.bookingsUpdated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should return empty result when no bookings to clean', async () => {
      const { cleanupKtpPhotos } = await import('@/lib/compliance/data-retention');

      mockSelect.mockReturnValue({
        not: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await cleanupKtpPhotos();

      expect(result.ktpPhotosDeleted).toBe(0);
      expect(result.bookingsUpdated).toBe(0);
    });

    it('should handle database fetch error gracefully', async () => {
      const { cleanupKtpPhotos } = await import('@/lib/compliance/data-retention');

      mockSelect.mockReturnValue({
        not: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      });

      const result = await cleanupKtpPhotos();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('DB error');
    });

    it('should use default retention period if not provided', async () => {
      const { cleanupKtpPhotos } = await import('@/lib/compliance/data-retention');

      mockSelect.mockReturnValue({
        not: vi.fn().mockReturnValue({
          lt: vi.fn((date: string) => {
            // Verify date is approximately 30 days ago
            const cutoff = new Date(date);
            const now = new Date();
            const diffDays = (now.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBeGreaterThan(29);
            expect(diffDays).toBeLessThan(31);
            
            return {
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }),
        }),
      });

      await cleanupKtpPhotos();
    });
  });

  describe('getRetentionStats', () => {
    it('should return retention statistics', async () => {
      const { getRetentionStats } = await import('@/lib/compliance/data-retention');

      mockSelect.mockReturnValueOnce({
        not: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ count: 5, data: null, error: null }),
          }),
        }),
      });

      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { created_at: '2025-01-01T00:00:00Z' },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 10, data: null, error: null }),
        }),
      });

      const result = await getRetentionStats();

      expect(result.pendingKtpCleanup).toBe(5);
      expect(result.lastCleanupAt).toBe('2025-01-01T00:00:00Z');
      expect(result.totalCleanedLast30Days).toBe(10);
    });
  });
});

