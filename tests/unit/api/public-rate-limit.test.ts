/**
 * Unit Tests - Public Rate Limiter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  checkRateLimit, 
  getRequestIdentifier, 
  RATE_LIMIT_CONFIGS 
} from '@/lib/api/public-rate-limit';

describe('Public Rate Limiter', () => {
  beforeEach(() => {
    // Clear rate limit state by waiting for window to expire
    // In tests, we'll use unique identifiers
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-unique-1', RATE_LIMIT_CONFIGS.GET);
      
      expect(result.success).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(RATE_LIMIT_CONFIGS.GET.maxRequests);
    });

    it('should decrement remaining on each request', () => {
      const identifier = `test-decrement-${Date.now()}`;
      
      const first = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.GET);
      const second = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.GET);
      
      expect(second.remaining).toBeLessThan(first.remaining);
    });

    it('should block requests after limit exceeded', () => {
      const identifier = `test-block-${Date.now()}`;
      const config = { windowMs: 60000, maxRequests: 2 };
      
      // First two should succeed
      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);
      
      // Third should be blocked
      const blocked = checkRateLimit(identifier, config);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('should use default config if not provided', () => {
      const result = checkRateLimit(`test-default-${Date.now()}`);
      
      expect(result.success).toBe(true);
      expect(typeof result.resetAt).toBe('number');
    });
  });

  describe('getRequestIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: new Headers({
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        }),
      } as unknown as Request;
      
      const identifier = getRequestIdentifier(mockRequest);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = {
        headers: new Headers({
          'x-real-ip': '192.168.1.2',
        }),
      } as unknown as Request;
      
      const identifier = getRequestIdentifier(mockRequest);
      expect(identifier).toBe('192.168.1.2');
    });

    it('should return unknown if no IP headers', () => {
      const mockRequest = {
        headers: new Headers({}),
      } as unknown as Request;
      
      const identifier = getRequestIdentifier(mockRequest);
      expect(identifier).toBe('unknown');
    });
  });

  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have POST config', () => {
      expect(RATE_LIMIT_CONFIGS.POST).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.POST.maxRequests).toBeGreaterThan(0);
    });

    it('should have GET config', () => {
      expect(RATE_LIMIT_CONFIGS.GET).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.GET.maxRequests).toBeGreaterThan(0);
    });

    it('should have AI config with lower limit', () => {
      expect(RATE_LIMIT_CONFIGS.AI).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.AI.maxRequests).toBeLessThanOrEqual(RATE_LIMIT_CONFIGS.GET.maxRequests);
    });
  });
});

