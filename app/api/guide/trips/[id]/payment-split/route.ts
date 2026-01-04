/**
 * API: Payment Split
 * GET /api/guide/trips/[id]/payment-split - Get payment split for trip
 * POST /api/guide/trips/[id]/payment-split - Calculate & update payment split
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const calculateSplitSchema = z.object({
  total_fee: z.number().min(0),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get payment split for this trip
  const { data: crews, error } = await client
    .from('trip_crews')
    .select('id, guide_id, role, fee_amount, split_percentage, payment_status')
    .eq('trip_id', tripId)
    .in('status', ['assigned', 'confirmed']);

  if (error) {
    logger.error('Failed to fetch payment split', error, { tripId });
    return NextResponse.json({ error: 'Failed to fetch payment split' }, { status: 500 });
  }

  return NextResponse.json({
    split: crews || [],
    total: (crews || []).reduce((sum: number, c: { fee_amount?: number | null }) => sum + (c.fee_amount || 0), 0),
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const payload = calculateSplitSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin or lead guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('role')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .eq('role', 'lead')
    .maybeSingle();

  const isAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'ops_admin';
  const isLeadGuide = crewAssignment?.role === 'lead';

  if (!isAdmin && !isLeadGuide) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Calculate split using function
  const { data: splitData, error: calcError } = await client.rpc('calculate_payment_split', {
    trip_uuid: tripId,
    total_fee: payload.total_fee,
  });

  if (calcError) {
    logger.error('Failed to calculate payment split', calcError, { tripId });
    return NextResponse.json({ error: 'Failed to calculate split' }, { status: 500 });
  }

  // Update trip_crews with calculated split
  if (splitData && splitData.length > 0) {
    for (const split of splitData) {
      await client
        .from('trip_crews')
        .update({
          fee_amount: split.fee_amount,
          split_percentage: split.split_percentage,
          updated_at: new Date().toISOString(),
        })
        .eq('trip_id', tripId)
        .eq('guide_id', split.guide_id);
    }
  }

  logger.info('Payment split calculated', {
    tripId,
    totalFee: payload.total_fee,
    splitCount: splitData?.length || 0,
  });

  return NextResponse.json({
    success: true,
    split: splitData || [],
    total: payload.total_fee,
  });
});
