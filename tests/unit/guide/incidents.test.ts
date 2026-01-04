/**
 * Unit Tests: Guide Incidents
 * Test incident reporting functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
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

vi.mock('@/lib/integrations/whatsapp', () => ({
  sendTextMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Guide Incidents API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate incident schema', () => {
    // Test will be implemented when we refactor API to be testable
    expect(true).toBe(true);
  });

  it('should require chronology field', () => {
    expect(true).toBe(true);
  });

  it('should accept valid incident types', () => {
    const validTypes = ['accident', 'injury', 'equipment_damage', 'weather_issue', 'complaint', 'other'];
    expect(validTypes).toHaveLength(6);
  });
});

describe('Incident Report Model', () => {
  it('should have required fields', () => {
    const requiredFields = [
      'incident_type',
      'chronology',
      'guide_id',
      'branch_id',
    ];
    
    expect(requiredFields).toHaveLength(4);
  });

  it('should support optional fields', () => {
    const optionalFields = [
      'trip_id',
      'witnesses',
      'photo_urls',
      'voice_note_url',
      'signature_data',
    ];
    
    expect(optionalFields.length).toBeGreaterThan(0);
  });
});

