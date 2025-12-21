/**
 * API: Promos & Updates
 * GET /api/guide/promos-updates - Get company promos, updates, and announcements
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

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined; // undefined = no limit for list page
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const page = pageParam ? parseInt(pageParam, 10) : undefined;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : undefined;

    const branchContext = await getBranchContext(user.id);
    const now = new Date().toISOString();

    // Fetch active promos/updates/announcements from database
    // Limit to 50 items from database (increase for list page support)
    // Then filter and deduplicate in memory
    const dbLimit = limit || pageSize ? 50 : 20; // Higher limit if pagination requested
    const { data: promosData, error: promosError } = await supabase
      .from('guide_promos')
      .select('id, type, title, subtitle, description, link, badge, gradient, priority, start_date, end_date, branch_id, is_active, created_at, updated_at')
      .eq('is_active', true)
      .lte('start_date', now)
      .order('created_at', { ascending: false })
      .limit(dbLimit);

    // Filter in memory for date range and branch
    const filteredPromos = (promosData || []).filter((promo: {
      end_date: string | null;
      branch_id: string | null;
    }) => {
      // Filter by end_date: null or >= now
      if (promo.end_date && new Date(promo.end_date) < new Date(now)) {
        return false;
      }

      // Filter by branch: global (NULL) or user's branch
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        if (promo.branch_id !== null && promo.branch_id !== branchContext.branchId) {
          return false;
        }
      }

      return true;
    });

    if (promosError) {
      // Check if it's an RLS/permission error
      const isRlsError = 
        promosError.code === 'PGRST301' || 
        promosError.code === '42501' ||
        promosError.message?.toLowerCase().includes('permission') ||
        promosError.message?.toLowerCase().includes('policy') ||
        promosError.message?.toLowerCase().includes('row-level security');
      
      logger.error('Failed to fetch promos from database', promosError, {
        userId: user.id,
        branchId: branchContext.branchId,
        errorCode: promosError.code,
        errorMessage: promosError.message,
        errorDetails: promosError.details,
        errorHint: promosError.hint,
        isRlsError,
      });
      
      // If RLS error, return empty array (expected - RLS policy may not be active)
      if (isRlsError) {
        logger.warn('RLS error detected for promos - returning empty array', {
          userId: user.id,
          hint: 'Check if RLS policy is active for guide_promos table',
        });
      }
      
      // Fallback to empty array if database query fails
      return NextResponse.json({ items: [] });
    }

    // Transform database records to API format
    const itemsMap = new Map<string, {
      id: string;
      type: 'promo' | 'update' | 'announcement';
      title: string;
      subtitle?: string;
      description?: string;
      link?: string;
      badge?: string;
      gradient?: string;
      priority: 'low' | 'medium' | 'high';
      startDate: string;
      endDate?: string;
      isRead?: boolean;
    }>();

    // Use Map to deduplicate by ID (keep first occurrence)
    filteredPromos.forEach((promo: {
      id: string;
      type: string;
      title: string;
      subtitle: string | null;
      description: string | null;
      link: string | null;
      badge: string | null;
      gradient: string | null;
      priority: string;
      start_date: string;
      end_date: string | null;
    }) => {
      if (!itemsMap.has(promo.id)) {
        itemsMap.set(promo.id, {
          id: promo.id,
          type: promo.type as 'promo' | 'update' | 'announcement',
          title: promo.title,
          subtitle: promo.subtitle || undefined,
          description: promo.description || undefined,
          link: promo.link || undefined,
          badge: promo.badge || undefined,
          gradient: promo.gradient || undefined,
          priority: promo.priority as 'low' | 'medium' | 'high',
          startDate: promo.start_date,
          endDate: promo.end_date || undefined,
        });
      }
    });

    // Convert Map to array
    const items = Array.from(itemsMap.values());

    // Get read status for all promos
    const promoIds = items.map((item) => item.id);
    let readStatuses: Record<string, boolean> = {};

    if (promoIds.length > 0) {
      try {
        const client = supabase as unknown as any;
        const { data: reads } = await client
          .from('guide_promo_reads')
          .select('promo_id')
          .eq('guide_id', user.id)
          .in('promo_id', promoIds);

        readStatuses = (reads || []).reduce(
          (acc: Record<string, boolean>, r: { promo_id: string }) => {
            acc[r.promo_id] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
      } catch (readError) {
        // Log but don't fail if read status query fails
        logger.warn('Failed to fetch read status for promos', { error: readError, userId: user.id });
      }
    }

    // Sort by priority (high > medium > low), then by creation date
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    items.sort((a: { priority: string; startDate: string }, b: { priority: string; startDate: string }) => {
      const priorityDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      if (priorityDiff !== 0) return priorityDiff;
      // If same priority, newer items first
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    // Add read status to items
    const itemsWithReadStatus = items.map((item) => ({
      ...item,
      isRead: readStatuses[item.id] || false,
    }));

    // Apply limit if specified (for widget), otherwise return all (for list page)
    let finalItems = itemsWithReadStatus;
    if (limit !== undefined && limit > 0) {
      finalItems = itemsWithReadStatus.slice(0, limit);
    } else if (page !== undefined && pageSize !== undefined) {
      // Pagination support
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      finalItems = itemsWithReadStatus.slice(startIndex, endIndex);
      
      return NextResponse.json({
        items: finalItems,
        pagination: {
          page,
          pageSize,
          total: items.length,
          totalPages: Math.ceil(items.length / pageSize),
        },
      });
    }

    return NextResponse.json({ items: finalItems });
  } catch (error) {
    logger.error('Failed to fetch promos/updates', error, {
      userId: user.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    // Return empty array on error
    return NextResponse.json({ items: [] });
  }
});

