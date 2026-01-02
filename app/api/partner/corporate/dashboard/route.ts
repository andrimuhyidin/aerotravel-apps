/**
 * API: Corporate Dashboard Stats
 * GET /api/partner/corporate/dashboard
 *
 * Returns dashboard statistics for the corporate portal
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getCorporateClient, getDashboardStats } from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get corporate client for user
    const corporate = await getCorporateClient(user.id);

    if (!corporate) {
      return NextResponse.json(
        { error: 'No corporate access' },
        { status: 403 }
      );
    }

    // Get dashboard stats
    const stats = await getDashboardStats(corporate.id);

    return NextResponse.json({
      corporate: {
        id: corporate.id,
        companyName: corporate.companyName,
        picName: corporate.picName,
        creditLimit: corporate.creditLimit,
      },
      stats,
    });
  } catch (error) {
    logger.error('Failed to get corporate dashboard', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to get dashboard' },
      { status: 500 }
    );
  }
});

