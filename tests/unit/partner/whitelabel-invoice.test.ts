/**
 * Unit Tests: Whitelabel Invoice
 */

import { describe, it, expect } from 'vitest';
import {
  generateInvoiceNumber,
  calculateInvoiceTotals,
} from '@/lib/partner/whitelabel-invoice';

describe('Whitelabel Invoice', () => {
  describe('generateInvoiceNumber', () => {
    it('should generate invoice number with correct format', () => {
      const invoiceNumber = generateInvoiceNumber('MITRA001');
      expect(invoiceNumber).toMatch(/^INV-MITRA001-\d{8}-[A-Z0-9]{4}$/);
    });

    it('should generate unique invoice numbers', () => {
      const inv1 = generateInvoiceNumber('TEST');
      const inv2 = generateInvoiceNumber('TEST');
      // Very unlikely to be same due to random suffix
      expect(inv1).not.toBe(inv2);
    });
  });

  describe('calculateInvoiceTotals', () => {
    it('should calculate subtotal correctly', () => {
      const items = [
        { description: 'Item 1', quantity: 2, unitPrice: 100000, total: 200000 },
        { description: 'Item 2', quantity: 1, unitPrice: 150000, total: 150000 },
      ];

      const totals = calculateInvoiceTotals(items);
      expect(totals.subtotal).toBe(350000);
      expect(totals.total).toBe(350000);
    });

    it('should calculate discount correctly', () => {
      const items = [
        { description: 'Item 1', quantity: 1, unitPrice: 100000, total: 100000 },
      ];

      const totals = calculateInvoiceTotals(items, 10); // 10% discount
      expect(totals.subtotal).toBe(100000);
      expect(totals.discount).toBe(10000);
      expect(totals.total).toBe(90000);
    });

    it('should calculate tax correctly', () => {
      const items = [
        { description: 'Item 1', quantity: 1, unitPrice: 100000, total: 100000 },
      ];

      const totals = calculateInvoiceTotals(items, 0, 11); // 11% tax
      expect(totals.subtotal).toBe(100000);
      expect(totals.tax).toBe(11000);
      expect(totals.total).toBe(111000);
    });

    it('should calculate discount and tax together', () => {
      const items = [
        { description: 'Item 1', quantity: 1, unitPrice: 1000000, total: 1000000 },
      ];

      // 10% discount, 11% tax
      const totals = calculateInvoiceTotals(items, 10, 11);
      expect(totals.subtotal).toBe(1000000);
      expect(totals.discount).toBe(100000);
      // Tax on (1000000 - 100000) = 900000 * 11% = 99000
      expect(totals.tax).toBe(99000);
      expect(totals.total).toBe(999000);
    });
  });
});
