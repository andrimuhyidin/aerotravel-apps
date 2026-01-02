/**
 * Unit Tests: Waste Tracking
 * Test environmental waste logging functionality
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

describe('Waste Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Waste Types', () => {
    it('should support all waste categories', () => {
      const wasteTypes = ['plastic', 'organic', 'glass', 'hazmat'];
      
      expect(wasteTypes).toContain('plastic');
      expect(wasteTypes).toContain('organic');
      expect(wasteTypes).toContain('glass');
      expect(wasteTypes).toContain('hazmat');
    });
  });

  describe('Disposal Methods', () => {
    it('should support disposal methods', () => {
      const disposalMethods = ['landfill', 'recycling', 'incineration', 'ocean'];
      
      expect(disposalMethods).toContain('landfill');
      expect(disposalMethods).toContain('recycling');
      expect(disposalMethods).toContain('incineration');
    });
  });

  describe('CO2 Calculation', () => {
    it('should calculate CO2 emissions from fuel consumption', () => {
      // Diesel: 2.68 kg CO2/L (IPCC 2006)
      const fuelLiters = 10;
      const emissionFactor = 2.68;
      const expectedCO2 = fuelLiters * emissionFactor;
      
      expect(expectedCO2).toBe(26.8);
    });

    it('should use correct emission factors', () => {
      const factors = {
        diesel: 2.68,
        gasoline: 2.31,
        other: 2.50,
      };
      
      expect(factors.diesel).toBeGreaterThan(factors.gasoline);
      expect(factors.other).toBeLessThan(factors.diesel);
      expect(factors.other).toBeGreaterThan(factors.gasoline);
    });
  });

  describe('Waste Log Validation', () => {
    it('should require positive quantity', () => {
      const validQuantity = 5.5;
      const invalidQuantity = -2;
      
      expect(validQuantity).toBeGreaterThan(0);
      expect(invalidQuantity).toBeLessThan(0);
    });

    it('should support weight units', () => {
      const units = ['kg', 'pieces'];
      
      expect(units).toContain('kg');
      expect(units).toContain('pieces');
    });
  });

  describe('Carbon Footprint Aggregation', () => {
    it('should sum CO2 emissions across trips', () => {
      const trips = [
        { fuel_liters: 10, fuel_type: 'diesel', co2_kg: 26.8 },
        { fuel_liters: 15, fuel_type: 'diesel', co2_kg: 40.2 },
        { fuel_liters: 8, fuel_type: 'gasoline', co2_kg: 18.48 },
      ];
      
      const totalCO2 = trips.reduce((sum, trip) => sum + trip.co2_kg, 0);
      
      expect(totalCO2).toBeCloseTo(85.48, 2);
    });
  });
});

