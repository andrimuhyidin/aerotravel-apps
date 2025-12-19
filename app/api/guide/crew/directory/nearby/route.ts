/**
 * API: Nearby Crew
 * GET /api/guide/crew/directory/nearby?lat=...&lng=...&radius=... - Get nearby crew
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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

  if (!lat || !lng || lat === 0 || lng === 0) {
    return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Get all active crew profiles
  const { data: allCrew, error: crewError } = await client
    .from('crew_profiles_public_internal')
    .select('user_id, display_name, current_availability')
    .eq('is_active', true);

  if (crewError) {
    logger.error('Failed to fetch crew', crewError);
    return NextResponse.json({ error: 'Failed to fetch crew' }, { status: 500 });
  }

  // Get user locations (from guide_status or trips)
  // For now, we'll return a simplified list - in production, you'd query actual GPS locations
  const nearby: Array<{
    user_id: string;
    display_name: string;
    distance: number;
    location: { latitude: number; longitude: number };
  }> = [];

  // Mock nearby crew (in production, query actual GPS locations from guide_status or trips)
  // This is a placeholder - you'd need to implement actual location tracking
  if (allCrew && allCrew.length > 0) {
    allCrew.slice(0, 5).forEach((crew: { user_id: string; display_name: string }, idx: number) => {
      // Mock distance calculation (in production, use actual GPS data)
      const mockDistance = Math.random() * radius;
      const mockLat = lat + (Math.random() - 0.5) * 0.01; // ~1km variation
      const mockLng = lng + (Math.random() - 0.5) * 0.01;

      nearby.push({
        user_id: crew.user_id,
        display_name: crew.display_name,
        distance: Math.round(mockDistance),
        location: {
          latitude: mockLat,
          longitude: mockLng,
        },
      });
    });
  }

  // Sort by distance
  nearby.sort((a, b) => a.distance - b.distance);

  return NextResponse.json({
    nearby,
    center: { lat, lng },
    radius,
  });
});
