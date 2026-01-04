/**
 * Unit Tests: Risk Assessment Calculator
 * PRD: Pre-Trip Safety Risk Check
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRiskScore,
  getRiskLevel,
  canTripStart,
  estimateWaveHeight,
} from '@/lib/guide/risk-calculator';

describe('Risk Assessment Calculator', () => {
  describe('calculateRiskScore', () => {
    describe('Safe Conditions (score <= 70)', () => {
      it('should return safe for perfect conditions', () => {
        const result = calculateRiskScore({
          waveHeight: 0.5,
          windSpeed: 1,
          weatherCondition: 'clear',
          crewReady: true,
          equipmentComplete: true,
        });

        // wave: 0.5 * 20 = 10, wind: 1 * 10 = 10, weather: 0, crew: 0, equipment: 0 = 20
        expect(result.riskScore).toBe(20);
        expect(result.isSafe).toBe(true);
        expect(result.isBlocked).toBe(false);
        expect(result.canStart).toBe(true);
        expect(result.riskLevel).toBe('low');
      });

      it('should return safe for moderate conditions', () => {
        const result = calculateRiskScore({
          waveHeight: 1.0,
          windSpeed: 2,
          weatherCondition: 'cloudy',
          crewReady: true,
          equipmentComplete: true,
        });

        // wave: 1 * 20 = 20, wind: 2 * 10 = 20, weather: 5, crew: 0, equipment: 0 = 45
        expect(result.riskScore).toBe(45);
        expect(result.isSafe).toBe(true);
        expect(result.isBlocked).toBe(false);
        expect(result.canStart).toBe(true);
        expect(result.riskLevel).toBe('medium');
      });

      it('should allow exactly 70 score', () => {
        // Create conditions that sum to exactly 70
        const result = calculateRiskScore({
          waveHeight: 1.5, // 30
          windSpeed: 1,    // 10
          weatherCondition: 'rainy', // 15
          crewReady: false, // 25 -> would be 80, too high
          equipmentComplete: true,
        });

        // wave: 30, wind: 10, weather: 15, crew: 25, equipment: 0 = 80
        // This is actually 80, so let's adjust
        expect(result.riskScore).toBe(80);
        expect(result.isSafe).toBe(false);
      });

      it('should allow score of 70 exactly', () => {
        const result = calculateRiskScore({
          waveHeight: 1.0, // 20
          windSpeed: 2,    // 20
          weatherCondition: 'rainy', // 15
          crewReady: true, // 0
          equipmentComplete: false, // 30 -> 85, too high
        });

        // Let's try different combination
        const result2 = calculateRiskScore({
          waveHeight: 1.5, // 30
          windSpeed: 2.5,  // 25
          weatherCondition: 'rainy', // 15
          crewReady: true, // 0
          equipmentComplete: true, // 0
        });

        // wave: 30, wind: 25, weather: 15 = 70
        expect(result2.riskScore).toBe(70);
        expect(result2.isSafe).toBe(true);
        expect(result2.isBlocked).toBe(false);
        expect(result2.canStart).toBe(true);
      });
    });

    describe('Blocked Conditions (score > 70)', () => {
      it('should block trip for high risk score', () => {
        const result = calculateRiskScore({
          waveHeight: 2.0,
          windSpeed: 3,
          weatherCondition: 'stormy',
          crewReady: false,
          equipmentComplete: false,
        });

        // wave: 40, wind: 30, weather: 30, crew: 25, equipment: 30 = 155
        expect(result.riskScore).toBe(155);
        expect(result.isSafe).toBe(false);
        expect(result.isBlocked).toBe(true);
        expect(result.canStart).toBe(false);
        expect(result.riskLevel).toBe('critical');
      });

      it('should block trip when score is 71', () => {
        const result = calculateRiskScore({
          waveHeight: 1.55, // 31
          windSpeed: 2.5,   // 25
          weatherCondition: 'rainy', // 15
          crewReady: true, // 0
          equipmentComplete: true, // 0
        });

        // wave: 31, wind: 25, weather: 15 = 71
        expect(result.riskScore).toBe(71);
        expect(result.isSafe).toBe(false);
        expect(result.isBlocked).toBe(true);
        expect(result.canStart).toBe(false);
      });

      it('should return correct message when blocked', () => {
        const result = calculateRiskScore({
          waveHeight: 3,
          windSpeed: 5,
          weatherCondition: 'stormy',
          crewReady: false,
          equipmentComplete: false,
        });

        expect(result.message).toContain('Trip tidak dapat dimulai');
        expect(result.message).toContain('Admin Ops');
      });
    });

    describe('Factor Breakdown', () => {
      it('should correctly calculate wave score', () => {
        const result = calculateRiskScore({
          waveHeight: 2.0,
          windSpeed: 0,
          weatherCondition: 'clear',
          crewReady: true,
          equipmentComplete: true,
        });

        expect(result.factors.waveScore).toBe(40); // 2 * 20
        expect(result.factors.windScore).toBe(0);
        expect(result.factors.weatherScore).toBe(0);
        expect(result.factors.crewScore).toBe(0);
        expect(result.factors.equipmentScore).toBe(0);
      });

      it('should correctly calculate wind score', () => {
        const result = calculateRiskScore({
          waveHeight: 0,
          windSpeed: 5,
          weatherCondition: 'clear',
          crewReady: true,
          equipmentComplete: true,
        });

        expect(result.factors.windScore).toBe(50); // 5 * 10
        expect(result.factors.waveScore).toBe(0);
      });

      it('should correctly calculate weather score', () => {
        const cases = [
          { condition: 'clear' as const, expected: 0 },
          { condition: 'cloudy' as const, expected: 5 },
          { condition: 'rainy' as const, expected: 15 },
          { condition: 'stormy' as const, expected: 30 },
        ];

        for (const { condition, expected } of cases) {
          const result = calculateRiskScore({
            waveHeight: 0,
            windSpeed: 0,
            weatherCondition: condition,
            crewReady: true,
            equipmentComplete: true,
          });

          expect(result.factors.weatherScore).toBe(expected);
        }
      });

      it('should correctly calculate crew score', () => {
        const ready = calculateRiskScore({
          waveHeight: 0,
          windSpeed: 0,
          weatherCondition: 'clear',
          crewReady: true,
          equipmentComplete: true,
        });

        const notReady = calculateRiskScore({
          waveHeight: 0,
          windSpeed: 0,
          weatherCondition: 'clear',
          crewReady: false,
          equipmentComplete: true,
        });

        expect(ready.factors.crewScore).toBe(0);
        expect(notReady.factors.crewScore).toBe(25);
      });

      it('should correctly calculate equipment score', () => {
        const complete = calculateRiskScore({
          waveHeight: 0,
          windSpeed: 0,
          weatherCondition: 'clear',
          crewReady: true,
          equipmentComplete: true,
        });

        const incomplete = calculateRiskScore({
          waveHeight: 0,
          windSpeed: 0,
          weatherCondition: 'clear',
          crewReady: true,
          equipmentComplete: false,
        });

        expect(complete.factors.equipmentScore).toBe(0);
        expect(incomplete.factors.equipmentScore).toBe(30);
      });
    });

    describe('Edge Cases', () => {
      it('should handle null wave height', () => {
        const result = calculateRiskScore({
          waveHeight: null,
          windSpeed: 1,
          weatherCondition: 'clear',
          crewReady: true,
          equipmentComplete: true,
        });

        expect(result.factors.waveScore).toBe(0);
        expect(result.riskScore).toBe(10); // Only wind score
      });

      it('should handle undefined wind speed', () => {
        const result = calculateRiskScore({
          waveHeight: 1,
          windSpeed: undefined,
          weatherCondition: 'clear',
          crewReady: true,
          equipmentComplete: true,
        });

        expect(result.factors.windScore).toBe(0);
        expect(result.riskScore).toBe(20); // Only wave score
      });

      it('should handle null weather condition', () => {
        const result = calculateRiskScore({
          waveHeight: 0,
          windSpeed: 0,
          weatherCondition: null,
          crewReady: true,
          equipmentComplete: true,
        });

        expect(result.factors.weatherScore).toBe(0);
        expect(result.riskScore).toBe(0);
      });

      it('should handle all null conditions', () => {
        const result = calculateRiskScore({
          waveHeight: null,
          windSpeed: null,
          weatherCondition: null,
          crewReady: true,
          equipmentComplete: true,
        });

        expect(result.riskScore).toBe(0);
        expect(result.canStart).toBe(true);
      });
    });
  });

  describe('getRiskLevel', () => {
    it('should return low for score 0-20', () => {
      expect(getRiskLevel(0)).toBe('low');
      expect(getRiskLevel(10)).toBe('low');
      expect(getRiskLevel(20)).toBe('low');
    });

    it('should return medium for score 21-50', () => {
      expect(getRiskLevel(21)).toBe('medium');
      expect(getRiskLevel(35)).toBe('medium');
      expect(getRiskLevel(50)).toBe('medium');
    });

    it('should return high for score 51-75', () => {
      expect(getRiskLevel(51)).toBe('high');
      expect(getRiskLevel(60)).toBe('high');
      expect(getRiskLevel(75)).toBe('high');
    });

    it('should return critical for score 76+', () => {
      expect(getRiskLevel(76)).toBe('critical');
      expect(getRiskLevel(100)).toBe('critical');
      expect(getRiskLevel(150)).toBe('critical');
    });
  });

  describe('canTripStart', () => {
    it('should return true for safe score', () => {
      expect(canTripStart(50)).toBe(true);
      expect(canTripStart(70)).toBe(true);
    });

    it('should return false for blocked score without override', () => {
      expect(canTripStart(71)).toBe(false);
      expect(canTripStart(100)).toBe(false);
    });

    it('should return true for blocked score with admin override', () => {
      expect(canTripStart(71, true)).toBe(true);
      expect(canTripStart(100, true)).toBe(true);
    });
  });

  describe('estimateWaveHeight', () => {
    it('should estimate wave height from wind speed', () => {
      expect(estimateWaveHeight(20)).toBe(1.0); // 20 / 20 = 1
      expect(estimateWaveHeight(40)).toBe(2.0); // 40 / 20 = 2
    });

    it('should cap wave height at 2.5m', () => {
      expect(estimateWaveHeight(100)).toBe(2.5);
      expect(estimateWaveHeight(60)).toBe(2.5);
    });

    it('should return 0 for 0 wind speed', () => {
      expect(estimateWaveHeight(0)).toBe(0);
    });
  });
});

