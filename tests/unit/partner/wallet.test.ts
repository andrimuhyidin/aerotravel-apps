/**
 * Unit Tests: Partner Wallet
 */

import { formatCurrency } from '@/lib/partner/wallet';
import { describe, expect, it } from 'vitest';

describe('Partner Wallet', () => {
  describe('formatCurrency', () => {
    it('should format IDR currency correctly', () => {
      expect(formatCurrency(0)).toContain('0');
      expect(formatCurrency(1000)).toContain('1.000');
      expect(formatCurrency(1000000)).toContain('1.000.000');
      expect(formatCurrency(10500000)).toContain('10.500.000');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-50000);
      expect(result).toContain('50.000');
      expect(result).toContain('-');
    });
  });
});
