/**
 * API: AI Trip Chat Assistant
 * POST /api/guide/trips/[id]/chat-ai
 * 
 * Context-aware AI assistant untuk trip-specific queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { chatTripAssistant, getTripSuggestions, type TripContext } from '@/lib/ai/trip-assistant';
import { trackAiUsage } from '@/lib/analytics/ai-usage';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const chatAiSchema = z.object({
  question: z.string().min(1).max(500),
  type: z.enum(['chat', 'suggestions']).default('chat'),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: assignment, error: assignmentError } = await client
    .from('trip_guides')
    .select('id, assignment_status')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (assignmentError) {
    logger.error('Failed to check trip assignment', assignmentError, {
      tripId,
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal memverifikasi assignment trip' },
      { status: 500 }
    );
  }

  if (!assignment) {
    logger.warn('Guide not assigned to trip', {
      tripId,
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Anda tidak di-assign ke trip ini' },
      { status: 403 }
    );
  }

  const payload = chatAiSchema.parse(await request.json());

  try {
    // Fetch trip context
    const { data: trip } = await client
      .from('trips')
      .select(`
        id,
        trip_code,
        trip_date,
        status,
        total_pax,
        package:packages(name)
      `)
      .eq('id', tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Fetch manifest
    const { data: manifestData } = await client
      .from('trip_manifest')
      .select('id, passenger_name, passenger_type, boarding_status, notes, allergy, special_request')
      .eq('trip_id', tripId);

    const manifest = {
      total: manifestData?.length || 0,
      boarded: manifestData?.filter((m: { boarding_status: string }) => m.boarding_status === 'boarded').length || 0,
      returned: manifestData?.filter((m: { boarding_status: string }) => m.boarding_status === 'returned').length || 0,
      passengers: (manifestData || []).map((m: any) => ({
        name: m.passenger_name,
        type: m.passenger_type,
        status: m.boarding_status,
        notes: m.notes,
        allergy: m.allergy,
        specialRequest: m.special_request,
      })),
    };

    // Fetch tasks
    const { data: tasksData } = await client
      .from('trip_tasks')
      .select('id, title, status, due_time')
      .eq('trip_id', tripId)
      .order('due_time', { ascending: true });

    const tasks = (tasksData || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueTime: t.due_time,
    }));

    // Fetch weather (if available)
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

    // Fetch expenses summary
    const { data: expensesData } = await client
      .from('guide_expenses')
      .select('amount, category')
      .eq('trip_id', tripId);

    const expenses = {
      total: (expensesData || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0),
      count: expensesData?.length || 0,
      categories: (expensesData || []).reduce((acc: Record<string, number>, e: any) => {
        const cat = e.category || 'other';
        acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
        return acc;
      }, {}),
    };

    // Fetch attendance
    const { data: attendanceData } = await client
      .from('guide_attendance')
      .select('check_in_time, check_out_time')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    const attendance = {
      hasCheckedIn: !!attendanceData?.check_in_time,
      hasCheckedOut: !!attendanceData?.check_out_time,
      checkInTime: attendanceData?.check_in_time,
    };

    // Build trip context
    const tripContext: TripContext = {
      tripId,
      tripCode: trip.trip_code || '',
      tripDate: trip.trip_date || '',
      status: trip.status || '',
      totalPax: trip.total_pax || 0,
      packageName: (trip.package as { name: string } | null)?.name,
      manifest,
      tasks,
      weather,
      itinerary,
      expenses,
      attendance,
    };

    // Handle request type
    if (payload.type === 'suggestions') {
      const suggestions = await getTripSuggestions(tripContext);
      return NextResponse.json({ suggestions });
    } else {
      const response = await chatTripAssistant(
        payload.question,
        tripContext,
        branchContext.branchId
      );
      
      // Track usage
      await trackAiUsage({
        feature: 'chat_assistant',
        userId: user.id,
        tripId,
        metadata: { questionLength: payload.question.length },
      });
      
      return NextResponse.json({ response });
    }
  } catch (error) {
    logger.error('Failed to process AI chat request', error, {
      tripId,
      guideId: user.id,
      question: payload.question,
    });
    
    // Better error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Gagal memproses permintaan AI';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
