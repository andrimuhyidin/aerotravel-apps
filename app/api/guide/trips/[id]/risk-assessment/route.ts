/**
 * API: Pre-Trip Risk Assessment
 * POST /api/guide/trips/[id]/risk-assessment - Create risk assessment
 * GET /api/guide/trips/[id]/risk-assessment - Get latest assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const riskAssessmentSchema = z.object({
  wave_height: z.number().min(0).max(10).optional(),
  wind_speed: z.number().min(0).max(100).optional(),
  weather_condition: z.enum(['clear', 'cloudy', 'rainy', 'stormy']).optional(),
  crew_ready: z.boolean().default(false),
  equipment_complete: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  use_weather_data: z.boolean().optional(), // Auto-fill from weather API
});

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

  // Get latest assessment for this trip
  const { data: assessment, error } = await client
    .from('pre_trip_assessments')
    .select('*')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch risk assessment', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
  }

  return NextResponse.json({
    assessment: assessment || null,
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const payload = riskAssessmentSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify guide assignment
  const client = supabase as unknown as any;
  const { data: assignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment && !crewAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);

  // Fetch weather data if requested and coordinates provided
  let weatherData: unknown = null;
  let finalPayload = { ...payload };

  if (payload.use_weather_data && payload.latitude && payload.longitude) {
    try {
      const weatherResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/guide/weather?lat=${payload.latitude}&lng=${payload.longitude}`
      );
      
      if (weatherResponse.ok) {
        weatherData = await weatherResponse.json();
        const weather = weatherData as {
          current?: { wind_speed?: number; weather?: { main?: string } };
        };
        
        // Auto-fill from weather data if not provided
        if (!finalPayload.wind_speed && weather.current?.wind_speed) {
          finalPayload.wind_speed = weather.current.wind_speed;
        }
        
        if (!finalPayload.weather_condition && weather.current?.weather?.main) {
          const weatherMain = weather.current.weather.main.toLowerCase();
          if (weatherMain.includes('storm') || weatherMain.includes('thunder')) {
            finalPayload.weather_condition = 'stormy';
          } else if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
            finalPayload.weather_condition = 'rainy';
          } else if (weatherMain.includes('cloud')) {
            finalPayload.weather_condition = 'cloudy';
          } else {
            finalPayload.weather_condition = 'clear';
          }
        }
        
        // Estimate wave height from wind speed if not provided
        if (!finalPayload.wave_height && finalPayload.wind_speed) {
          // Rough approximation: wave_height ≈ wind_speed / 20
          finalPayload.wave_height = Math.min(2.5, finalPayload.wind_speed / 20);
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch weather data, using manual input', { error });
    }
  }

  // Calculate risk score using database function
  const { data: riskScore, error: scoreError } = await client.rpc('calculate_risk_score', {
    wave_height_val: finalPayload.wave_height || null,
    wind_speed_val: finalPayload.wind_speed || null,
    weather_condition_val: finalPayload.weather_condition || null,
    crew_ready_val: finalPayload.crew_ready,
    equipment_complete_val: finalPayload.equipment_complete,
  });

  if (scoreError) {
    logger.error('Failed to calculate risk score', scoreError);
    return NextResponse.json({ error: 'Failed to calculate risk score' }, { status: 500 });
  }

  // Get risk level
  const { data: riskLevel } = await client.rpc('get_risk_level', {
    score: riskScore || 0,
  });

  // Determine if safe (threshold: risk_score <= 70, OR admin can override later)
  const isSafe = (riskScore || 0) <= 70; // Updated threshold: > 70 = BLOCK

  // Insert assessment
  const { data: assessment, error: insertError } = await withBranchFilter(
    client.from('pre_trip_assessments'),
    branchContext,
  )
    .insert({
      trip_id: tripId,
      guide_id: user.id,
      branch_id: branchContext.branchId,
      wave_height: finalPayload.wave_height || null,
      wind_speed: finalPayload.wind_speed || null,
      weather_condition: finalPayload.weather_condition || null,
      crew_ready: finalPayload.crew_ready,
      equipment_complete: finalPayload.equipment_complete,
      risk_score: riskScore || 0,
      risk_level: riskLevel || 'low',
      is_safe: isSafe,
      weather_data: weatherData || null,
      latitude: finalPayload.latitude || null,
      longitude: finalPayload.longitude || null,
      notes: finalPayload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Failed to create risk assessment', insertError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }

  logger.info('Risk assessment created', {
    assessmentId: assessment.id,
    tripId,
    guideId: user.id,
    riskScore,
    riskLevel,
    isSafe,
  });

  // Check if trip should be blocked (risk_score > 70)
  const isBlocked = (riskScore || 0) > 70;

  return NextResponse.json(
    {
      success: true,
      assessment,
      can_start: isSafe && !isBlocked,
      is_blocked: isBlocked,
      risk_score: riskScore || 0,
      risk_level: riskLevel || 'low',
      message: isBlocked
        ? `Risk score terlalu tinggi (${riskScore || 0} > 70). Trip tidak dapat dimulai. Hubungi Admin Ops untuk override.`
        : isSafe
        ? 'Assessment selesai. Trip dapat dimulai.'
        : 'Assessment menunjukkan risiko sedang. Perhatikan kondisi sebelum memulai trip.',
    },
    { status: 201 },
  );
});
