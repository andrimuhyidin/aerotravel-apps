/**
 * GDPR Data Export Utilities
 * Right to Data Portability (GDPR Article 20 / UU PDP Pasal 35)
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type UserDataExport = {
  profile: Record<string, unknown>;
  bookings: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  preferences: Record<string, unknown>;
  activityLog: Record<string, unknown>[];
  exportedAt: string;
  format: 'json';
};

/**
 * Export all user data untuk GDPR compliance
 */
export async function exportUserData(userId: string): Promise<UserDataExport | null> {
  try {
    const supabase = await createClient();

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Get bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        packages (name, destination),
        booking_passengers (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .in('booking_id', (bookings || []).map(b => b.id));

    // Get activity logs (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: activityLog } = await supabase
      .from('audit_logs')
      .select('action, table_name, created_at, metadata')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    // Redact sensitive data
    const sanitizedPayments = (payments || []).map(p => ({
      ...p,
      // Remove sensitive payment details
      payment_details: '[REDACTED]',
      card_details: '[REDACTED]',
    }));

    const sanitizedBookings = (bookings || []).map(b => ({
      ...b,
      // Remove sensitive passenger data
      ktp_photo_url: b.ktp_photo_url ? '[REDACTED]' : null,
    }));

    return {
      profile: profile || {},
      bookings: sanitizedBookings,
      payments: sanitizedPayments,
      preferences: {
        // Add user preferences here if stored separately
      },
      activityLog: activityLog || [],
      exportedAt: new Date().toISOString(),
      format: 'json',
    };
  } catch (error) {
    logger.error('Failed to export user data', error, { userId });
    return null;
  }
}

/**
 * Rate limit check for data export (1 per day per user)
 */
const exportRateLimitMap = new Map<string, number>();

export function checkDataExportRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastExport = exportRateLimitMap.get(userId);

  if (!lastExport) {
    exportRateLimitMap.set(userId, now);
    return true;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  if (now - lastExport < oneDayMs) {
    return false;
  }

  exportRateLimitMap.set(userId, now);
  return true;
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  for (const [userId, lastExport] of exportRateLimitMap.entries()) {
    if (now - lastExport > oneDayMs) {
      exportRateLimitMap.delete(userId);
    }
  }
}, 60 * 60 * 1000);

