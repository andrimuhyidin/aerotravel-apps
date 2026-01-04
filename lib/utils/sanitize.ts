/**
 * Input Sanitization Utilities
 * Sesuai Enterprise Best Practices - Security
 * 
 * Prevents XSS attacks and validates user input
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML string to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html);
  }
  // Server-side: use a simpler approach
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Sanitize user input (remove dangerous characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Sanitize URL to prevent XSS
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http, https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '#';
    }
    return parsed.toString();
  } catch {
    return '#';
  }
}

/**
 * Sanitize SQL input (basic protection)
 * Note: Always use parameterized queries with Supabase
 */
export function sanitizeSql(input: string): string {
  // Remove SQL injection patterns
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validate and sanitize phone number (Indonesian format)
 */
export function sanitizePhone(phone: string): string | null {
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Indonesian phone: 08xx or +628xx
  if (digits.startsWith('62')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return '62' + digits.substring(1);
  }
  
  return null;
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255); // Max length
}

