/**
 * API: Guide Notifications (Unified)
 * GET /api/guide/notifications - Get unified notifications (system notifications + broadcasts)
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

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const type = searchParams.get('type'); // 'all' | 'system' | 'broadcast'

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get system notifications
    let systemNotifications: any[] = [];
    let systemError: any = null;

    if (!type || type === 'all' || type === 'system') {
      try {
        const { data: notifications, error: notifError } = await client
          .from('notification_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        systemNotifications = (notifications || []).map((n: any) => ({
          id: n.id,
          type: 'system' as const,
          source: 'system',
          channel: n.channel,
          subject: n.subject,
          body: n.body,
          status: n.status,
          createdAt: n.created_at,
          readAt: n.read_at,
          entityType: n.entity_type,
          entityId: n.entity_id,
        }));

        systemError = notifError;
      } catch (err) {
        systemError = err;
      }
    }

    // Get broadcasts
    let broadcasts: any[] = [];
    let broadcastError: any = null;

    if ((!type || type === 'all' || type === 'broadcast') && branchContext.branchId) {
      try {
        const now = new Date().toISOString();

        // Query broadcasts for all guides
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

        // Query broadcasts for specific guide
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

        const allBroadcasts = [
          ...(allResult.data || []),
          ...(guideResult.data || []),
        ];

        // Deduplicate and filter
        const uniqueBroadcasts = Array.from(
          new Map(allBroadcasts.map((b: any) => [b.id, b])).values(),
        ).filter((b: any) => {
          const isNotExpired = !b.expires_at || new Date(b.expires_at) > new Date(now);
          const isScheduled = !b.scheduled_at || new Date(b.scheduled_at) <= new Date(now);
          return isNotExpired && isScheduled;
        });

        // Get read status
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

        // Get creator names
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

        broadcasts = uniqueBroadcasts.map((broadcast: any) => ({
          id: broadcast.id,
          type: 'broadcast' as const,
          source: 'ops',
          broadcastType: broadcast.broadcast_type,
          title: broadcast.title,
          message: broadcast.message,
          isUrgent: broadcast.is_urgent,
          createdAt: broadcast.created_at,
          expiresAt: broadcast.expires_at,
          createdBy: creatorNames[broadcast.created_by] || 'Ops Team',
          isRead: readStatuses[broadcast.id] || false,
        }));

        broadcastError = allResult.error || guideResult.error;
      } catch (err) {
        const error = err as { code?: string; message?: string };
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          // Table doesn't exist, continue with empty array
          broadcastError = null;
        } else {
          broadcastError = error;
        }
      }
    }

    // Combine and sort
    const allNotifications = [...systemNotifications, ...broadcasts].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    const paginatedNotifications = allNotifications.slice(offset, offset + limit);

    // Count unread
    const unreadCount = allNotifications.filter((n) => {
      if (n.type === 'system') {
        return n.status !== 'read' && !n.readAt;
      } else {
        return !n.isRead;
      }
    }).length;

    return NextResponse.json({
      notifications: paginatedNotifications,
      unreadCount,
      total: allNotifications.length,
      hasMore: offset + limit < allNotifications.length,
    });
  } catch (error) {
    logger.error('Failed to fetch unified notifications', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
});
