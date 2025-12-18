/**
 * Guide Trip Preload API
 * Returns trip data for offline caching
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id: tripId } = await context.params;
  const supabase = await createClient();

  logger.info('Preloading trip data', { tripId });

  // Verify user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get trip details
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // TODO: Get manifest, attendance, evidence, expenses when tables exist
  // For now, return mock data
  const manifest = [
    { id: '1', name: 'Ahmad Fadli', type: 'adult', status: 'pending' },
    { id: '2', name: 'Siti Rahayu', type: 'adult', status: 'pending' },
  ];

  logger.info('Trip preload successful', { tripId });

  return NextResponse.json({
    trip,
    manifest,
    attendance: null,
    evidence: [],
    expenses: [],
    preloadedAt: new Date().toISOString(),
  });
});
