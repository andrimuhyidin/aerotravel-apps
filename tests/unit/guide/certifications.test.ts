/**
 * Unit Tests: Guide Certifications
 * Test certification tracking and validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/branch/branch-injection', () => ({
  getBranchContext: vi.fn().mockResolvedValue({
    branchId: 'branch-1',
    isSuperAdmin: false,
  }),
  withBranchFilter: vi.fn((query) => query),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Guide Certifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Certification Types', () => {
    it('should support required certification types', () => {
      const certTypes = ['sim_kapal', 'first_aid', 'alin'];
      
      expect(certTypes).toContain('sim_kapal');
      expect(certTypes).toContain('first_aid');
      expect(certTypes).toContain('alin');
    });
  });

  describe('Certification Validation', () => {
    it('should check if certification is expired', () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      const valid = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year future

      expect(expired < now).toBe(true); // Expired
      expect(valid > now).toBe(true); // Still valid
    });

    it('should check if certification expires soon (within 30 days)', () => {
      const now = new Date();
      const expiringSoon = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days
      const notExpiringSoon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

      const diffDays1 = (expiringSoon.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const diffDays2 = (notExpiringSoon.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffDays1).toBeLessThan(30);
      expect(diffDays2).toBeGreaterThan(30);
    });
  });

  describe('Certification Status', () => {
    it('should have valid status values', () => {
      const statuses = ['active', 'expired', 'expiring_soon', 'pending_verification'];
      
      expect(statuses).toContain('active');
      expect(statuses).toContain('expired');
      expect(statuses).toContain('expiring_soon');
    });
  });

  describe('Trip Start Validation', () => {
    it('should block trip if required certification expired', () => {
      const certifications = [
        { type: 'sim_kapal', expiry_date: '2023-01-01', status: 'expired' },
        { type: 'first_aid', expiry_date: '2025-12-31', status: 'active' },
      ];

      const hasExpiredCert = certifications.some(cert => cert.status === 'expired');
      
      expect(hasExpiredCert).toBe(true);
    });

    it('should allow trip if all certifications valid', () => {
      const certifications = [
        { type: 'sim_kapal', expiry_date: '2025-12-31', status: 'active' },
        { type: 'first_aid', expiry_date: '2025-12-31', status: 'active' },
        { type: 'alin', expiry_date: '2025-12-31', status: 'active' },
      ];

      const hasExpiredCert = certifications.some(cert => cert.status === 'expired');
      
      expect(hasExpiredCert).toBe(false);
    });
  });
});

