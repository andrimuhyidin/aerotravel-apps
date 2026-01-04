/**
 * API: Get Trip by Code
 * GET /api/guide/trips/by-code/[code]
 * Returns trip ID for a given trip code
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) => {
  const resolvedParams = await params;
  const { code } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get trip by code
  let tripQuery = client.from('trips')
    .select('id, trip_code')
    .eq('trip_code', code)
    .maybeSingle();

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip, error: tripError } = await tripQuery;

  if (tripError) {
    logger.error('Failed to find trip by code', { code, error: tripError.message });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Verify guide assignment (check both trip_crews and trip_guides)
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', trip.id)
    .eq('guide_id', user.id)
    .in('status', ['assigned', 'confirmed'])
    .maybeSingle();

  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', trip.id)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!crewAssignment && !legacyAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ tripId: trip.id, tripCode: trip.trip_code });
});

