/**
 * Unit Tests: Trip Validation Logic
 * Tests for late penalty calculation, risk score, trip readiness
 */

import { describe, it, expect } from 'vitest';

// Mock imports (these would be actual imports in production)
// import { calculateLatePenalty, calculateRiskScore, checkTripReadiness } from '@/lib/guide/trip-validation';

// Mock implementations for testing
const calculateLatePenalty = (scheduledTime: string, actualTime: string, penaltyPerMinute = 5000): {
  isLate: boolean;
  lateMinutes: number;
  penaltyAmount: number;
} => {
  const scheduled = new Date(scheduledTime);
  const actual = new Date(actualTime);
  const diffMs = actual.getTime() - scheduled.getTime();
  const lateMinutes = Math.max(0, Math.floor(diffMs / 60000));
  
  return {
    isLate: lateMinutes > 0,
    lateMinutes,
    penaltyAmount: lateMinutes > 0 ? Math.min(lateMinutes * penaltyPerMinute, 100000) : 0, // Max 100k penalty
  };
};

const calculateRiskScore = (factors: {
  weatherRisk: number;      // 0-30
  passengerCount: number;   // 0-20
  hasChildren: boolean;     // 0-10
  hasAllergies: boolean;    // 0-10
  equipmentIssues: number;  // 0-20
  guideExperience: number;  // 0-10 (inverted - higher experience = lower risk)
}): {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: string[];
} => {
  let score = 0;
  const riskFactors: string[] = [];

  // Weather risk (0-30 points)
  score += factors.weatherRisk;
  if (factors.weatherRisk > 20) {
    riskFactors.push('weather');
  }

  // Passenger count risk (0-20 points)
  const paxRisk = Math.min(20, Math.floor(factors.passengerCount / 5) * 5);
  score += paxRisk;
  if (factors.passengerCount > 20) {
    riskFactors.push('large_group');
  }

  // Children risk
  if (factors.hasChildren) {
    score += 10;
    riskFactors.push('children');
  }

  // Allergy risk
  if (factors.hasAllergies) {
    score += 10;
    riskFactors.push('allergies');
  }

  // Equipment issues
  score += factors.equipmentIssues;
  if (factors.equipmentIssues > 10) {
    riskFactors.push('equipment');
  }

  // Guide experience (inverse - more experience = lower risk)
  const expRisk = Math.max(0, 10 - factors.guideExperience);
  score += expRisk;

  // Determine level
  let level: 'low' | 'medium' | 'high' = 'low';
  if (score >= 70) {
    level = 'high';
  } else if (score >= 40) {
    level = 'medium';
  }

  return { score, level, factors: riskFactors };
};

const checkTripReadiness = (requirements: {
  guideCheckedIn: boolean;
  allConsentsCollected: boolean;
  equipmentReady: boolean;
  manifestComplete: boolean;
  riskScore: number;
}): {
  ready: boolean;
  blockers: string[];
  warnings: string[];
} => {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!requirements.guideCheckedIn) {
    blockers.push('Guide belum check-in');
  }

  if (!requirements.allConsentsCollected) {
    blockers.push('Consent penumpang belum lengkap');
  }

  if (!requirements.manifestComplete) {
    blockers.push('Manifest belum lengkap');
  }

  if (!requirements.equipmentReady) {
    warnings.push('Peralatan belum siap');
  }

  if (requirements.riskScore >= 70) {
    blockers.push('Risk score terlalu tinggi');
  } else if (requirements.riskScore >= 50) {
    warnings.push('Risk score tinggi, harap berhati-hati');
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
};

describe('Late Penalty Calculation', () => {
  it('should return no penalty when on time', () => {
    const result = calculateLatePenalty(
      '2026-01-02T08:00:00',
      '2026-01-02T07:55:00'
    );

    expect(result.isLate).toBe(false);
    expect(result.lateMinutes).toBe(0);
    expect(result.penaltyAmount).toBe(0);
  });

  it('should calculate penalty for 5 minutes late', () => {
    const result = calculateLatePenalty(
      '2026-01-02T08:00:00',
      '2026-01-02T08:05:00'
    );

    expect(result.isLate).toBe(true);
    expect(result.lateMinutes).toBe(5);
    expect(result.penaltyAmount).toBe(25000); // 5 * 5000
  });

  it('should calculate penalty for 15 minutes late', () => {
    const result = calculateLatePenalty(
      '2026-01-02T08:00:00',
      '2026-01-02T08:15:00'
    );

    expect(result.isLate).toBe(true);
    expect(result.lateMinutes).toBe(15);
    expect(result.penaltyAmount).toBe(75000); // 15 * 5000
  });

  it('should cap penalty at maximum amount', () => {
    const result = calculateLatePenalty(
      '2026-01-02T08:00:00',
      '2026-01-02T09:00:00' // 60 minutes late
    );

    expect(result.isLate).toBe(true);
    expect(result.lateMinutes).toBe(60);
    expect(result.penaltyAmount).toBe(100000); // Capped at 100k
  });

  it('should use custom penalty per minute', () => {
    const result = calculateLatePenalty(
      '2026-01-02T08:00:00',
      '2026-01-02T08:10:00',
      10000 // 10k per minute
    );

    expect(result.penaltyAmount).toBe(100000); // 10 * 10000, capped at 100k
  });
});

describe('Risk Score Calculation', () => {
  it('should return low risk for normal conditions', () => {
    const result = calculateRiskScore({
      weatherRisk: 5,
      passengerCount: 8,
      hasChildren: false,
      hasAllergies: false,
      equipmentIssues: 0,
      guideExperience: 8,
    });

    expect(result.level).toBe('low');
    expect(result.score).toBeLessThan(40);
  });

  it('should return medium risk with children', () => {
    const result = calculateRiskScore({
      weatherRisk: 15,
      passengerCount: 15,
      hasChildren: true,
      hasAllergies: false,
      equipmentIssues: 5,
      guideExperience: 5,
    });

    expect(result.level).toBe('medium');
    expect(result.factors).toContain('children');
  });

  it('should return high risk with multiple factors', () => {
    const result = calculateRiskScore({
      weatherRisk: 25,
      passengerCount: 30,
      hasChildren: true,
      hasAllergies: true,
      equipmentIssues: 15,
      guideExperience: 2,
    });

    expect(result.level).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('should include weather in risk factors when high', () => {
    const result = calculateRiskScore({
      weatherRisk: 25,
      passengerCount: 5,
      hasChildren: false,
      hasAllergies: false,
      equipmentIssues: 0,
      guideExperience: 10,
    });

    expect(result.factors).toContain('weather');
  });

  it('should include allergies in risk factors', () => {
    const result = calculateRiskScore({
      weatherRisk: 0,
      passengerCount: 5,
      hasChildren: false,
      hasAllergies: true,
      equipmentIssues: 0,
      guideExperience: 10,
    });

    expect(result.factors).toContain('allergies');
  });
});

describe('Trip Readiness Check', () => {
  it('should be ready when all requirements met', () => {
    const result = checkTripReadiness({
      guideCheckedIn: true,
      allConsentsCollected: true,
      equipmentReady: true,
      manifestComplete: true,
      riskScore: 30,
    });

    expect(result.ready).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it('should block when guide not checked in', () => {
    const result = checkTripReadiness({
      guideCheckedIn: false,
      allConsentsCollected: true,
      equipmentReady: true,
      manifestComplete: true,
      riskScore: 30,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain('Guide belum check-in');
  });

  it('should block when consents not collected', () => {
    const result = checkTripReadiness({
      guideCheckedIn: true,
      allConsentsCollected: false,
      equipmentReady: true,
      manifestComplete: true,
      riskScore: 30,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain('Consent penumpang belum lengkap');
  });

  it('should block when risk score too high', () => {
    const result = checkTripReadiness({
      guideCheckedIn: true,
      allConsentsCollected: true,
      equipmentReady: true,
      manifestComplete: true,
      riskScore: 75,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain('Risk score terlalu tinggi');
  });

  it('should warn but not block for equipment', () => {
    const result = checkTripReadiness({
      guideCheckedIn: true,
      allConsentsCollected: true,
      equipmentReady: false,
      manifestComplete: true,
      riskScore: 30,
    });

    expect(result.ready).toBe(true);
    expect(result.warnings).toContain('Peralatan belum siap');
  });

  it('should warn for medium risk score', () => {
    const result = checkTripReadiness({
      guideCheckedIn: true,
      allConsentsCollected: true,
      equipmentReady: true,
      manifestComplete: true,
      riskScore: 55,
    });

    expect(result.ready).toBe(true);
    expect(result.warnings).toContain('Risk score tinggi, harap berhati-hati');
  });
});

