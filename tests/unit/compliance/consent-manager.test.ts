/**
 * Unit Tests: Consent Manager
 * Test GDPR/PDP consent management functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockRpc = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  upsert: mockUpsert,
  update: mockUpdate,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Consent Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default chain behavior
    mockSelect.mockReturnValue({ eq: mockEq, in: mockIn, order: mockOrder, single: mockSingle });
    mockEq.mockReturnValue({ single: mockSingle });
    mockIn.mockReturnValue({ data: [], error: null });
    mockOrder.mockReturnValue({ data: [], error: null });
  });

  describe('getConsentPurposes', () => {
    it('should fetch active consent purposes', async () => {
      const { getConsentPurposes } = await import('@/lib/pdp/consent-manager');

      const mockPurposes = [
        {
          id: '1',
          purpose_code: 'MARKETING',
          purpose_name: 'Marketing Communications',
          description: 'Send promotional emails',
          is_mandatory: false,
          category: 'marketing',
          legal_basis: 'consent',
          retention_period: 365,
        },
        {
          id: '2',
          purpose_code: 'OPERATIONAL',
          purpose_name: 'Service Delivery',
          description: 'Provide travel services',
          is_mandatory: true,
          category: 'operational',
          legal_basis: 'contract',
          retention_period: 730,
        },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPurposes, error: null }),
          }),
        }),
      });

      const result = await getConsentPurposes();

      expect(result).toHaveLength(2);
      expect(result[0].purposeCode).toBe('MARKETING');
      expect(result[1].isMandatory).toBe(true);
    });

    it('should return empty array on error', async () => {
      const { getConsentPurposes } = await import('@/lib/pdp/consent-manager');

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      });

      const result = await getConsentPurposes();

      expect(result).toEqual([]);
    });
  });

  describe('recordConsent', () => {
    it('should record user consent with metadata', async () => {
      const { recordConsent } = await import('@/lib/pdp/consent-manager');

      mockSingle.mockResolvedValueOnce({ data: { id: 'purpose-1' }, error: null });
      mockUpsert.mockResolvedValueOnce({ error: null });

      const result = await recordConsent(
        'user-123',
        'MARKETING',
        true,
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          deviceInfo: { platform: 'web' },
        }
      );

      expect(result).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          consent_given: true,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
        }),
        { onConflict: 'user_id,purpose_id' }
      );
    });

    it('should return false if purpose not found', async () => {
      const { recordConsent } = await import('@/lib/pdp/consent-manager');

      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await recordConsent('user-123', 'UNKNOWN', true);

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      const { recordConsent } = await import('@/lib/pdp/consent-manager');

      mockSingle.mockResolvedValueOnce({ data: { id: 'purpose-1' }, error: null });
      mockUpsert.mockResolvedValueOnce({ error: new Error('DB error') });

      const result = await recordConsent('user-123', 'MARKETING', true);

      expect(result).toBe(false);
    });
  });

  describe('withdrawConsent', () => {
    it('should withdraw non-mandatory consent', async () => {
      const { withdrawConsent } = await import('@/lib/pdp/consent-manager');

      mockSingle.mockResolvedValueOnce({
        data: { id: 'purpose-1', is_mandatory: false },
        error: null,
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await withdrawConsent('user-123', 'MARKETING', 'No longer interested');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          consent_given: false,
          withdrawal_reason: 'No longer interested',
        })
      );
    });

    it('should not allow withdrawal of mandatory consent', async () => {
      const { withdrawConsent } = await import('@/lib/pdp/consent-manager');

      mockSingle.mockResolvedValueOnce({
        data: { id: 'purpose-1', is_mandatory: true },
        error: null,
      });

      const result = await withdrawConsent('user-123', 'OPERATIONAL');

      expect(result).toBe(false);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('hasConsent', () => {
    it('should check if user has given consent', async () => {
      const { hasConsent } = await import('@/lib/pdp/consent-manager');

      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const result = await hasConsent('user-123', 'MARKETING');

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('get_user_consent', {
        p_user_id: 'user-123',
        p_purpose_code: 'MARKETING',
      });
    });

    it('should return false on error', async () => {
      const { hasConsent } = await import('@/lib/pdp/consent-manager');

      mockRpc.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

      const result = await hasConsent('user-123', 'MARKETING');

      expect(result).toBe(false);
    });
  });

  describe('recordBulkConsents', () => {
    it('should record multiple consents at once', async () => {
      const { recordBulkConsents } = await import('@/lib/pdp/consent-manager');

      mockIn.mockResolvedValueOnce({
        data: [
          { id: 'p1', purpose_code: 'MARKETING' },
          { id: 'p2', purpose_code: 'ANALYTICS' },
        ],
        error: null,
      });

      mockUpsert.mockResolvedValueOnce({ error: null });

      const consents = [
        { purposeCode: 'MARKETING', consentGiven: true },
        { purposeCode: 'ANALYTICS', consentGiven: false },
      ];

      const result = await recordBulkConsents('user-123', consents, {
        ipAddress: '192.168.1.1',
      });

      expect(result).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'user-123',
            purpose_id: 'p1',
            consent_given: true,
          }),
          expect.objectContaining({
            user_id: 'user-123',
            purpose_id: 'p2',
            consent_given: false,
          }),
        ]),
        { onConflict: 'user_id,purpose_id' }
      );
    });

    it('should return false if no purposes found', async () => {
      const { recordBulkConsents } = await import('@/lib/pdp/consent-manager');

      mockIn.mockResolvedValueOnce({ data: [], error: null });

      const result = await recordBulkConsents('user-123', [
        { purposeCode: 'UNKNOWN', consentGiven: true },
      ]);

      expect(result).toBe(false);
    });
  });
});

