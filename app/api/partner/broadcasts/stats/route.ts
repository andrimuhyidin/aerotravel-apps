/**
 * API: Partner Broadcast Stats
 * GET /api/partner/broadcasts/stats - Get broadcast statistics
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    // Get broadcast counts
    const { data: broadcasts, error: broadcastsError } = await client
      .from('partner_broadcasts')
      .select('sent_count, failed_count, status')
      .eq('partner_id', partnerId);

    if (broadcastsError) {
      logger.error('Failed to fetch broadcast stats', broadcastsError, { userId: user.id });
      throw broadcastsError;
    }

    const stats = (broadcasts || []).reduce(
      (acc: { total: number; sent: number; failed: number; delivered: number }, b: any) => {
        acc.total++;
        acc.sent += b.sent_count || 0;
        acc.failed += b.failed_count || 0;
        // Assume delivered = sent - failed (simplified)
        acc.delivered += (b.sent_count || 0) - (b.failed_count || 0);
        return acc;
      },
      { total: 0, sent: 0, failed: 0, delivered: 0 }
    );

    const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;

    return NextResponse.json({
      totalBroadcasts: stats.total,
      totalSent: stats.sent,
      totalDelivered: stats.delivered,
      totalFailed: stats.failed,
      deliveryRate,
    });
  } catch (error) {
    logger.error('Failed to fetch broadcast stats', error, { userId: user.id });
    throw error;
  }
});

