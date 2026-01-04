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

  // Fetch snorkeling spots and backup docks from package_itineraries
  const packageId = packageData?.id;
  if (packageId) {
    // Use any client for flexible schema access
    const flexClient = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            not: (
              col: string,
              op: string,
              val: null
            ) => {
              not: (
                col: string,
                op: string,
                val: null
              ) => Promise<{ data: unknown[] | null }>;
            };
          };
        };
      };
    };

    try {
      // Try to get locations from package_itineraries
      const { data: itineraries } = await flexClient
        .from('package_itineraries')
        .select('id, activity_name, latitude, longitude, activity_type, description')
        .eq('package_id', packageId)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      type ItineraryItem = {
        id: string;
        activity_name?: string;
        name?: string;
        latitude: number | null;
        longitude: number | null;
        activity_type: string | null;
        description: string | null;
      };

      if (itineraries && Array.isArray(itineraries) && itineraries.length > 0) {
        (itineraries as ItineraryItem[]).forEach((itinerary) => {
          // Map activity_type to LocationPoint type
          let locationType: LocationPoint['type'] = 'activity';
          const actType = itinerary.activity_type?.toLowerCase() || '';

          if (actType.includes('snorkel') || actType.includes('diving')) {
            locationType = 'snorkeling_spot';
          } else if (actType.includes('dock') || actType.includes('dermaga')) {
            locationType = 'backup_dock';
          } else if (actType.includes('island') || actType.includes('pulau')) {
            locationType = 'island';
          } else if (actType.includes('restaurant') || actType.includes('food')) {
            locationType = 'restaurant';
          }

          const activityName = itinerary.activity_name || itinerary.name || 'Lokasi';
          if (itinerary.latitude && itinerary.longitude) {
            locations.push({
              id: `itinerary-${itinerary.id}`,
              name: activityName,
              latitude: Number(itinerary.latitude),
              longitude: Number(itinerary.longitude),
              type: locationType,
              description: itinerary.description || undefined,
            });
          }
        });
      }
    } catch {
      // package_itineraries table might not have location columns, try package_locations
      try {
        const { data: packageLocations } = await flexClient
          .from('package_locations')
          .select('id, name, latitude, longitude, location_type, description')
          .eq('package_id', packageId)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        type LocationItem = {
          id: string;
          name: string;
          latitude: number | null;
          longitude: number | null;
          location_type: string | null;
          description: string | null;
        };

        if (packageLocations && Array.isArray(packageLocations) && packageLocations.length > 0) {
          (packageLocations as LocationItem[]).forEach((loc) => {
            // Map location_type to LocationPoint type
            let locationType: LocationPoint['type'] = 'activity';
            const locType = loc.location_type?.toLowerCase() || '';

            if (locType.includes('snorkel') || locType === 'snorkeling_spot') {
              locationType = 'snorkeling_spot';
            } else if (locType.includes('dock') || locType === 'backup_dock') {
              locationType = 'backup_dock';
            } else if (locType.includes('island')) {
              locationType = 'island';
            } else if (locType.includes('restaurant')) {
              locationType = 'restaurant';
            }

            if (loc.latitude && loc.longitude) {
              locations.push({
                id: `location-${loc.id}`,
                name: loc.name,
                latitude: Number(loc.latitude),
                longitude: Number(loc.longitude),
                type: locationType,
                description: loc.description || undefined,
              });
            }
          });
        }
      } catch {
        // Tables don't exist, continue with just meeting point
        logger.debug('Package location tables not available', { packageId });
      }
    }
  }

  return NextResponse.json({ locations });
});
