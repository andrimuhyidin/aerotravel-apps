/**
 * API: Nearby Crew
 * GET /api/guide/crew/directory/nearby?lat=...&lng=...&radius=... - Get nearby crew
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Validate inputs
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    logger.warn('Invalid coordinates for distance calculation', {
      lat1,
      lon1,
      lat2,
      lon2,
    });
    return Infinity;
  }

  // Earth radius in meters
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseInt(searchParams.get('radius') || '10000', 10); // Default 10km

  if (!lat || !lng || lat === 0 || lng === 0 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Valid latitude and longitude required' }, { status: 400 });
  }

  try {
    // Query guide_locations for online crew within last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: locations, error: locError } = await supabase
      .from('guide_locations')
      .select(
        `
        guide_id,
        latitude,
        longitude,
        last_seen_at,
        is_online,
        guide:users!guide_locations_guide_id_fkey(
          id,
          full_name
        )
      `,
      )
      .eq('is_online', true)
      .gte('last_seen_at', oneHourAgo)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (locError) {
      logger.error('Failed to fetch guide_locations', locError, { lat, lng, radius });
      return NextResponse.json({ error: 'Failed to fetch nearby crew' }, { status: 500 });
    }

    // Get crew profiles for display names
    const guideIds = (locations || [])
      .map((loc) => loc.guide_id)
      .filter((id): id is string => !!id);

    const client = supabase as unknown as any;
    const { data: profiles, error: profileError } = await client
      .from('crew_profiles_public_internal')
      .select('user_id, display_name')
      .in('user_id', guideIds)
      .eq('is_active', true);

    if (profileError) {
      logger.warn('Failed to fetch crew profiles', { 
        error: profileError instanceof Error ? profileError.message : String(profileError),
        guideIds 
      });
    }

    // Create a map of guide_id -> display_name
    const profileMap = new Map<string, string>();
    (profiles || []).forEach((profile: { user_id?: string; display_name?: string }) => {
      if (profile.user_id && profile.display_name) {
        profileMap.set(profile.user_id, profile.display_name);
      }
    });

    // Calculate distances and filter by radius
    const nearby: Array<{
      user_id: string;
      display_name: string;
      distance: number;
      location: { latitude: number; longitude: number };
    }> = [];

    (locations || []).forEach((loc) => {
      if (
        !loc.guide_id ||
        !loc.latitude ||
        !loc.longitude ||
        loc.guide_id === user.id // Exclude current user
      ) {
        return;
      }

      const distance = calculateDistance(
        lat,
        lng,
        Number(loc.latitude),
        Number(loc.longitude),
      );

      // Filter by radius
      if (distance <= radius) {
        const displayName =
          profileMap.get(loc.guide_id) ||
          (loc.guide as { full_name?: string | null })?.full_name ||
          'Unknown';

        nearby.push({
          user_id: loc.guide_id,
          display_name: displayName,
          distance: Math.round(distance),
          location: {
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
          },
        });
      }
    });

    // Sort by distance ascending
    nearby.sort((a, b) => a.distance - b.distance);

    logger.info('Nearby crew fetched', {
      count: nearby.length,
      radius,
      center: { lat, lng },
    });

    return NextResponse.json({
      nearby,
      center: { lat, lng },
      radius,
    });
  } catch (error) {
    logger.error('Unexpected error in nearby crew API', error as Error, { lat, lng, radius });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
