/**
 * API: Security Events Dashboard
 * GET /api/admin/security/events - Get recent security events
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  getRecentSecurityEvents,
  getSecurityEventSummary,
} from '@/lib/audit/security-events';
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

  // Check if user is super_admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  // Get summary and recent events
  const [summary, recentEvents] = await Promise.all([
    getSecurityEventSummary(days),
    getRecentSecurityEvents(limit),
  ]);

  logger.info('[SecurityEvents] Admin fetched security events', {
    userId: user.id,
    days,
    limit,
  });

  return NextResponse.json({
    summary,
    recentEvents,
    generatedAt: new Date().toISOString(),
  });
});

