/**
 * API: Guide Profile History
 * GET /api/guide/profile/history - Get profile change history
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
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

  // Verify user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const fieldName = searchParams.get('field');

  // Build query
  let query = client
    .from('user_profile_history')
    .select('*')
    .eq('user_id', user.id)
    .order('changed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by field if provided
  if (fieldName) {
    query = query.eq('field_name', fieldName);
  }

  const { data: history, error } = await query;

  if (error) {
    logger.error('Failed to fetch profile history', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch profile history' },
      { status: 500 }
    );
  }

  // Get changed_by user names for better display
  const changedByUserIds = [
    ...new Set((history || []).map((h: { changed_by: string | null }) => h.changed_by).filter(Boolean)),
  ];

  let changedByUsers: Record<string, string> = {};
  if (changedByUserIds.length > 0) {
    const { data: users } = await client
      .from('users')
      .select('id, full_name')
      .in('id', changedByUserIds);

    if (users) {
      changedByUsers = users.reduce(
        (acc: Record<string, string>, u: { id: string; full_name: string | null }) => {
          acc[u.id] = u.full_name || 'Unknown';
          return acc;
        },
        {} as Record<string, string>
      );
    }
  }

  // Enrich history with user names
  const enrichedHistory = (history || []).map((h: { changed_by: string | null }) => ({
    ...h,
    changed_by_name: h.changed_by ? changedByUsers[h.changed_by] || 'Unknown' : null,
  }));

  logger.info('Profile history fetched', {
    userId: user.id,
    count: enrichedHistory.length,
  });

  return NextResponse.json({
    history: enrichedHistory,
    pagination: {
      limit,
      offset,
      total: enrichedHistory.length,
    },
  });
});

