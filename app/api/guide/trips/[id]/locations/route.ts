/**
 * API: Trip Important Locations
 * GET /api/guide/trips/[id]/locations - Get important locations for a trip (meeting point, snorkeling spots, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { LocationPoint } from '@/lib/utils/maps';

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  // Get trip with package info
  // Note: trips table doesn't have meeting_point fields, so we use package meeting_point
  let tripQuery = supabase.from('trips').select(`
      id,
      trip_code,
      package:packages(
        id,
        name,
        meeting_point,
        meeting_point_lat,
        meeting_point_lng
      )
    `).eq('id', tripId);
  
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }
  
  const { data: trip, error: tripError } = await tripQuery.single();

  if (tripError || !trip) {
    logger.error('Trip not found', tripError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const locations: LocationPoint[] = [];

  // Meeting Point (from package)
  const packageData = trip.package as {
    id?: string;
    name?: string;
    meeting_point?: string | null;
    meeting_point_lat?: number | null;
    meeting_point_lng?: number | null;
  } | null;
  const meetingPointLat = packageData?.meeting_point_lat;
  const meetingPointLng = packageData?.meeting_point_lng;
  const meetingPointName = packageData?.meeting_point || 'Dermaga Ketapang';

  if (meetingPointLat && meetingPointLng) {
    locations.push({
      id: `${tripId}-meeting-point`,
      name: meetingPointName,
      latitude: Number(meetingPointLat),
      longitude: Number(meetingPointLng),
      type: 'meeting_point',
      description: 'Meeting point untuk trip ini',
    });
  } else {
    // Default: Dermaga Ketapang coordinates
    locations.push({
      id: `${tripId}-meeting-point-default`,
      name: 'Dermaga Ketapang',
      latitude: -8.1319,
      longitude: 114.3656,
      type: 'meeting_point',
      description: 'Meeting point default',
    });
  }

  // TODO: In future, fetch snorkeling spots and backup docks from package_itineraries or package_locations table
  // For now, return just the meeting point
  // Additional locations (snorkeling spots, backup docks) can be added here when those tables exist

  return NextResponse.json({ locations });
});
