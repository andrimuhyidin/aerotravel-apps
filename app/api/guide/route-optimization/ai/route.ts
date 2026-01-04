/**
 * API: AI Route & Itinerary Optimizer
 * POST /api/guide/route-optimization/ai
 * 
 * Dynamic suggestions, time optimization, alternative routes
 * Rate Limited: 10 requests per minute per user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { optimizeItinerary, type ItineraryItem } from '@/lib/ai/route-optimizer';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { checkGuideRateLimit, createRateLimitHeaders, guideAiRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const optimizeSchema = z.object({
  tripId: z.string().min(1),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> },
) => {
  const resolvedParams = await params;
  const tripId = resolvedParams.id || (await request.json()).tripId;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const rateLimit = await checkGuideRateLimit(guideAiRateLimit, user.id, 'optimisasi rute');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
  }

  if (!tripId) {
    return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: assignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch trip data
    const { data: trip } = await client
      .from('trips')
      .select('id, trip_date, total_pax')
      .eq('id', tripId)
      .single();

    // Fetch itinerary
    const { data: itineraryData } = await client
      .from('trip_itinerary')
      .select('time, activity, location, estimated_duration')
      .eq('trip_id', tripId)
      .order('time', { ascending: true });

    const itinerary: ItineraryItem[] = (itineraryData || []).map((i: any) => ({
      time: i.time,
      activity: i.activity,
      location: i.location,
      estimatedDuration: i.estimated_duration,
    }));

    // Fetch weather
    let weather;
    try {
      const weatherRes = await fetch(
        `${request.nextUrl.origin}/api/guide/weather?date=${trip.trip_date}`
      );
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        weather = {
          condition: weatherData.current?.description || 'Unknown',
          hasAlert: weatherData.alerts?.length > 0,
        };
      }
    } catch {
      // Weather fetch failed
    }

    // Optimize
    const optimization = await optimizeItinerary(itinerary, {
      weather,
      totalPax: trip.total_pax,
      currentTime: new Date().toISOString(),
    });

    return NextResponse.json({ optimization });
  } catch (error) {
    logger.error('Failed to optimize route', error, {
      tripId,
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal mengoptimalkan rute' },
      { status: 500 }
    );
  }
});
