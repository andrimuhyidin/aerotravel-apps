/**
 * API: Booking Draft Cleanup Cron Job
 * GET /api/cron/booking-draft-cleanup
 * 
 * This endpoint should be called by Vercel Cron or external cron service
 * Schedule: Daily at 02:00 WIB (19:00 UTC previous day)
 * 
 * Deletes draft bookings older than 7 days
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured, allowing request');
    return true; // Allow if not configured (for development)
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    logger.info('[Cron] Starting draft booking cleanup');

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    // Find draft bookings older than 7 days
    const { data: oldDrafts, error: fetchError } = await client
      .from('bookings')
      .select('id, booking_code, draft_saved_at')
      .eq('status', 'draft')
      .not('draft_saved_at', 'is', null)
      .lt('draft_saved_at', cutoffDate);

    if (fetchError) {
      logger.error('[Cron] Failed to fetch old drafts', fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
      return NextResponse.json(
        { error: 'Failed to fetch old drafts', details: fetchError.message },
        { status: 500 }
      );
    }

    const draftsToDelete = oldDrafts || [];
    logger.info('[Cron] Found old drafts to delete', { count: draftsToDelete.length });

    if (draftsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old drafts to clean up',
        deleted: 0,
      });
    }

    // Delete old drafts (cascade will handle booking_passengers)
    const draftIds = draftsToDelete.map((d: { id: string }) => d.id);
    const { error: deleteError } = await client
      .from('bookings')
      .delete()
      .in('id', draftIds);

    if (deleteError) {
      logger.error('[Cron] Failed to delete old drafts', deleteError instanceof Error ? deleteError : new Error(String(deleteError)));
      return NextResponse.json(
        { error: 'Failed to delete old drafts', details: deleteError.message },
        { status: 500 }
      );
    }

    logger.info('[Cron] Draft cleanup completed', {
      deleted: draftsToDelete.length,
      bookingCodes: draftsToDelete.map((d: { booking_code: string }) => d.booking_code),
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${draftsToDelete.length} old draft bookings`,
      deleted: draftsToDelete.length,
      bookingCodes: draftsToDelete.map((d: { booking_code: string }) => d.booking_code),
    });
  } catch (error) {
    logger.error('[Cron] Fatal error in draft cleanup', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        error: 'Fatal error in draft cleanup',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

