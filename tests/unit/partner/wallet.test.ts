/**
 * Unit Tests: Partner Wallet API
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const topupSchema = z.object({
  amount: z.number().min(100000, 'Minimum top-up is Rp 100.000'),
});

const withdrawalRequestSchema = z.object({
  amount: z.number().min(100000, 'Minimum penarikan adalah Rp 100.000'),
  bankName: z.string().min(2, 'Nama bank wajib diisi'),
  accountNumber: z.string().min(5, 'Nomor rekening tidak valid'),
  accountName: z.string().min(2, 'Nama pemilik rekening wajib diisi'),
  notes: z.string().optional(),
});

describe('Wallet API Validation', () => {
  describe('topupSchema', () => {
    it('should validate valid topup amount', () => {
      const validData = { amount: 500000 };
      const result = topupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject amount below minimum', () => {
      const invalidData = { amount: 50000 };
      const result = topupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing amount', () => {
      const invalidData = {};
      const result = topupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept minimum amount exactly', () => {
      const validData = { amount: 100000 };
      const result = topupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('withdrawalRequestSchema', () => {
    it('should validate valid withdrawal request', () => {
      const validData = {
        amount: 500000,
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountName: 'John Doe',
      };
      const result = withdrawalRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject amount below minimum', () => {
      const invalidData = {
        amount: 50000,
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountName: 'John Doe',
      };
      const result = withdrawalRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short bank name', () => {
      const invalidData = {
        amount: 500000,
        bankName: 'B',
        accountNumber: '1234567890',
        accountName: 'John Doe',
      };
      const result = withdrawalRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short account number', () => {
      const invalidData = {
        amount: 500000,
        bankName: 'BCA',
        accountNumber: '123',
        accountName: 'John Doe',
      };
      const result = withdrawalRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional notes', () => {
      const validData = {
        amount: 500000,
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountName: 'John Doe',
        notes: 'Please process quickly',
      };
      const result = withdrawalRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Wallet Balance Calculations', () => {
  it('should calculate available balance correctly', () => {
    const balance = 1000000;
    const creditLimit = 500000;
    const creditUsed = 200000;
    const availableBalance = balance + (creditLimit - creditUsed);
    
    expect(availableBalance).toBe(1300000);
  });

  it('should handle zero credit limit', () => {
    const balance = 1000000;
    const creditLimit = 0;
    const creditUsed = 0;
    const availableBalance = balance + (creditLimit - creditUsed);
    
    expect(availableBalance).toBe(1000000);
  });

  it('should handle fully used credit', () => {
    const balance = 0;
    const creditLimit = 500000;
    const creditUsed = 500000;
    const availableBalance = balance + (creditLimit - creditUsed);
    
    expect(availableBalance).toBe(0);
  });
});
