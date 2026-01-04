/**
 * API: Partner Team Member Detail
 * GET /api/partner/team/[id] - Get team member detail
 * PUT /api/partner/team/[id] - Update team member
 * DELETE /api/partner/team/[id] - Delete team member (soft delete)
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: teamMemberId } = await params;
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
    const { data: teamMember, error } = await client
      .from('partner_users')
      .select('*')
      .eq('id', teamMemberId)
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .single();

    if (error || !teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Get performance stats if agent
    if (teamMember.role === 'agent') {
      const { data: bookings } = await client
        .from('bookings')
        .select('id, total_amount, nta_total, created_at')
        .eq('mitra_id', partnerId)
        .eq('created_by', teamMember.user_id || teamMember.id)
        .is('deleted_at', null);

      const bookingCount = bookings?.length || 0;
      const totalRevenue =
        bookings?.reduce((sum: number, b: { total_amount: number }) => {
          return sum + Number(b.total_amount || 0);
        }, 0) || 0;
      const totalCommission =
        bookings?.reduce((sum: number, b: { total_amount: number; nta_total: number | null }) => {
          return sum + (Number(b.total_amount || 0) - Number(b.nta_total || 0));
        }, 0) || 0;

      return NextResponse.json({
        teamMember,
        performance: {
          bookingCount,
          totalRevenue,
          totalCommission,
        },
      });
    }

    return NextResponse.json({ teamMember });
  } catch (error) {
    logger.error('Failed to fetch team member detail', error, {
      teamMemberId,
      userId: user.id,
    });
    throw error;
  }
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: teamMemberId } = await params;
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
  const sanitizedBody = sanitizeRequestBody(body, { strings: ['name'], phones: ['phone'] });
  const { name, phone, role, permissions, is_active } = sanitizedBody;

  const client = supabase as unknown as any;

  try {
    // Check if user is owner
    // Main partner (mitra) is owner by default
    const { data: partnerUser } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .eq('role', 'mitra')
      .maybeSingle();

    // Also check if they have owner role in partner_users
    const { data: currentUser } = await client
      .from('partner_users')
      .select('role')
      .eq('partner_id', partnerId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    // Main partner (mitra) is owner by default, or if they have owner role in partner_users
    const isOwner = partnerUser || currentUser?.role === 'owner';

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only owners can update team members' },
        { status: 403 }
      );
    }

    // Check if team member exists
    const { data: existingMember } = await client
      .from('partner_users')
      .select('id')
      .eq('id', teamMemberId)
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .single();

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Update team member
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions || [];
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: teamMember, error } = await client
      .from('partner_users')
      .update(updateData)
      .eq('id', teamMemberId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update team member', error, {
        teamMemberId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update team member', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Team member updated', {
      teamMemberId,
      userId: user.id,
    });

    return NextResponse.json({ teamMember });
  } catch (error) {
    logger.error('Failed to update team member', error, {
      teamMemberId,
      userId: user.id,
    });
    throw error;
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: teamMemberId } = await params;
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
    // Check if user is owner
    // Main partner (mitra) is owner by default
    const { data: partnerUser } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .eq('role', 'mitra')
      .maybeSingle();

    // Also check if they have owner role in partner_users
    const { data: currentUser } = await client
      .from('partner_users')
      .select('role')
      .eq('partner_id', partnerId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    // Main partner (mitra) is owner by default, or if they have owner role in partner_users
    const isOwner = partnerUser || currentUser?.role === 'owner';

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only owners can delete team members' },
        { status: 403 }
      );
    }

    // Check if team member exists
    const { data: existingMember } = await client
      .from('partner_users')
      .select('id')
      .eq('id', teamMemberId)
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .single();

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Soft delete
    const { error } = await client
      .from('partner_users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', teamMemberId);

    if (error) {
      logger.error('Failed to delete team member', error, {
        teamMemberId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to delete team member', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Team member deleted', {
      teamMemberId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete team member', error, {
      teamMemberId,
      userId: user.id,
    });
    throw error;
  }
});

