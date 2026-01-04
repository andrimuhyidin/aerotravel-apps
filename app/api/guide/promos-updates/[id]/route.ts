/**
 * API: Single Promo & Update Detail
 * GET /api/guide/promos-updates/[id] - Get single promo/update/announcement detail
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const branchContext = await getBranchContext(user.id);
    const now = new Date().toISOString();
    const client = supabase as unknown as any;

    // Get promo detail
    const { data: promo, error: promoError } = await client
      .from('guide_promos')
      .select('id, type, title, subtitle, description, link, badge, gradient, priority, start_date, end_date, branch_id, is_active, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (promoError) {
      logger.error('Failed to fetch promo', promoError, {
        promoId: id,
        userId: user.id,
        errorCode: promoError.code,
        errorMessage: promoError.message,
      });

      if (promoError.code === 'PGRST116' || promoError.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'Failed to fetch promo' },
        { status: 500 }
      );
    }

    if (!promo) {
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    // Check if promo is active
    if (!promo.is_active) {
      return NextResponse.json({ error: 'Promo is not active' }, { status: 404 });
    }

    // Check date range
    if (new Date(promo.start_date) > new Date(now)) {
      return NextResponse.json({ error: 'Promo has not started yet' }, { status: 404 });
    }

    if (promo.end_date && new Date(promo.end_date) < new Date(now)) {
      return NextResponse.json({ error: 'Promo has ended' }, { status: 404 });
    }

    // Check branch access
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      if (promo.branch_id !== null && promo.branch_id !== branchContext.branchId) {
        return NextResponse.json({ error: 'Promo not available for your branch' }, { status: 403 });
      }
    }

    // Get read status
    let isRead = false;
    try {
      const { data: readStatus } = await client
        .from('guide_promo_reads')
        .select('id')
        .eq('guide_id', user.id)
        .eq('promo_id', id)
        .maybeSingle();

      isRead = !!readStatus;
    } catch (readError) {
      // Log but don't fail if read status query fails
      logger.warn('Failed to fetch read status for promo', { error: readError, promoId: id, userId: user.id });
    }

    // Transform to API format
    const promoDetail = {
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
      createdAt: promo.created_at,
      updatedAt: promo.updated_at,
      isRead,
    };

    return NextResponse.json({ promo: promoDetail });
  } catch (error) {
    logger.error('Failed to fetch promo detail', error, {
      promoId: id,
      userId: user.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to fetch promo detail' },
      { status: 500 }
    );
  }
});

