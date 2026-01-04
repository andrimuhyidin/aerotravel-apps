/**
 * API: Guest Engagement Music
 * GET /api/guide/trips/[id]/engagement/music - Get AI-generated music references
 */

import { NextRequest, NextResponse } from 'next/server';

import { generateMusicReferences } from '@/lib/ai/music-generator';
import type { TripContext } from '@/lib/ai/trip-assistant';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!crewAssignment && !legacyAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch trip data for context
    const { data: trip } = await client
      .from('trips')
      .select(`
        id,
        trip_code,
        trip_date,
        total_pax,
        package:packages(id, name, destination)
      `)
      .eq('id', tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
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

    // Build trip context
    const tripContext: TripContext = {
      tripId,
      tripCode: trip.trip_code || '',
      tripDate: trip.trip_date || '',
      status: 'on_trip',
      totalPax: trip.total_pax || 0,
      packageName: (trip.package as { name: string } | null)?.name,
      itinerary,
    };

    // Generate music references with AI
    const references = await generateMusicReferences(tripContext);

    // Convert to playlist format for backward compatibility
    const playlists = references.map((ref, idx) => ({
      id: `ai-ref-${idx}`,
      name: ref.name,
      category: ref.category,
      description: ref.description,
      genre: ref.genre,
      mood: ref.mood,
      suitable_for: ref.suitable_for || [],
    }));

    logger.info('Music references generated', {
      tripId,
      count: playlists.length,
      generatedBy: user.id,
    });

    return NextResponse.json({
      playlists: playlists || [],
      generated_at: new Date().toISOString(),
      note: 'Referensi musik ini di-generate oleh AI dan hanya sebagai panduan',
    });
  } catch (error) {
    logger.error('Failed to generate music references', error, { tripId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate music references' },
      { status: 500 }
    );
  }
});
