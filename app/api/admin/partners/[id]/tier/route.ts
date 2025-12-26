/**
 * API: Partner Tier Management
 * GET /api/admin/partners/[id]/tier - Get current tier + calculation details
 * PUT /api/admin/partners/[id]/tier - Manual override tier (admin only)
 * POST /api/admin/partners/[id]/tier/recalculate - Force recalculate tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { calculatePartnerTier } from '@/lib/partner/tier-calculator';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const overrideTierSchema = z.object({
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  reason: z.string().optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const client = supabase as unknown as any;

    // Get partner info
    const { data: partner, error: partnerError } = await client
      .from('users')
      .select('id, partner_tier, tier_auto_calculated, tier_assigned_at, tier_assigned_by')
      .eq('id', id)
      .eq('role', 'mitra')
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Calculate current tier
    const calculation = await calculatePartnerTier(id);

    return NextResponse.json({
      currentTier: partner.partner_tier || 'bronze',
      calculatedTier: calculation.tier,
      isAutoCalculated: partner.tier_auto_calculated ?? true,
      tierAssignedAt: partner.tier_assigned_at,
      tierAssignedBy: partner.tier_assigned_by,
      calculation,
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/partners/[id]/tier', error, { id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = overrideTierSchema.parse(body);

    const client = supabase as unknown as any;

    // Update tier with manual override
    const { error: updateError } = await client
      .from('users')
      .update({
        partner_tier: validated.tier,
        tier_assigned_at: new Date().toISOString(),
        tier_assigned_by: adminUser.id,
        tier_auto_calculated: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('role', 'mitra');

    if (updateError) {
      logger.error('Failed to override tier', updateError, { partnerId: id });
      return NextResponse.json(
        { error: 'Failed to update tier' },
        { status: 500 }
      );
    }

    logger.info('Partner tier manually overridden', {
      partnerId: id,
      tier: validated.tier,
      adminId: adminUser.id,
      reason: validated.reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Tier updated successfully',
      tier: validated.tier,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error in PUT /api/admin/partners/[id]/tier', error, { id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const supabase = await createClient();

    const allowed = await hasRole(['super_admin', 'ops_admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Calculate tier
      const calculation = await calculatePartnerTier(id);

      const client = supabase as unknown as any;

      // Update tier (auto-calculated)
      const { error: updateError } = await client
        .from('users')
        .update({
          partner_tier: calculation.tier,
          tier_assigned_at: new Date().toISOString(),
          tier_assigned_by: null, // Auto-assigned
          tier_auto_calculated: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('role', 'mitra');

      if (updateError) {
        logger.error('Failed to recalculate tier', updateError, { partnerId: id });
        return NextResponse.json(
          { error: 'Failed to recalculate tier' },
          { status: 500 }
        );
      }

      logger.info('Partner tier recalculated', {
        partnerId: id,
        tier: calculation.tier,
        adminId: adminUser.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Tier recalculated successfully',
        calculation,
      });
    } catch (error) {
      logger.error('Error in POST /api/admin/partners/[id]/tier/recalculate', error, { id });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
});

