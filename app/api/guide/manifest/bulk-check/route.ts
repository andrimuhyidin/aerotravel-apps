/**
 * API: Bulk Manifest Check
 * POST /api/guide/manifest/bulk-check - Bulk mark passengers as boarded/returned
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const bulkCheckSchema = z.object({
  tripId: z.string().min(1),
  passengerIds: z.array(z.string().min(1)).min(1),
  checkType: z.enum(['boarding', 'return']),
  bulk: z.boolean().default(true),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = bulkCheckSchema.parse(await request.json());
  const { tripId, passengerIds, checkType } = body;

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide has access to this trip
  const { data: tripGuide } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .single();

  if (!tripGuide) {
    return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
  }

  // Get booking IDs for these passengers
  const { data: bookings } = await withBranchFilter(
    client.from('trip_bookings'),
    branchContext,
  )
    .select('id, booking_id')
    .eq('trip_id', tripId)
    .in('id', passengerIds);

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ error: 'No passengers found' }, { status: 404 });
  }

  const bookingIds = bookings.map((b: { id: string; booking_id: string }) => b.id);

  // Bulk update manifest checks
  const now = new Date().toISOString();
  const updates = bookingIds.map((bookingId: string) => ({
    trip_id: tripId,
    booking_id: bookingId,
    check_type: checkType,
    checked_at: now,
    checked_by: user.id,
  }));

  const { data: inserted, error } = await withBranchFilter(
    client.from('manifest_checks'),
    branchContext,
  ).insert(updates).select('id');

  if (error) {
    logger.error('Bulk manifest check failed', error, { tripId, passengerIds, checkType });
    return NextResponse.json(
      { error: 'Failed to update manifest checks' },
      { status: 500 },
    );
  }

  logger.info('Bulk manifest check completed', {
    tripId,
    checkType,
    count: inserted?.length || 0,
    guideId: user.id,
  });

  return NextResponse.json({
    success: true,
    count: inserted?.length || 0,
  });
});

