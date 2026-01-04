/**
 * User Stats API
 * GET /api/user/stats - Get current user's statistics
 * 
 * Note: Customer bookings are linked via customer_email (not user_id)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  logger.info('GET /api/user/stats');

  const supabase = await createClient();

  // Get current user with email
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const today = new Date().toISOString().split('T')[0];

  // Get booking counts - use customer_email OR created_by for matching
  const [upcomingResult, completedResult, totalSpentResult] = await Promise.all([
    // Upcoming trips
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
      .is('deleted_at', null)
      .gte('trip_date', today)
      .in('status', ['pending_payment', 'paid', 'confirmed']),
    
    // Completed trips
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
      .is('deleted_at', null)
      .eq('status', 'completed'),
    
    // Total spent
    supabase
      .from('bookings')
      .select('total_amount')
      .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
      .is('deleted_at', null)
      .in('status', ['paid', 'confirmed', 'completed']),
  ]);

  // Calculate total spent
  const totalSpent = (totalSpentResult.data || []).reduce(
    (sum, b) => sum + (Number(b.total_amount) || 0),
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
