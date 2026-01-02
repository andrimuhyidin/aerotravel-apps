/**
 * Unit Tests: Partner API Helpers (Sanitization Only)
 * Note: These tests only cover sanitization utilities, not server-side helpers
 */

import { describe, it, expect } from 'vitest';
import { sanitizeEmail, sanitizeInput, sanitizePhone, sanitizeUrl } from '@/lib/utils/sanitize';

describe('Sanitize Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeInput(input);
      expect(result).toBe('hello world');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert(1)';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick=');
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize valid email', () => {
      const email = '  TEST@EXAMPLE.COM  ';
      const result = sanitizeEmail(email);
      expect(result).toBe('test@example.com');
    });

    it('should return null for invalid email', () => {
      const email = 'not-an-email';
      const result = sanitizeEmail(email);
      expect(result).toBeNull();
    });

    it('should handle edge cases', () => {
      expect(sanitizeEmail('')).toBeNull();
      expect(sanitizeEmail('   ')).toBeNull();
      expect(sanitizeEmail('@example.com')).toBeNull();
      expect(sanitizeEmail('user@')).toBeNull();
    });
  });

  describe('sanitizePhone', () => {
    it('should normalize Indonesian phone with 0 prefix', () => {
      const phone = '081234567890';
      const result = sanitizePhone(phone);
      expect(result).toBe('6281234567890');
    });

    it('should keep phone with 62 prefix', () => {
      const phone = '6281234567890';
      const result = sanitizePhone(phone);
      expect(result).toBe('6281234567890');
    });

    it('should return null for invalid phone', () => {
      const phone = '123';
      const result = sanitizePhone(phone);
      expect(result).toBeNull();
    });

    it('should strip non-digit characters', () => {
      const phone = '+62-812-3456-7890';
      const result = sanitizePhone(phone);
      expect(result).toBe('6281234567890');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow http and https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should block javascript: URLs', () => {
      const result = sanitizeUrl('javascript:alert(1)');
      expect(result).toBe('#');
    });

    it('should return # for invalid URLs', () => {
      const result = sanitizeUrl('not-a-url');
      expect(result).toBe('#');
    });

    it('should handle data: URLs', () => {
      const result = sanitizeUrl('data:text/html,<script>alert(1)</script>');
      expect(result).toBe('#');
    });
  });
});

describe('Request Body Sanitization Pattern', () => {
  // Test the sanitization pattern without importing server-only modules
  function sanitizeRequestBody<T extends Record<string, unknown>>(
    body: T,
    sanitizeFields?: {
      strings?: (keyof T)[];
      emails?: (keyof T)[];
      phones?: (keyof T)[];
    }
  ): T {
    const sanitized = { ...body };

    if (sanitizeFields?.strings) {
      for (const field of sanitizeFields.strings) {
        if (typeof sanitized[field] === 'string') {
          sanitized[field] = sanitizeInput(sanitized[field] as string) as T[keyof T];
        }
      }
    }

    if (sanitizeFields?.emails) {
      for (const field of sanitizeFields.emails) {
        if (typeof sanitized[field] === 'string') {
          const sanitizedEmail = sanitizeEmail(sanitized[field] as string);
          sanitized[field] = (sanitizedEmail || sanitized[field]) as T[keyof T];
        }
      }
    }

    if (sanitizeFields?.phones) {
      for (const field of sanitizeFields.phones) {
        if (typeof sanitized[field] === 'string') {
          const sanitizedPhone = sanitizePhone(sanitized[field] as string);
          sanitized[field] = (sanitizedPhone || sanitized[field]) as T[keyof T];
        }
      }
    }

    return sanitized;
  }

  it('should sanitize string fields', () => {
    const body = {
      name: '<script>alert("xss")</script>John',
      email: 'test@example.com',
    };

    const sanitized = sanitizeRequestBody(body, { strings: ['name'] });
    expect(sanitized.name).not.toContain('<script>');
    expect(sanitized.name).toContain('John');
  });

  it('should sanitize email fields', () => {
    const body = { email: '  USER@EXAMPLE.COM  ' };
    const sanitized = sanitizeRequestBody(body, { emails: ['email'] });
    expect(sanitized.email).toBe('user@example.com');
  });

  it('should sanitize phone fields', () => {
    const body = { phone: '081234567890' };
    const sanitized = sanitizeRequestBody(body, { phones: ['phone'] });
    expect(sanitized.phone).toBe('6281234567890');
  });

  it('should not modify unspecified fields', () => {
    const body = {
      name: '<script>test</script>',
      safeField: 'untouched',
    };

    const sanitized = sanitizeRequestBody(body, { strings: ['name'] });
    expect(sanitized.safeField).toBe('untouched');
  });
});

describe('Search Params Sanitization Pattern', () => {
  function sanitizeSearchParams(params: URLSearchParams): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  it('should sanitize all params', () => {
    const params = new URLSearchParams();
    params.set('search', '<script>alert(1)</script>test');
    params.set('limit', '50');

    const sanitized = sanitizeSearchParams(params);
    expect(sanitized.search).not.toContain('<script>');
    expect(sanitized.search).toContain('test');
    expect(sanitized.limit).toBe('50');
  });

  it('should handle empty params', () => {
    const params = new URLSearchParams();
    const sanitized = sanitizeSearchParams(params);
    expect(Object.keys(sanitized)).toHaveLength(0);
  });
});
