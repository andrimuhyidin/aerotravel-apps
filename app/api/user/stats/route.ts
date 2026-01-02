/**
 * User Stats API
 * GET /api/user/stats - Get current user's statistics
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  logger.info('GET /api/user/stats');

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const today = new Date().toISOString().split('T')[0];

  // Get booking counts
  const [upcomingResult, completedResult, totalSpentResult] = await Promise.all([
    // Upcoming trips
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('trip_date', today)
      .in('status', ['pending', 'paid', 'confirmed']),
    
    // Completed trips
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed'),
    
    // Total spent
    supabase
      .from('bookings')
      .select('total_amount')
      .eq('user_id', user.id)
      .in('status', ['paid', 'confirmed', 'completed']),
  ]);

  // Calculate total spent
  const totalSpent = (totalSpentResult.data || []).reduce(
    (sum, b) => sum + (b.total_amount || 0),
    0
  );

  // Get loyalty points (from loyalty_points table if exists)
  let aeroPoints = 0;
  try {
    const { data: loyaltyData } = await supabase
      .from('loyalty_points')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    
    aeroPoints = loyaltyData?.balance || 0;
  } catch {
    // Table might not exist, that's okay
  }

  return NextResponse.json({
    upcomingTrips: upcomingResult.count || 0,
    completedTrips: completedResult.count || 0,
    totalSpent,
    aeroPoints,
  });
});

