/**
 * API: Predictive Trip Insights
 * GET /api/guide/trips/[id]/ai-insights
 * 
 * Prediksi masalah, resource planning, route optimization
 * Rate Limited: 10 requests per minute per user
 */

import { NextRequest, NextResponse } from 'next/server';

import {
    getPredictiveTripInsights,
    getResourcePlanningSuggestions,
    type TripInsightContext,
} from '@/lib/ai/trip-insights';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { checkGuideRateLimit, createRateLimitHeaders, guideAiRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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

  // Rate limit check
  const rateLimit = await checkGuideRateLimit(guideAiRateLimit, user.id, 'AI insights');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
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
      .select('id, trip_code, trip_date, status, total_pax')
      .eq('id', tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Fetch manifest summary
    const { data: manifestData } = await client
      .from('trip_manifest')
      .select('passenger_type, allergy')
      .eq('trip_id', tripId);

    const manifest = {
      total: manifestData?.length || 0,
      children: manifestData?.filter((m: { passenger_type: string }) =>
        ['child', 'infant'].includes(m.passenger_type)
      ).length || 0,
      withAllergies: manifestData?.filter((m: { allergy: string | null }) => m.allergy).length || 0,
    };

    // Fetch weather
    let weather;
    try {
      const weatherRes = await fetch(
        `${_request.nextUrl.origin}/api/guide/weather?date=${trip.trip_date}`
      );
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        weather = {
          temp: weatherData.current?.temp || 0,
          description: weatherData.current?.description || 'Unknown',
          windSpeed: weatherData.current?.wind_speed,
          hasAlert: weatherData.alerts?.length > 0,
        };
      }
    } catch {
      // Weather fetch failed
    }

    // Fetch itinerary
    const { data: itineraryData } = await client
      .from('trip_itinerary')
      .select('time, activity, location')
      .eq('trip_id', tripId)
      .order('time', { ascending: true });

    const itinerary = (itineraryData || []).map((i: any) => ({
      time: i.time,
      activity: i.activity,
      location: i.location,
    }));

    // Build context
    const context: TripInsightContext = {
      tripId,
      tripDate: trip.trip_date || '',
      totalPax: trip.total_pax || 0,
      weather,
      itinerary,
      manifest,
    };

    // Get insights
    const insights = await getPredictiveTripInsights(context);
    const resourceSuggestions = await getResourcePlanningSuggestions(context);

    return NextResponse.json({
      insights,
      resourceSuggestions,
    });
  } catch (error) {
    logger.error('Failed to get trip insights', error, {
      tripId,
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal mendapatkan insights' },
      { status: 500 }
    );
  }
});
