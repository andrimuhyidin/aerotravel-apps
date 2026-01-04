/**
 * API: Travel Circle Detail
 * GET /api/partner/travel-circle/[id] - Get circle detail
 * PUT /api/partner/travel-circle/[id] - Update circle
 * DELETE /api/partner/travel-circle/[id] - Cancel circle
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { getTravelCircle } from '@/lib/partner/travel-circle';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: circleId } = await params;
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

  try {
    const circle = await getTravelCircle(circleId, partnerId);

    if (!circle) {
      return NextResponse.json(
        { error: 'Travel circle tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      );
    }

    return NextResponse.json({ circle });
  } catch (error) {
    logger.error('Failed to get travel circle', error, {
      circleId,
      userId: user.id,
    });
    throw error;
  }
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: circleId } = await params;
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

  const body = await request.json();
  const sanitizedBody = sanitizeRequestBody(body, {
    strings: ['name', 'description'],
  });
  const { name, description, targetDate } = sanitizedBody;

  const client = supabase as unknown as any;

  try {
    // Verify user is creator
    const { data: circle } = await client
      .from('travel_circles')
      .select('id, created_by, status')
      .eq('id', circleId)
      .single();

    if (!circle || circle.created_by !== partnerId) {
      return NextResponse.json(
        { error: 'Unauthorized - hanya creator yang bisa update' },
        { status: 403 }
      );
    }

    if (circle.status !== 'active') {
      return NextResponse.json(
        { error: 'Hanya circle aktif yang bisa di-update' },
        { status: 400 }
      );
    }

    // Update circle
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (targetDate) {
      const target = new Date(targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (target < today) {
        return NextResponse.json(
          { error: 'Target date harus di masa depan' },
          { status: 400 }
        );
      }
      updateData.target_date = targetDate;
    }
    updateData.updated_at = new Date().toISOString();

    const { error: updateError } = await client
      .from('travel_circles')
      .update(updateData)
      .eq('id', circleId);

    if (updateError) {
      logger.error('Failed to update travel circle', updateError);
      return NextResponse.json(
        { error: 'Gagal update travel circle' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Travel circle berhasil di-update',
    });
  } catch (error) {
    logger.error('Failed to update travel circle', error, {
      circleId,
      userId: user.id,
    });
    throw error;
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: circleId } = await params;
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

  const client = supabase as unknown as any;

  try {
    // Verify user is creator
    const { data: circle } = await client
      .from('travel_circles')
      .select('id, created_by, status')
      .eq('id', circleId)
      .single();

    if (!circle || circle.created_by !== partnerId) {
      return NextResponse.json(
        { error: 'Unauthorized - hanya creator yang bisa cancel' },
        { status: 403 }
      );
    }

    // Cancel circle (soft delete)
    const { error: updateError } = await client
      .from('travel_circles')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', circleId);

    if (updateError) {
      logger.error('Failed to cancel travel circle', updateError);
      return NextResponse.json(
        { error: 'Gagal cancel travel circle' },
        { status: 500 }
      );
    }

    logger.info('Travel circle cancelled', { circleId, userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Travel circle berhasil dibatalkan',
    });
  } catch (error) {
    logger.error('Failed to cancel travel circle', error, {
      circleId,
      userId: user.id,
    });
    throw error;
  }
});

