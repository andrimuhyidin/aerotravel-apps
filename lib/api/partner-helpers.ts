/**
 * Partner API Helper Functions
 * Reusable utilities untuk Partner Portal API routes
 */

import { createClient } from '@/lib/supabase/server';
import { sanitizeEmail, sanitizeInput, sanitizePhone, sanitizeUrl } from '@/lib/utils/sanitize';

/**
 * Get partner ID from user (supports direct partner and team members)
 */
export async function getPartnerId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  // Check if user is a partner
  const { data: userProfile } = await client
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (userProfile?.role === 'mitra') {
    return userId;
  }

  // Check if user is a team member
  const { data: partnerUser } = await client
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('is_active', true)
    .maybeSingle();

  return partnerUser?.partner_id || null;
}

/**
 * Verify user is a partner or partner team member
 */
export async function verifyPartnerAccess(userId: string): Promise<{
  isPartner: boolean;
  partnerId: string | null;
}> {
  const partnerId = await getPartnerId(userId);
  return {
    isPartner: partnerId !== null,
    partnerId,
  };
}

/**
 * Sanitize request body for API routes
 */
export function sanitizeRequestBody<T extends Record<string, unknown>>(
  body: T,
  sanitizeFields?: {
    strings?: (keyof T)[];
    emails?: (keyof T)[];
    phones?: (keyof T)[];
    urls?: (keyof T)[];
  }
): T {
  const sanitized = { ...body };

  // Sanitize string fields
  if (sanitizeFields?.strings) {
    for (const field of sanitizeFields.strings) {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = sanitizeInput(sanitized[field] as string) as T[keyof T];
      }
    }
  }

  // Sanitize email fields
  if (sanitizeFields?.emails) {
    for (const field of sanitizeFields.emails) {
      if (typeof sanitized[field] === 'string') {
        const sanitizedEmail = sanitizeEmail(sanitized[field] as string);
        sanitized[field] = (sanitizedEmail || sanitized[field]) as T[keyof T];
      }
    }
  }

  // Sanitize phone fields
  if (sanitizeFields?.phones) {
    for (const field of sanitizeFields.phones) {
      if (typeof sanitized[field] === 'string') {
        const sanitizedPhone = sanitizePhone(sanitized[field] as string);
        sanitized[field] = (sanitizedPhone || sanitized[field]) as T[keyof T];
      }
    }
  }

  // Sanitize URL fields
  if (sanitizeFields?.urls) {
    for (const field of sanitizeFields.urls) {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = sanitizeUrl(sanitized[field] as string) as T[keyof T];
      }
    }
  }

  return sanitized;
}

/**
 * Sanitize search params
 * Supports both URLSearchParams and NextRequest for convenience
 */
export function sanitizeSearchParams(
  params: URLSearchParams | { nextUrl: { searchParams: URLSearchParams } }
): { get(key: string): string | null } {
  // Handle NextRequest object
  const searchParams = 'nextUrl' in params ? params.nextUrl.searchParams : params;
  
  const sanitized: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    sanitized[key] = sanitizeInput(value);
  }
  
  // Return object with .get() method for compatibility with URLSearchParams API
  return {
    get(key: string): string | null {
      return sanitized[key] ?? null;
    },
  };
}

