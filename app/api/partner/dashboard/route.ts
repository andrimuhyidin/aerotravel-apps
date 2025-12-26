/**
 * Partner Dashboard API - Unified Endpoint
 * Single endpoint untuk semua dashboard data (featured packages, active orders, monthly stats)
 * Mengikuti Tiket.com B2B pattern: transaction-focused, catalog-driven
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getDashboardData } from '@/lib/partner/dashboard-service';
import { getPartnerProfile } from '@/lib/partner/profile-service';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/partner/dashboard - Fetching dashboard data');

  const supabase = await createClient();

  // Get current user and partner profile
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.error('Unauthorized access attempt', userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get partner profile using correct service
  const profile = await getPartnerProfile(supabase, user.id);

  if (!profile) {
    logger.error('Partner profile not found', { userId: user.id });
    return NextResponse.json(
      { error: 'Partner profile not found' },
      { status: 404 }
    );
  }

  const branchId = profile.branchId || '00000000-0000-0000-0000-000000000000';

  try {
    const dashboardData = await getDashboardData(
      supabase,
      user.id,
      branchId
    );

    logger.info('Dashboard data fetched successfully', {
      featuredCount: dashboardData.featured.length,
      activeOrdersCount: dashboardData.active.length,
      recentBookingsCount: dashboardData.recent.length,
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    logger.error('Failed to fetch dashboard data', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});
