/**
 * Unit Tests: Partner Analytics
 */

import { describe, it, expect } from 'vitest';

describe('CLV Calculations', () => {
  function calculateCLV(
    totalSpend: number,
    bookingsCount: number,
    monthsAsCustomer: number
  ): { clv: number; monthlyValue: number; avgOrderValue: number } {
    const avgOrderValue = bookingsCount > 0 ? totalSpend / bookingsCount : 0;
    const monthlyValue = monthsAsCustomer > 0 ? totalSpend / monthsAsCustomer : 0;
    const clv = monthlyValue * 12; // Annualized CLV
    
    return {
      clv: Math.round(clv),
      monthlyValue: Math.round(monthlyValue),
      avgOrderValue: Math.round(avgOrderValue),
    };
  }

  it('should calculate CLV correctly', () => {
    const result = calculateCLV(12000000, 4, 12);
    expect(result.clv).toBe(12000000);
    expect(result.monthlyValue).toBe(1000000);
    expect(result.avgOrderValue).toBe(3000000);
  });

  it('should handle new customer', () => {
    const result = calculateCLV(5000000, 1, 1);
    expect(result.clv).toBe(60000000); // Projected annual
    expect(result.avgOrderValue).toBe(5000000);
  });

  it('should handle zero values', () => {
    const result = calculateCLV(0, 0, 0);
    expect(result.clv).toBe(0);
    expect(result.monthlyValue).toBe(0);
    expect(result.avgOrderValue).toBe(0);
  });
});

describe('Churn Risk Assessment', () => {
  function assessChurnRisk(
    daysSinceLastBooking: number,
    bookingsLast90Days: number,
    totalBookings: number
  ): { risk: 'low' | 'medium' | 'high' | 'critical'; score: number } {
    let score = 0;
    
    // Days since last booking factor (0-40 points)
    if (daysSinceLastBooking > 180) score += 40;
    else if (daysSinceLastBooking > 90) score += 30;
    else if (daysSinceLastBooking > 60) score += 20;
    else if (daysSinceLastBooking > 30) score += 10;
    
    // Recent activity factor (0-30 points)
    if (bookingsLast90Days === 0) score += 30;
    else if (bookingsLast90Days === 1) score += 15;
    
    // Historical engagement factor (0-30 points)
    if (totalBookings === 1) score += 20;
    else if (totalBookings <= 3) score += 10;
    
    let risk: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 70) risk = 'critical';
    else if (score >= 50) risk = 'high';
    else if (score >= 30) risk = 'medium';
    else risk = 'low';
    
    return { risk, score };
  }

  it('should identify critical risk', () => {
    const result = assessChurnRisk(200, 0, 1);
    expect(result.risk).toBe('critical');
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('should identify high risk', () => {
    const result = assessChurnRisk(100, 0, 5); // Adjusted for correct scoring
    expect(result.risk).toBe('high');
  });

  it('should identify low risk for active customer', () => {
    const result = assessChurnRisk(10, 3, 20);
    expect(result.risk).toBe('low');
    expect(result.score).toBeLessThan(30);
  });

  it('should identify medium risk', () => {
    const result = assessChurnRisk(70, 1, 5); // 60-89 days = 20 points + 1 booking = 15 + low bookings = 10 = 45 points
    expect(result.risk).toBe('medium');
  });
});

describe('Sales Forecasting', () => {
  function forecastNextMonth(
    last3MonthsRevenue: number[],
    seasonalityFactor: number = 1.0
  ): { forecast: number; confidence: 'low' | 'medium' | 'high' } {
    if (last3MonthsRevenue.length === 0) {
      return { forecast: 0, confidence: 'low' };
    }
    
    const avg = last3MonthsRevenue.reduce((a, b) => a + b, 0) / last3MonthsRevenue.length;
    
    // Calculate variance
    const variance = last3MonthsRevenue.reduce(
      (sum, val) => sum + Math.pow(val - avg, 2),
      0
    ) / last3MonthsRevenue.length;
    
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 0; // Coefficient of variation
    
    let confidence: 'low' | 'medium' | 'high';
    if (cv < 0.15) confidence = 'high';
    else if (cv < 0.30) confidence = 'medium';
    else confidence = 'low';
    
    const forecast = Math.round(avg * seasonalityFactor);
    
    return { forecast, confidence };
  }

  it('should forecast with high confidence for stable revenue', () => {
    const result = forecastNextMonth([10000000, 10500000, 9800000]);
    expect(result.confidence).toBe('high');
    expect(result.forecast).toBeGreaterThan(9000000);
  });

  it('should forecast with low confidence for volatile revenue', () => {
    const result = forecastNextMonth([5000000, 15000000, 8000000]);
    expect(result.confidence).toBe('low');
  });

  it('should apply seasonality factor', () => {
    const result = forecastNextMonth([10000000, 10000000, 10000000], 1.2);
    expect(result.forecast).toBe(12000000);
  });

  it('should handle empty data', () => {
    const result = forecastNextMonth([]);
    expect(result.forecast).toBe(0);
    expect(result.confidence).toBe('low');
  });
});

