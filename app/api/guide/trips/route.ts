/**
 * API: Guide Trips List
 * GET /api/guide/trips
 *
 * Returns list of trips assigned to the current guide.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get trip_guides first, then filter trips by branch_id
  let tripGuidesQuery = client.from('trip_guides')
    .select('trip_id')
    .eq('guide_id', user.id);
  
  const { data: tripGuidesData, error: tripGuidesError } = await tripGuidesQuery;
  
  if (tripGuidesError) {
    logger.error('Failed to load trip_guides', tripGuidesError, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to load trips' }, { status: 500 });
  }
  
  const tripIds = (tripGuidesData ?? []).map((tg: { trip_id: string }) => tg.trip_id);
  
  if (tripIds.length === 0) {
    return NextResponse.json({ trips: [] });
  }
  
  // Get trips with branch filter
  let tripsQuery = client.from('trips')
    .select(
      `
      id,
      trip_code,
      trip_date,
      status,
      total_pax,
      package:packages(name)
    `,
    )
    .in('id', tripIds);
  
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripsQuery = tripsQuery.eq('branch_id', branchContext.branchId);
  }
  
  const { data: tripsData, error } = await tripsQuery.order('trip_date', { ascending: true });

  if (error) {
    logger.error('Failed to load guide trips', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to load trips' }, { status: 500 });
  }

  const nowDate = new Date().toISOString().slice(0, 10);

  const trips = (tripsData ?? [])
    .map((trip: {
      id: string;
      trip_code: string | null;
      trip_date: string | null;
      status: string | null;
      total_pax: number | null;
      package?: { name: string | null } | null;
    }) => {
      const date = trip.trip_date ?? nowDate;
      const statusRaw = trip.status ?? 'scheduled';

      let uiStatus: 'ongoing' | 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
      if (statusRaw === 'on_trip' || statusRaw === 'on_the_way' || statusRaw === 'preparing') {
        uiStatus = 'ongoing';
      } else if (statusRaw === 'completed') {
        uiStatus = 'completed';
      } else if (statusRaw === 'cancelled') {
        uiStatus = 'cancelled';
      } else {
        // scheduled: compare date
        uiStatus = date >= nowDate ? 'upcoming' : 'completed';
      }

      return {
        id: trip.id,
        code: trip.trip_code ?? '',
        name: trip.package?.name ?? trip.trip_code ?? 'Trip',
        date,
        guests: trip.total_pax ?? 0,
        status: uiStatus,
      };
    });

  return NextResponse.json({ trips });
});
