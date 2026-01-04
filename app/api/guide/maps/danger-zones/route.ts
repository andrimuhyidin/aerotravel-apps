/**
 * API: Danger Zones
 * GET /api/guide/maps/danger-zones?lat=...&lng=...&radius=... - Get nearby danger zones
 */

import { NextRequest } from 'next/server';

import { createErrorResponse, createSuccessResponse } from '@/lib/api/response-format';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse('Unauthorized', undefined, undefined, 401);
  }

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseInt(searchParams.get('radius') || '1000', 10);

  if (!lat || !lng || lat === 0 || lng === 0) {
    return createErrorResponse('Latitude and longitude required', 'VALIDATION_ERROR', undefined, 400);
  }

  const client = supabase as unknown as any;

  // Get nearby danger zones using function
  const { data: zones, error } = await client.rpc('find_nearby_danger_zones', {
    lat,
    lng,
    radius_meters: radius,
  });

  if (error) {
    logger.error('Failed to fetch danger zones', error, { lat, lng, radius });
    // Fallback: manual query
    const { data: allZones } = await client
      .from('danger_zones')
      .select('*')
      .eq('is_active', true);

    return createSuccessResponse({
      zones: allZones || [],
      center: { lat, lng },
      radius,
    });
  }

  return createSuccessResponse({
    zones: zones || [],
    center: { lat, lng },
    radius,
  });
});
