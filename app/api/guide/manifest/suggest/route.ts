/**
 * API: AI Manifest Suggestions
 * POST /api/guide/manifest/suggest
 * 
 * Auto-suggest notes, safety alerts, grouping suggestions
 * Rate Limited: 10 requests per minute per user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    getManifestSafetyAlerts,
    getPassengerGroupingSuggestions,
    suggestManifestNotes,
    type Passenger,
} from '@/lib/ai/manifest-assistant';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { checkGuideRateLimit, createRateLimitHeaders, guideAiRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const suggestSchema = z.object({
  tripId: z.string().min(1),
  type: z.enum(['notes', 'grouping', 'alerts']),
  passengerId: z.string().optional(), // For notes suggestion
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const rateLimit = await checkGuideRateLimit(guideAiRateLimit, user.id, 'saran manifest');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
  }

  const payload = suggestSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: assignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', payload.tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch trip context for better AI suggestions
    const { data: trip, error: tripError } = await client
      .from('trips')
      .select(`
        id,
        trip_code,
        trip_date,
        package:packages(name, destination, trip_type, duration_days)
      `)
      .eq('id', payload.tripId)
      .maybeSingle();

    if (tripError) {
      logger.warn('Failed to fetch trip context for AI suggestions', { error: tripError, tripId: payload.tripId });
    }

    // Fetch itinerary for context
    const { data: itineraryData } = await client
      .from('trip_itinerary')
      .select('activity, location')
      .eq('trip_id', payload.tripId)
      .order('time', { ascending: true })
      .limit(5);

    // Fetch weather if available
    let weather;
    if (trip?.trip_date) {
      try {
        const weatherRes = await fetch(
          `${request.nextUrl.origin}/api/guide/weather?date=${trip.trip_date}`
        );
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          weather = {
            temp: weatherData.current?.temp || 0,
            description: weatherData.current?.description || 'Unknown',
            hasAlert: weatherData.alerts?.length > 0,
          };
        }
      } catch {
        // Weather fetch failed, ignore
      }
    }

    // Fetch manifest
    const { data: manifestData, error: manifestError } = await client
      .from('trip_manifest')
      .select('id, passenger_name, passenger_type, age, notes, allergy, special_request')
      .eq('trip_id', payload.tripId);

    if (manifestError) {
      logger.error('Failed to fetch manifest for AI suggestions', manifestError, { tripId: payload.tripId });
      return NextResponse.json(
        { error: 'Gagal memuat data manifest' },
        { status: 500 }
      );
    }

    const passengers: Passenger[] = (manifestData || []).map((m: any) => ({
      id: m.id,
      name: m.passenger_name || 'Unknown',
      type: (m.passenger_type || 'adult') as 'adult' | 'child' | 'infant',
      age: m.age,
      notes: m.notes,
      allergy: m.allergy,
      specialRequest: m.special_request,
    }));

    // If no passengers, return empty results
    if (passengers.length === 0) {
      if (payload.type === 'alerts') {
        return NextResponse.json({ alerts: [] });
      } else if (payload.type === 'grouping') {
        return NextResponse.json({ groupings: [] });
      } else {
        return NextResponse.json({
          suggestedNotes: '',
          safetyAlerts: [],
          priority: 'low',
        });
      }
    }

    // Build trip context
    const tripContext = {
      destination: (trip?.package as any)?.destination || 'Unknown',
      tripType: (trip?.package as any)?.trip_type || 'general',
      duration: (trip?.package as any)?.duration_days || 1,
      itinerary: (itineraryData || []).map((i: any) => ({
        activity: i.activity,
        location: i.location,
      })),
      weather,
    };

    if (payload.type === 'notes' && payload.passengerId) {
      // Suggest notes for specific passenger - FIX: use ID not name
      const passenger = passengers.find((p) => p.id === payload.passengerId);
      if (!passenger) {
        return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
      }

      const suggestion = await suggestManifestNotes(passenger, tripContext);
      return NextResponse.json(suggestion);
    } else if (payload.type === 'grouping') {
      // Get grouping suggestions with trip context
      const groupings = await getPassengerGroupingSuggestions(passengers, tripContext);
      return NextResponse.json({ groupings });
    } else if (payload.type === 'alerts') {
      // Get safety alerts with trip context
      const alerts = await getManifestSafetyAlerts(passengers, tripContext);
      return NextResponse.json({ alerts });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    logger.error('Failed to get manifest suggestions', error, {
      tripId: payload.tripId,
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal mendapatkan saran' },
      { status: 500 }
    );
  }
});
