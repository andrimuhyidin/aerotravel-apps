/**
 * API: Ops Broadcasts
 * GET /api/guide/broadcasts - Get active broadcasts for current guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get active broadcasts for this guide
    // Note: Using multiple queries due to complex OR conditions with arrays
    const now = new Date().toISOString();

    const { data: broadcastsForAll, error: allError } = await client
      .from('ops_broadcasts')
      .select(`
        id,
        broadcast_type,
        title,
        message,
        is_urgent,
        created_at,
        expires_at,
        created_by,
        target_guides,
        creator:users!ops_broadcasts_created_by_fkey(full_name)
      `)
      .eq('branch_id', branchContext.branchId)
      .eq('is_active', true)
      .is('target_guides', null)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
      .order('created_at', { ascending: false });

    const { data: broadcastsForGuide, error: guideError } = await client
      .from('ops_broadcasts')
      .select(`
        id,
        broadcast_type,
        title,
        message,
        is_urgent,
        created_at,
        expires_at,
        created_by,
        target_guides,
        creator:users!ops_broadcasts_created_by_fkey(full_name)
      `)
      .eq('branch_id', branchContext.branchId)
      .eq('is_active', true)
      .contains('target_guides', [user.id])
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
      .order('created_at', { ascending: false });

    const broadcastsError = allError || guideError;
    const allBroadcasts = [...(broadcastsForAll || []), ...(broadcastsForGuide || [])];

    // Deduplicate by id
    const uniqueBroadcasts = Array.from(
      new Map(allBroadcasts.map((b: any) => [b.id, b])).values(),
    );

    if (broadcastsError) {
      logger.error('Failed to fetch broadcasts', broadcastsError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
    }

    // Get read status for each broadcast
    const broadcastIds = uniqueBroadcasts.map((b: any) => b.id);

    let readStatuses: Record<string, boolean> = {};
    if (broadcastIds.length > 0) {
      const { data: reads } = await client
        .from('broadcast_reads')
        .select('broadcast_id')
        .eq('guide_id', user.id)
        .in('broadcast_id', broadcastIds);

      readStatuses = (reads || []).reduce(
        (acc: Record<string, boolean>, r: { broadcast_id: string }) => {
          acc[r.broadcast_id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
    }

    const formattedBroadcasts = (uniqueBroadcasts || []).map((broadcast: any) => ({
      id: broadcast.id,
      type: broadcast.broadcast_type,
      title: broadcast.title,
      message: broadcast.message,
      isUrgent: broadcast.is_urgent,
      createdAt: broadcast.created_at,
      expiresAt: broadcast.expires_at,
      createdBy: broadcast.creator?.full_name || 'Ops Team',
      isRead: readStatuses[broadcast.id] || false,
    }));

    return NextResponse.json({ broadcasts: formattedBroadcasts });
  } catch (error) {
    logger.error('Failed to fetch broadcasts', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
  }
});
