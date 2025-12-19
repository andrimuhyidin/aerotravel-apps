/**
 * API: Trip Briefing Generator
 * GET /api/guide/trips/[id]/briefing - Get briefing points
 * POST /api/guide/trips/[id]/briefing - Generate new briefing points
 * PUT /api/guide/trips/[id]/briefing - Update/customize briefing points
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    generateBriefingPoints,
    type BriefingContext,
    type BriefingPoints,
} from '@/lib/ai/briefing-generator';
import { trackAiUsage } from '@/lib/analytics/ai-usage';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateBriefingSchema = z.object({
  sections: z
    .array(
      z.object({
        title: z.string(),
        points: z.array(z.string()),
        priority: z.enum(['high', 'medium', 'low']),
      })
    )
    .optional(),
  estimatedDuration: z.number().optional(),
  summary: z.string().optional(),
});

// GET - Retrieve existing briefing points
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Fetch trip dengan briefing points
  const { data: trip, error } = await client
    .from('trips')
    .select('briefing_points, briefing_generated_at, briefing_updated_at')
    .eq('id', tripId)
    .single();

  if (error) {
    logger.error('Failed to fetch briefing', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Gagal mengambil briefing' }, { status: 500 });
  }

  if (!trip?.briefing_points) {
    return NextResponse.json({ briefing: null });
  }

  return NextResponse.json({
    briefing: trip.briefing_points as BriefingPoints,
    generatedAt: trip.briefing_generated_at,
    updatedAt: trip.briefing_updated_at,
  });
});

// POST - Generate new briefing points
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      .select(`
        id,
        trip_code,
        trip_date,
        total_pax,
        package:packages(name, destination, trip_type, duration_days)
      `)
      .eq('id', tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Fetch manifest
    const { data: manifestData } = await client
      .from('trip_manifest')
      .select('passenger_name, passenger_type, age, allergy, special_request, medical_condition')
      .eq('trip_id', tripId);

    const passengers = (manifestData || []).map((m: any) => ({
      name: m.passenger_name,
      type: m.passenger_type,
      age: m.age,
      allergy: m.allergy,
      specialRequest: m.special_request,
      medicalCondition: m.medical_condition,
    }));

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

    // Fetch weather (optional)
    let weather;
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
      // Weather fetch failed, continue without it
    }

    // Build briefing context
    const briefingContext: BriefingContext = {
      tripId,
      tripCode: trip.trip_code || '',
      tripDate: trip.trip_date || '',
      packageName: (trip.package as { name: string } | null)?.name,
      destination: (trip.package as { destination: string } | null)?.destination,
      tripType: (trip.package as { trip_type: string } | null)?.trip_type,
      duration: (trip.package as { duration_days: number } | null)?.duration_days,
      totalPax: trip.total_pax || 0,
      passengers,
      itinerary,
      weather,
    };

    // Generate briefing points
    const briefing = await generateBriefingPoints(briefingContext);

    // Save to database
    const { error: updateError } = await client
      .from('trips')
      .update({
        briefing_points: briefing,
        briefing_generated_at: new Date().toISOString(),
        briefing_generated_by: user.id,
        briefing_updated_at: new Date().toISOString(),
        briefing_updated_by: user.id,
      })
      .eq('id', tripId);

    if (updateError) {
      logger.error('Failed to save briefing', updateError, { tripId, guideId: user.id });
      return NextResponse.json({ error: 'Gagal menyimpan briefing' }, { status: 500 });
    }

    logger.info('Briefing generated and saved', {
      tripId,
      guideId: user.id,
      sectionsCount: briefing.sections.length,
      targetAudience: briefing.targetAudience,
    });

    // Track usage
    await trackAiUsage({
      feature: 'briefing_generation',
      userId: user.id,
      tripId,
      metadata: {
        sectionsCount: briefing.sections.length,
        targetAudience: briefing.targetAudience,
        totalPax: briefingContext.totalPax,
      },
    });

    return NextResponse.json({ briefing }, { status: 201 });
  } catch (error) {
    logger.error('Failed to generate briefing', error, {
      tripId,
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal membuat briefing' },
      { status: 500 }
    );
  }
});

// PUT - Update/customize briefing points
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  const body = await request.json();
  const validated = updateBriefingSchema.parse(body);

  // Get existing briefing
  const { data: trip } = await client
    .from('trips')
    .select('briefing_points')
    .eq('id', tripId)
    .single();

  if (!trip?.briefing_points) {
    return NextResponse.json({ error: 'Briefing not found. Generate first.' }, { status: 404 });
  }

  const existingBriefing = trip.briefing_points as BriefingPoints;

  // Merge updates
  const updatedBriefing: BriefingPoints = {
    ...existingBriefing,
    ...(validated.sections && { sections: validated.sections }),
    ...(validated.estimatedDuration && { estimatedDuration: validated.estimatedDuration }),
    ...(validated.summary && { summary: validated.summary }),
  };

  // Save updated briefing
  const { error } = await client
    .from('trips')
    .update({
      briefing_points: updatedBriefing,
      briefing_updated_at: new Date().toISOString(),
      briefing_updated_by: user.id,
    })
    .eq('id', tripId);

  if (error) {
    logger.error('Failed to update briefing', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Gagal mengupdate briefing' }, { status: 500 });
  }

  // Track usage
  await trackAiUsage({
    feature: 'briefing_edit',
    userId: user.id,
    tripId,
    metadata: { sectionsCount: updatedBriefing.sections.length },
  });

  return NextResponse.json({ briefing: updatedBriefing });
});
