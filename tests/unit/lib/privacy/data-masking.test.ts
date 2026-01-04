/**
 * Unit Tests: Data Masking Utilities
 * Purpose: Test data masking functions for PDP compliance
 */

import { describe, expect, it } from 'vitest';

import {
  maskEmail,
  maskNIK,
  maskObject,
  maskPhoneNumber,
} from '@/lib/privacy/data-masking';

describe('Data Masking Utilities', () => {
  describe('maskPhoneNumber', () => {
    it('should mask middle digits of phone number', () => {
      expect(maskPhoneNumber('081234567890')).toBe('0812****7890');
      expect(maskPhoneNumber('628123456789')).toBe('6281****6789');
    });

    it('should handle short phone numbers', () => {
      expect(maskPhoneNumber('081234')).toBe('08****');
    });

    it('should handle invalid input', () => {
      expect(maskPhoneNumber('')).toBe('');
      expect(maskPhoneNumber('abc')).toBe('***');
    });
  });

  describe('maskEmail', () => {
    it('should mask email address', () => {
      expect(maskEmail('user@example.com')).toBe('us**@example.com');
      expect(maskEmail('john.doe@company.co.id')).toBe('jo******@company.co.id');
    });

    it('should handle short email', () => {
      expect(maskEmail('a@b.c')).toBe('a**@b.c');
    });

    it('should handle invalid email', () => {
      expect(maskEmail('notanemail')).toBe('not*****');
      expect(maskEmail('')).toBe('');
    });
  });

  describe('maskNIK', () => {
    it('should mask middle digits of NIK', () => {
      expect(maskNIK('1234567890123456')).toBe('1234********3456');
    });

    it('should handle short NIK', () => {
      expect(maskNIK('123456')).toBe('12**56');
    });

    it('should handle invalid input', () => {
      expect(maskNIK('')).toBe('');
    });
  });

  describe('maskObject', () => {
    it('should mask specified fields in object', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '081234567890',
        nik: '1234567890123456',
        address: 'Jl. Example No. 123',
      };

      const masked = maskObject(data, ['email', 'phone', 'nik']);

      expect(masked.name).toBe('John Doe');
      expect(masked.address).toBe('Jl. Example No. 123');
      expect(masked.email).toBe('jo**@example.com');
      expect(masked.phone).toBe('0812****7890');
      expect(masked.nik).toBe('1234********3456');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          email: 'user@test.com',
          phone: '081234567890',
        },
        booking: {
          code: 'BK001',
        },
      };

      // Note: Current implementation doesn't support nested - this test documents that
      const masked = maskObject(data, ['email', 'phone']);
      expect(masked.user).toEqual({ email: 'user@test.com', phone: '081234567890' });
      expect(masked.booking).toEqual({ code: 'BK001' });
    });

    it('should return original object if no fields to mask', () => {
      const data = { name: 'John', age: 30 };
      const masked = maskObject(data, []);
      expect(masked).toEqual(data);
    });
  });
});

