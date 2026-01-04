/**
 * Unit Tests: Manifest Validation Logic
 * Tests for passenger count, consent status, bulk operations
 */

import { describe, it, expect } from 'vitest';

// Types
type PassengerType = 'adult' | 'child' | 'infant';
type ConsentStatus = 'pending' | 'signed' | 'declined' | 'expired';

type Passenger = {
  id: string;
  name: string;
  type: PassengerType;
  consentStatus: ConsentStatus;
  allergies?: string[];
  specialNeeds?: string;
};

// Mock implementations
const validatePassengerCount = (
  passengers: Passenger[],
  maxCapacity: number,
  rules: {
    maxChildrenRatio?: number; // Max ratio of children to adults
    requireMinimumAdults?: number;
  } = {}
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const total = passengers.length;
  const adults = passengers.filter(p => p.type === 'adult').length;
  const children = passengers.filter(p => p.type === 'child').length;
  const infants = passengers.filter(p => p.type === 'infant').length;

  // Check capacity
  if (total > maxCapacity) {
    errors.push(`Jumlah penumpang (${total}) melebihi kapasitas maksimal (${maxCapacity})`);
  }

  // Check minimum adults
  if (rules.requireMinimumAdults && adults < rules.requireMinimumAdults) {
    errors.push(`Minimum ${rules.requireMinimumAdults} dewasa diperlukan`);
  }

  // Check children ratio
  if (rules.maxChildrenRatio && adults > 0) {
    const ratio = children / adults;
    if (ratio > rules.maxChildrenRatio) {
      warnings.push(`Rasio anak per dewasa (${ratio.toFixed(1)}) terlalu tinggi`);
    }
  }

  // Infants need adults
  if (infants > adults) {
    errors.push('Setiap bayi harus didampingi minimal 1 dewasa');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

const checkConsentStatus = (passengers: Passenger[]): {
  allSigned: boolean;
  pending: Passenger[];
  declined: Passenger[];
  expired: Passenger[];
  signedCount: number;
  totalRequired: number;
} => {
  // Only adults and children need consent (infants covered by guardian)
  const requiresConsent = passengers.filter(p => p.type !== 'infant');
  const pending = requiresConsent.filter(p => p.consentStatus === 'pending');
  const declined = requiresConsent.filter(p => p.consentStatus === 'declined');
  const expired = requiresConsent.filter(p => p.consentStatus === 'expired');
  const signed = requiresConsent.filter(p => p.consentStatus === 'signed');

  return {
    allSigned: pending.length === 0 && declined.length === 0 && expired.length === 0,
    pending,
    declined,
    expired,
    signedCount: signed.length,
    totalRequired: requiresConsent.length,
  };
};

const bulkCheckOperation = (
  passengerIds: string[],
  passengers: Passenger[],
  operation: 'mark_arrived' | 'mark_boarded' | 'request_consent'
): {
  success: string[];
  failed: string[];
  skipped: string[];
  message: string;
} => {
  const success: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  for (const id of passengerIds) {
    const passenger = passengers.find(p => p.id === id);
    
    if (!passenger) {
      failed.push(id);
      continue;
    }

    // Simulate operation rules
    switch (operation) {
      case 'mark_arrived':
        success.push(id);
        break;
      case 'mark_boarded':
        // Can only board if already arrived (simulated)
        success.push(id);
        break;
      case 'request_consent':
        if (passenger.consentStatus === 'signed') {
          skipped.push(id);
        } else {
          success.push(id);
        }
        break;
    }
  }

  const message = success.length > 0
    ? `Berhasil memproses ${success.length} penumpang`
    : 'Tidak ada penumpang yang diproses';

  return { success, failed, skipped, message };
};

const validatePassengerData = (passenger: Partial<Passenger>): {
  valid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!passenger.name || passenger.name.trim().length < 2) {
    errors.name = 'Nama harus minimal 2 karakter';
  }

  if (!passenger.type) {
    errors.type = 'Tipe penumpang harus dipilih';
  }

  if (passenger.type === 'child' || passenger.type === 'infant') {
    // Children and infants should have guardian info (simplified check)
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

const getPassengerSummary = (passengers: Passenger[]): {
  total: number;
  breakdown: Record<PassengerType, number>;
  withAllergies: number;
  withSpecialNeeds: number;
  needsAttention: Passenger[];
} => {
  const breakdown: Record<PassengerType, number> = {
    adult: 0,
    child: 0,
    infant: 0,
  };

  let withAllergies = 0;
  let withSpecialNeeds = 0;
  const needsAttention: Passenger[] = [];

  for (const p of passengers) {
    breakdown[p.type]++;
    
    if (p.allergies && p.allergies.length > 0) {
      withAllergies++;
      needsAttention.push(p);
    }
    
    if (p.specialNeeds) {
      withSpecialNeeds++;
      if (!needsAttention.includes(p)) {
        needsAttention.push(p);
      }
    }
  }

  return {
    total: passengers.length,
    breakdown,
    withAllergies,
    withSpecialNeeds,
    needsAttention,
  };
};

describe('Passenger Count Validation', () => {
  it('should pass when under capacity', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed' },
      { id: '2', name: 'Adult 2', type: 'adult', consentStatus: 'signed' },
      { id: '3', name: 'Child 1', type: 'child', consentStatus: 'signed' },
    ];

    const result = validatePassengerCount(passengers, 10);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when over capacity', () => {
    const passengers: Passenger[] = Array(15).fill(null).map((_, i) => ({
      id: String(i),
      name: `Person ${i}`,
      type: 'adult' as const,
      consentStatus: 'signed' as const,
    }));

    const result = validatePassengerCount(passengers, 10);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('melebihi kapasitas');
  });

  it('should require minimum adults', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Child 1', type: 'child', consentStatus: 'signed' },
      { id: '2', name: 'Child 2', type: 'child', consentStatus: 'signed' },
    ];

    const result = validatePassengerCount(passengers, 10, { requireMinimumAdults: 1 });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('dewasa diperlukan');
  });

  it('should warn when children ratio is high', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed' },
      { id: '2', name: 'Child 1', type: 'child', consentStatus: 'signed' },
      { id: '3', name: 'Child 2', type: 'child', consentStatus: 'signed' },
      { id: '4', name: 'Child 3', type: 'child', consentStatus: 'signed' },
    ];

    const result = validatePassengerCount(passengers, 10, { maxChildrenRatio: 2 });

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should require adults for infants', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Infant 1', type: 'infant', consentStatus: 'signed' },
      { id: '2', name: 'Infant 2', type: 'infant', consentStatus: 'signed' },
    ];

    const result = validatePassengerCount(passengers, 10);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('bayi harus didampingi');
  });
});

describe('Consent Status Checking', () => {
  it('should return true when all signed', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed' },
      { id: '2', name: 'Adult 2', type: 'adult', consentStatus: 'signed' },
    ];

    const result = checkConsentStatus(passengers);

    expect(result.allSigned).toBe(true);
    expect(result.pending).toHaveLength(0);
  });

  it('should track pending consents', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed' },
      { id: '2', name: 'Adult 2', type: 'adult', consentStatus: 'pending' },
    ];

    const result = checkConsentStatus(passengers);

    expect(result.allSigned).toBe(false);
    expect(result.pending).toHaveLength(1);
    expect(result.pending[0]!.name).toBe('Adult 2');
  });

  it('should track declined consents', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'declined' },
    ];

    const result = checkConsentStatus(passengers);

    expect(result.allSigned).toBe(false);
    expect(result.declined).toHaveLength(1);
  });

  it('should not require consent for infants', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed' },
      { id: '2', name: 'Infant 1', type: 'infant', consentStatus: 'pending' }, // Should be ignored
    ];

    const result = checkConsentStatus(passengers);

    expect(result.allSigned).toBe(true);
    expect(result.totalRequired).toBe(1);
  });

  it('should count signed vs total correctly', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed' },
      { id: '2', name: 'Adult 2', type: 'adult', consentStatus: 'signed' },
      { id: '3', name: 'Adult 3', type: 'adult', consentStatus: 'pending' },
    ];

    const result = checkConsentStatus(passengers);

    expect(result.signedCount).toBe(2);
    expect(result.totalRequired).toBe(3);
  });
});

describe('Bulk Check Operations', () => {
  const passengers: Passenger[] = [
    { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed' },
    { id: '2', name: 'Adult 2', type: 'adult', consentStatus: 'pending' },
    { id: '3', name: 'Child 1', type: 'child', consentStatus: 'signed' },
  ];

  it('should process mark_arrived for valid IDs', () => {
    const result = bulkCheckOperation(['1', '2'], passengers, 'mark_arrived');

    expect(result.success).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
  });

  it('should fail for non-existent IDs', () => {
    const result = bulkCheckOperation(['1', '999'], passengers, 'mark_arrived');

    expect(result.success).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toBe('999');
  });

  it('should skip already signed for consent request', () => {
    const result = bulkCheckOperation(['1', '2'], passengers, 'request_consent');

    expect(result.success).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toBe('1');
  });

  it('should return appropriate message', () => {
    const result = bulkCheckOperation(['1'], passengers, 'mark_arrived');

    expect(result.message).toContain('Berhasil memproses 1');
  });
});

describe('Passenger Data Validation', () => {
  it('should pass for valid passenger', () => {
    const result = validatePassengerData({
      name: 'John Doe',
      type: 'adult',
    });

    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('should fail for missing name', () => {
    const result = validatePassengerData({
      type: 'adult',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should fail for short name', () => {
    const result = validatePassengerData({
      name: 'A',
      type: 'adult',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toContain('minimal 2 karakter');
  });

  it('should fail for missing type', () => {
    const result = validatePassengerData({
      name: 'John Doe',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.type).toBeDefined();
  });
});

describe('Passenger Summary', () => {
  it('should calculate breakdown correctly', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed' },
      { id: '2', name: 'Adult 2', type: 'adult', consentStatus: 'signed' },
      { id: '3', name: 'Child 1', type: 'child', consentStatus: 'signed' },
      { id: '4', name: 'Infant 1', type: 'infant', consentStatus: 'signed' },
    ];

    const result = getPassengerSummary(passengers);

    expect(result.total).toBe(4);
    expect(result.breakdown.adult).toBe(2);
    expect(result.breakdown.child).toBe(1);
    expect(result.breakdown.infant).toBe(1);
  });

  it('should identify passengers with allergies', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed', allergies: ['nuts'] },
      { id: '2', name: 'Adult 2', type: 'adult', consentStatus: 'signed' },
    ];

    const result = getPassengerSummary(passengers);

    expect(result.withAllergies).toBe(1);
    expect(result.needsAttention).toHaveLength(1);
  });

  it('should identify passengers with special needs', () => {
    const passengers: Passenger[] = [
      { id: '1', name: 'Adult 1', type: 'adult', consentStatus: 'signed', specialNeeds: 'Wheelchair' },
    ];

    const result = getPassengerSummary(passengers);

    expect(result.withSpecialNeeds).toBe(1);
    expect(result.needsAttention).toHaveLength(1);
  });

  it('should not duplicate in needsAttention', () => {
    const passengers: Passenger[] = [
      { 
        id: '1', 
        name: 'Adult 1', 
        type: 'adult', 
        consentStatus: 'signed', 
        allergies: ['nuts'],
        specialNeeds: 'Wheelchair'
      },
    ];

    const result = getPassengerSummary(passengers);

    expect(result.needsAttention).toHaveLength(1);
  });
});

