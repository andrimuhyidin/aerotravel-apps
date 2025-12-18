/**
 * API: Guide Preferences
 * GET /api/guide/preferences - Get current guide preferences
 * POST /api/guide/preferences - Update guide preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const preferencesSchema = z.object({
  favorite_destinations: z.array(z.string()).default([]),
  preferred_trip_types: z.array(z.enum(['open_trip', 'private_trip', 'corporate', 'kol_trip'])).default([]),
  preferred_durations: z.array(z.enum(['1D', '2D', '3D', '4D+'])).default([]),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const client = supabase as unknown as any;

  const { data, error } = await client
    .from('guide_preferences')
    .select('*')
    .eq('guide_id', user.id)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch guide preferences', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }

  // Return defaults if no preferences exist
  const preferences = data ?? {
    favorite_destinations: [],
    preferred_trip_types: [],
    preferred_durations: [],
  };

  return NextResponse.json(preferences);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = preferencesSchema.parse(await request.json());
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const { data, error } = await client
    .from('guide_preferences')
    .upsert(
      {
        guide_id: user.id,
        favorite_destinations: body.favorite_destinations,
        preferred_trip_types: body.preferred_trip_types,
        preferred_durations: body.preferred_durations,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'guide_id',
      }
    )
    .select()
    .single();

  if (error) {
    logger.error('Failed to update guide preferences', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }

  logger.info('Guide preferences updated', { guideId: user.id });
  return NextResponse.json(data);
});
