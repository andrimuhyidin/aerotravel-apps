/**
 * API: Unified Analytics
 * GET /api/analytics/unified - Get unified analytics across all apps (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getUnifiedAnalytics } from '@/lib/analytics/unified-analytics';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin =
    userProfile?.role === 'super_admin' ||
    userProfile?.role === 'ops_admin' ||
    userProfile?.role === 'marketing';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const analytics = await getUnifiedAnalytics(
      startDate && endDate
        ? {
            start: startDate,
            end: endDate,
          }
        : undefined
    );

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error('[Unified Analytics API] Failed to get analytics', error);
    throw error;
  }
});

