/**
 * Unit Tests: Partner Invoices
 */

import { describe, it, expect } from 'vitest';

describe('Invoice Status Logic', () => {
  function getInvoiceStatus(
    bookingStatus: string,
    paymentStatus: string | null,
    tripDate: string
  ): 'paid' | 'pending' | 'overdue' | 'cancelled' {
    if (bookingStatus === 'cancelled') return 'cancelled';
    if (bookingStatus === 'paid' || paymentStatus === 'paid') return 'paid';
    
    const today = new Date();
    const trip = new Date(tripDate);
    
    if (bookingStatus === 'pending_payment' && trip < today) {
      return 'overdue';
    }
    
    return 'pending';
  }

  it('should identify paid invoices', () => {
    expect(getInvoiceStatus('paid', 'paid', '2026-12-01')).toBe('paid');
    expect(getInvoiceStatus('confirmed', 'paid', '2026-12-01')).toBe('paid');
  });

  it('should identify pending invoices', () => {
    expect(getInvoiceStatus('pending_payment', null, '2027-01-15')).toBe('pending');
    expect(getInvoiceStatus('confirmed', 'pending', '2027-01-15')).toBe('pending');
  });

  it('should identify overdue invoices', () => {
    expect(getInvoiceStatus('pending_payment', null, '2025-12-01')).toBe('overdue');
  });

  it('should identify cancelled invoices', () => {
    expect(getInvoiceStatus('cancelled', null, '2026-12-01')).toBe('cancelled');
    expect(getInvoiceStatus('cancelled', 'paid', '2026-12-01')).toBe('cancelled');
  });
});

describe('Invoice Calculations', () => {
  function calculateInvoiceTotals(items: { quantity: number; unitPrice: number }[]): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxRate = 0.11; // 11% PPN
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  }

  it('should calculate invoice totals correctly', () => {
    const items = [
      { quantity: 2, unitPrice: 5000000 },
      { quantity: 1, unitPrice: 2000000 },
    ];
    const result = calculateInvoiceTotals(items);
    
    expect(result.subtotal).toBe(12000000);
    expect(result.tax).toBe(1320000);
    expect(result.total).toBe(13320000);
  });

  it('should handle empty items', () => {
    const result = calculateInvoiceTotals([]);
    
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should handle single item', () => {
    const items = [{ quantity: 1, unitPrice: 10000000 }];
    const result = calculateInvoiceTotals(items);
    
    expect(result.subtotal).toBe(10000000);
    expect(result.tax).toBe(1100000);
    expect(result.total).toBe(11100000);
  });
});

describe('Payment Due Date', () => {
  function calculateDueDate(invoiceDate: Date, paymentTermDays: number): Date {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTermDays);
    return dueDate;
  }

  function getDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  it('should calculate due date correctly', () => {
    const invoiceDate = new Date('2026-01-01');
    const dueDate = calculateDueDate(invoiceDate, 30);
    
    expect(dueDate.toISOString().split('T')[0]).toBe('2026-01-31');
  });

  it('should handle NET 7 terms', () => {
    const invoiceDate = new Date('2026-01-15');
    const dueDate = calculateDueDate(invoiceDate, 7);
    
    expect(dueDate.toISOString().split('T')[0]).toBe('2026-01-22');
  });

  it('should calculate days until due', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    const days = getDaysUntilDue(futureDate);
    expect(days).toBe(10);
  });

  it('should return negative for overdue', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    
    const days = getDaysUntilDue(pastDate);
    expect(days).toBeLessThan(0);
  });
});

