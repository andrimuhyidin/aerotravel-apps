/**
 * API: Generate Safety Briefing
 * POST /api/guide/trips/[id]/briefing/generate - Generate personalized briefing based on passenger profile
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
        generateBriefingPoints,
        type BriefingContext,
        type BriefingPoints,
    } from '@/lib/ai/briefing-generator';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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

  const body = (await request.json()) as {
    language?: 'id' | 'en' | 'zh' | 'ja';
  };

  const language = body.language || 'id';

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

  // Get trip details
  const { data: trip, error: tripError } = await client
    .from('trips')
    .select(`
      id,
      trip_code,
      trip_date,
      briefing_points,
      package:packages(
        name,
        destination,
        duration,
        package_type
      )
    `)
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    logger.error('Failed to fetch trip', tripError, { tripId });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Get passengers
  const { data: tripBookings } = await client
    .from('trip_bookings')
    .select('booking_id')
    .eq('trip_id', tripId);

  const bookingIds = (tripBookings || []).map((tb: { booking_id: string }) => tb.booking_id);
  
  let passengers: Array<{
    name: string;
    type: 'adult' | 'child' | 'infant';
    age?: number;
    allergy?: string;
    medicalCondition?: string;
    specialRequest?: string;
  }> = [];

  if (bookingIds.length > 0) {
    const { data: bookingPassengers } = await client
      .from('booking_passengers')
      .select('id, full_name, date_of_birth, passenger_type, allergy, medical_condition, special_request')
      .in('booking_id', bookingIds);

    passengers = (bookingPassengers || []).map((p: {
      full_name: string;
      date_of_birth?: string;
      passenger_type?: string;
      allergy?: string;
      medical_condition?: string;
      special_request?: string;
    }) => {
      let age: number | undefined;
      if (p.date_of_birth) {
        const birthDate = new Date(p.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      let type: 'adult' | 'child' | 'infant' = 'adult';
      if (p.passenger_type) {
        if (p.passenger_type === 'infant' || p.passenger_type === 'baby') {
          type = 'infant';
        } else if (p.passenger_type === 'child' || (age !== undefined && age < 13)) {
          type = 'child';
        }
      } else if (age !== undefined) {
        if (age < 2) type = 'infant';
        else if (age < 13) type = 'child';
      }

      return {
        name: p.full_name,
        type,
        age,
        allergy: p.allergy || undefined,
        medicalCondition: p.medical_condition || undefined,
        specialRequest: p.special_request || undefined,
      };
    });
  }

  // Get itinerary (if exists)
  const { data: itineraryData } = await client
    .from('trip_itineraries')
    .select('time, activity, location')
    .eq('trip_id', tripId)
    .order('time', { ascending: true });

  const itinerary = (itineraryData || []).map((item: { time: string; activity: string; location?: string }) => ({
    time: item.time,
    activity: item.activity,
    location: item.location || undefined,
  }));

  // Get weather data (if available)
  let weather: { condition?: string; hasAlert?: boolean } | undefined;
  try {
    // Try to get weather from risk assessment
    const { data: riskAssessment } = await client
      .from('pre_trip_assessments')
      .select('weather_condition, weather_data')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (riskAssessment?.weather_condition) {
      weather = {
        condition: riskAssessment.weather_condition,
        hasAlert: riskAssessment.weather_condition === 'stormy' || riskAssessment.weather_condition === 'rainy',
      };
    }
  } catch (error) {
    logger.warn('Failed to fetch weather data for briefing', { error });
  }

  const packageData = trip.package as {
    name?: string;
    destination?: string;
    duration?: number;
    package_type?: string;
  } | null;

  // Build briefing context
  const briefingContext: BriefingContext = {
    tripId: tripId,
    tripCode: trip.trip_code as string,
    tripDate: trip.trip_date as string,
    packageName: packageData?.name || undefined,
    destination: packageData?.destination || undefined,
    tripType: packageData?.package_type || undefined,
    duration: packageData?.duration || 1,
    totalPax: passengers.length,
    passengers,
    itinerary: itinerary.length > 0 ? itinerary : undefined,
    weather: weather ? {
      condition: weather.condition,
      hasAlert: weather.hasAlert,
    } : undefined,
    language,
  };

  // Check if briefing already exists and language matches
  if (trip.briefing_points && !body.language) {
    // Return existing briefing if no language specified
    return NextResponse.json({
      success: true,
      briefing: trip.briefing_points as BriefingPoints,
      cached: true,
    });
  }

  try {
    // Generate briefing points
    const briefingPoints = await generateBriefingPoints(briefingContext);

    // Save to trips table (briefing_points column)
    const branchContext = await getBranchContext(user.id);
    const { error: updateError } = await client
      .from('trips')
      .update({
        briefing_points: briefingPoints,
        briefing_generated_at: new Date().toISOString(),
        briefing_generated_by: user.id,
        briefing_updated_at: new Date().toISOString(),
        briefing_updated_by: user.id,
      })
      .eq('id', tripId);
    
    if (updateError) {
      logger.error('Failed to save briefing', updateError, { tripId, guideId: user.id });
      // Continue even if save fails - return generated briefing
    }

    logger.info('Briefing generated', {
      tripId,
      guideId: user.id,
      language,
      sections: briefingPoints.sections.length,
    });

    return NextResponse.json({
      success: true,
      briefing: briefingPoints,
    });
  } catch (error) {
    logger.error('Failed to generate briefing', error, { tripId, guideId: user.id });
    return NextResponse.json(
      { error: 'Failed to generate briefing. Please try again.' },
      { status: 500 }
    );
  }
});

