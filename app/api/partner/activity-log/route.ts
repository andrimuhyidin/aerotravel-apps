/**
 * API: Partner Activity Log
 * GET /api/partner/activity-log - Get activity logs with filtering and search
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const searchParams = sanitizeSearchParams(request);
  const actionType = searchParams.get('actionType'); // Filter by action type
  const entityType = searchParams.get('entityType'); // Filter by entity type
  const userId = searchParams.get('userId'); // Filter by user (team member)
  const from = searchParams.get('from'); // Date range start
  const to = searchParams.get('to'); // Date range end
  const search = searchParams.get('search'); // Search in details
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {

    // Build query
    let query = client
      .from('partner_activity_logs')
      .select(
        `
        id,
        partner_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent,
        created_at,
        user:users!partner_activity_logs_user_id_fkey(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('partner_id', partnerId);

    // Filter by action type
    if (actionType && actionType !== 'all') {
      query = query.eq('action_type', actionType);
    }

    // Filter by entity type
    if (entityType && entityType !== 'all') {
      query = query.eq('entity_type', entityType);
    }

    // Filter by user (team member)
    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId);
    }

    // Filter by date range
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    // Search in details (JSONB search)
    if (search) {
      query = query.or(`details::text.ilike.%${search}%`);
    }

    // Order by created_at (newest first)
    query = query.order('created_at', { ascending: false });

    // Paginate
    const { data: logs, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch activity logs', error, {
        userId: user.id,
        partnerId,
        actionType,
        entityType,
      });
      return NextResponse.json(
        { error: 'Failed to fetch activity logs', details: error.message },
        { status: 500 }
      );
    }

    // Transform logs data
    const transformedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      partnerId: log.partner_id,
      userId: log.user_id,
      userName: log.user?.full_name || log.user?.email || 'Unknown',
      actionType: log.action_type,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.details || {},
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
    }));

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch activity logs', error, {
      userId: user.id,
    });
    throw error;
  }
});

