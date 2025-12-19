/**
 * API: Ops Broadcasts
 * GET /api/guide/broadcasts - Get active broadcasts for current guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
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

    // Check if table exists first by trying a simple query
    // If table doesn't exist, return empty array
    let broadcastsForAll: any[] = [];
    let broadcastsForGuide: any[] = [];
    let allError: any = null;
    let guideError: any = null;

    // Check if table exists - if not, return empty array
    if (!branchContext.branchId) {
      logger.info('No branch_id for user, returning empty broadcasts', {
        guideId: user.id,
        isSuperAdmin: branchContext.isSuperAdmin,
      });
      return NextResponse.json({ broadcasts: [] });
    }

    try {
      // Query broadcasts for all guides (target_guides is null)
      // Note: Using simpler query - RLS policy should handle expires_at and scheduled_at filtering
      const allResult = await client
        .from('ops_broadcasts')
        .select(`
          id,
          broadcast_type,
          title,
          message,
          is_urgent,
          created_at,
          expires_at,
          scheduled_at,
          created_by,
          target_guides
        `)
        .eq('branch_id', branchContext.branchId)
        .eq('is_active', true)
        .is('target_guides', null)
        .order('created_at', { ascending: false });
      
      // Filter in memory for expires_at and scheduled_at (RLS should handle this, but double-check)
      broadcastsForAll = (allResult.data || []).filter((b: any) => {
        const isNotExpired = !b.expires_at || new Date(b.expires_at) > new Date(now);
        const isScheduled = !b.scheduled_at || new Date(b.scheduled_at) <= new Date(now);
        return isNotExpired && isScheduled;
      });
      allError = allResult.error;
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        logger.info('ops_broadcasts table not found, returning empty array', {
          guideId: user.id,
          branchId: branchContext.branchId,
        });
        return NextResponse.json({ broadcasts: [] });
      }
      allError = error;
    }

    try {
      // Query broadcasts specifically for this guide (target_guides contains user.id)
      // Note: Using simpler query - RLS policy should handle expires_at and scheduled_at filtering
      const guideResult = await client
        .from('ops_broadcasts')
        .select(`
          id,
          broadcast_type,
          title,
          message,
          is_urgent,
          created_at,
          expires_at,
          scheduled_at,
          created_by,
          target_guides
        `)
        .eq('branch_id', branchContext.branchId)
        .eq('is_active', true)
        .contains('target_guides', [user.id])
        .order('created_at', { ascending: false });
      
      // Filter in memory for expires_at and scheduled_at (RLS should handle this, but double-check)
      broadcastsForGuide = (guideResult.data || []).filter((b: any) => {
        const isNotExpired = !b.expires_at || new Date(b.expires_at) > new Date(now);
        const isScheduled = !b.scheduled_at || new Date(b.scheduled_at) <= new Date(now);
        return isNotExpired && isScheduled;
      });
      guideError = guideResult.error;
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        // Table doesn't exist, continue with empty array
        guideError = error;
      } else {
        guideError = error;
      }
    }

    // Handle errors - if both fail, return empty. If one fails, continue with the other
    if (allError && guideError) {
      logger.error('Failed to fetch broadcasts (both queries failed)', {
        allError: {
          code: allError.code,
          message: allError.message,
          details: allError.details,
        },
        guideError: {
          code: guideError.code,
          message: guideError.message,
          details: guideError.details,
        },
        guideId: user.id,
        branchId: branchContext.branchId,
      });
      // Return empty broadcasts instead of 500
      return NextResponse.json({ broadcasts: [] });
    }

    // Log warnings for partial failures
    if (allError) {
      logger.warn('Failed to fetch broadcasts for all guides', {
        error: allError,
        guideId: user.id,
        hint: 'Continuing with guide-specific broadcasts only',
      });
    }
    if (guideError) {
      logger.warn('Failed to fetch broadcasts for specific guide', {
        error: guideError,
        guideId: user.id,
        hint: 'Continuing with all-guides broadcasts only',
      });
    }

    const allBroadcasts = [
      ...(broadcastsForAll || []),
      ...(broadcastsForGuide || []),
    ];

    // Deduplicate by id
    const uniqueBroadcasts = Array.from(
      new Map(allBroadcasts.map((b: any) => [b.id, b])).values(),
    );

    // Get creator names separately to avoid foreign key join issues
    const creatorIds = [...new Set(uniqueBroadcasts.map((b: any) => b.created_by).filter(Boolean))];
    let creatorNames: Record<string, string> = {};
    
    if (creatorIds.length > 0) {
      const { data: creators } = await client
        .from('users')
        .select('id, full_name')
        .in('id', creatorIds);
      
      if (creators) {
        creatorNames = creators.reduce(
          (acc: Record<string, string>, u: { id: string; full_name: string | null }) => {
            if (u.full_name) acc[u.id] = u.full_name;
            return acc;
          },
          {},
        );
      }
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
      createdBy: creatorNames[broadcast.created_by] || 'Ops Team',
      isRead: readStatuses[broadcast.id] || false,
    }));

    return NextResponse.json({ broadcasts: formattedBroadcasts });
  } catch (error) {
    logger.error('Failed to fetch broadcasts', error, { guideId: user.id });
    // Return empty array instead of error for better UX
    return NextResponse.json({ broadcasts: [] });
  }
});
