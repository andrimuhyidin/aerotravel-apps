/**
 * Unit Tests: Security Events Logger
 * Test security event monitoring functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SecurityEventParams } from '@/lib/audit/security-events';

// Mock Supabase
const mockInsert = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Sentry
vi.mock('@/lib/observability/sentry', () => ({
  captureSecurityEvent: vi.fn(),
}));

describe('Security Events Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logSecurityEvent', () => {
    it('should log failed login event to database', async () => {
      const { logSecurityEvent } = await import('@/lib/audit/security-events');

      mockInsert.mockResolvedValueOnce({ error: null });

      const params: SecurityEventParams = {
        eventType: 'failed_login',
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        metadata: { reason: 'Invalid password' },
      };

      const result = await logSecurityEvent(params);

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'failed_login',
          email: 'test@example.com',
          ip_address: '192.168.1.1',
        })
      );
    });

    it('should extract IP from request headers', async () => {
      const { logSecurityEvent } = await import('@/lib/audit/security-events');

      mockInsert.mockResolvedValueOnce({ error: null });

      const mockRequest = {
        headers: {
          get: vi.fn((key: string) => {
            if (key === 'x-forwarded-for') return '203.0.113.1, 198.51.100.1';
            if (key === 'user-agent') return 'Mozilla/5.0';
            return null;
          }),
        },
      } as unknown as Request;

      await logSecurityEvent(
        {
          eventType: 'failed_login',
          email: 'test@example.com',
        },
        mockRequest
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '203.0.113.1',
          user_agent: 'Mozilla/5.0',
        })
      );
    });

    it('should set appropriate severity for event types', async () => {
      const { logSecurityEvent } = await import('@/lib/audit/security-events');

      mockInsert.mockResolvedValue({ error: null });

      // Test failed login - should be medium
      await logSecurityEvent({ eventType: 'failed_login' });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'medium' })
      );

      // Test brute force - should be critical
      await logSecurityEvent({ eventType: 'brute_force_detected' });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'critical' })
      );

      // Test rate limit - should be low
      await logSecurityEvent({ eventType: 'rate_limit_exceeded' });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'low' })
      );
    });

    it('should return false on database error', async () => {
      const { logSecurityEvent } = await import('@/lib/audit/security-events');

      mockInsert.mockResolvedValueOnce({ error: new Error('Database error') });

      const result = await logSecurityEvent({
        eventType: 'failed_login',
        email: 'test@example.com',
      });

      expect(result).toBe(false);
    });
  });

  describe('logFailedLogin', () => {
    it('should log failed login with proper parameters', async () => {
      const { logFailedLogin } = await import('@/lib/audit/security-events');

      mockInsert.mockResolvedValueOnce({ error: null });

      await logFailedLogin('user@example.com', 'Invalid credentials');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'failed_login',
          email: 'user@example.com',
          metadata: { reason: 'Invalid credentials' },
          severity: 'medium',
        })
      );
    });
  });

  describe('logRateLimitExceeded', () => {
    it('should log rate limit event', async () => {
      const { logRateLimitExceeded } = await import('@/lib/audit/security-events');

      mockInsert.mockResolvedValueOnce({ error: null });

      await logRateLimitExceeded('192.168.1.1', '/api/public/chat');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'rate_limit_exceeded',
          metadata: { endpoint: '/api/public/chat' },
          severity: 'low',
        })
      );
    });
  });

  describe('logUnauthorizedAccess', () => {
    it('should log unauthorized access with high severity', async () => {
      const { logUnauthorizedAccess } = await import('@/lib/audit/security-events');

      mockInsert.mockResolvedValueOnce({ error: null });

      await logUnauthorizedAccess('user-123', '/admin/dashboard');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'unauthorized_access',
          user_id: 'user-123',
          metadata: { resource: '/admin/dashboard' },
          severity: 'high',
        })
      );
    });
  });

  describe('getSecurityEventSummary', () => {
    it('should fetch and format security event summary', async () => {
      const { getSecurityEventSummary } = await import('@/lib/audit/security-events');

      const mockSummaryData = [
        {
          event_type: 'failed_login',
          event_count: 15,
          unique_ips: 5,
          unique_emails: 3,
          severity: 'medium',
        },
        {
          event_type: 'rate_limit_exceeded',
          event_count: 50,
          unique_ips: 2,
          unique_emails: 0,
          severity: 'low',
        },
      ];

      mockRpc.mockResolvedValueOnce({ data: mockSummaryData, error: null });

      const result = await getSecurityEventSummary(7);

      expect(mockRpc).toHaveBeenCalledWith('get_security_event_summary', {
        p_days: 7,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        eventType: 'failed_login',
        eventCount: 15,
        uniqueIps: 5,
        uniqueEmails: 3,
        severity: 'medium',
      });
    });

    it('should return empty array on error', async () => {
      const { getSecurityEventSummary } = await import('@/lib/audit/security-events');

      mockRpc.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

      const result = await getSecurityEventSummary(7);

      expect(result).toEqual([]);
    });
  });
});

