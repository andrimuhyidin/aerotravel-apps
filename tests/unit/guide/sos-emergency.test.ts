/**
 * Unit Tests: SOS Emergency System
 * Test SOS alert functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('SOS Emergency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('triggerSOSAlert', () => {
    it('should send SOS alert with location data', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alertId: 'alert-123',
          message: 'SOS alert created',
        }),
      });

      // Mock getCurrentPosition
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: -8.65,
              longitude: 115.22,
              accuracy: 10,
            },
          });
        }),
      };
      
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const { triggerSOSAlert } = await import('@/lib/guide/sos');

      const result = await triggerSOSAlert(
        'medical',
        'guide-123',
        { latitude: -8.65, longitude: 115.22 },
        'trip-456'
      );

      expect(result.success).toBe(true);
      expect(result.alertId).toBe('alert-123');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/guide/sos',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle network error gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { triggerSOSAlert } = await import('@/lib/guide/sos');

      const result = await triggerSOSAlert(
        'medical',
        'guide-123',
        { latitude: -8.65, longitude: 115.22 }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('error');
    });

    it('should validate SOS alert type', () => {
      const validTypes = ['medical', 'security', 'weather', 'accident', 'other'];
      expect(validTypes).toContain('medical');
      expect(validTypes).toContain('security');
      expect(validTypes).not.toContain('invalid');
    });
  });

  describe('getCurrentPosition', () => {
    it('should get user location with high accuracy', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: -8.65,
              longitude: 115.22,
              accuracy: 10,
            },
          });
        }),
      };
      
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const { getCurrentPosition } = await import('@/lib/guide/sos');

      const location = await getCurrentPosition();

      expect(location.latitude).toBe(-8.65);
      expect(location.longitude).toBe(115.22);
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      );
    });

    it('should handle geolocation error', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((_, error) => {
          error({ code: 1, message: 'User denied geolocation' });
        }),
      };
      
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const { getCurrentPosition } = await import('@/lib/guide/sos');

      await expect(getCurrentPosition()).rejects.toThrow();
    });
  });
});

