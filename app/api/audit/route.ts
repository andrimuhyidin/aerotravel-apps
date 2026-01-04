/**
 * API: Audit Logs
 * GET /api/audit - Get audit logs (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getAuditLogs } from '@/lib/audit/cross-app-audit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import type { AppType, AuditAction } from '@/lib/audit/cross-app-audit';

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
  const app = searchParams.get('app') as AppType | null;
  const userId = searchParams.get('userId');
  const action = searchParams.get('action') as AuditAction | null;
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const { logs, total } = await getAuditLogs({
      app: app || undefined,
      userId: userId || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logger.error('[Audit API] Failed to get audit logs', error);
    throw error;
  }
});

