/**
 * API: Partner Branches
 * GET /api/partner/branches - List partner's branches
 * POST /api/partner/branches - Create new branch
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createBranchSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  try {
    // Get partner's branches using verified partnerId
    const { data: branches, error } = await client
      .from('partner_branches')
      .select(`
        id,
        name,
        address,
        phone,
        is_headquarters,
        created_at
      `)
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .order('is_headquarters', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch branches', error, { userId: user.id });
      throw error;
    }

    // Get team counts and revenue for each branch
    const enrichedBranches = await Promise.all(
      (branches || []).map(async (branch: any) => {
        // Get team count
        const { count: teamCount } = await client
          .from('partner_users')
          .select('id', { count: 'exact', head: true })
          .eq('branch_id', branch.id)
          .is('deleted_at', null);

        // Get bookings count and revenue
        const { data: bookingStats } = await client
          .from('bookings')
          .select('total_amount')
          .eq('partner_branch_id', branch.id)
          .in('status', ['confirmed', 'completed', 'paid']);

        const bookingsCount = bookingStats?.length || 0;
        const revenue = (bookingStats || []).reduce(
          (sum: number, b: { total_amount: number }) => sum + Number(b.total_amount || 0),
          0
        );

        return {
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          isHeadquarters: branch.is_headquarters,
          teamCount: teamCount || 0,
          bookingsCount,
          revenue,
          createdAt: branch.created_at,
        };
      })
    );

    return NextResponse.json({ branches: enrichedBranches });
  } catch (error) {
    logger.error('Failed to fetch branches', error, { userId: user.id });
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = createBranchSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  // Sanitize validated data
  const sanitizedData = sanitizeRequestBody(validation.data, {
    strings: ['name', 'address'],
    phones: ['phone'],
  });

  const { name, address, phone } = sanitizedData;

  try {
    // Check if user already has a headquarters
    const { data: existingHQ } = await client
      .from('partner_branches')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('is_headquarters', true)
      .is('deleted_at', null)
      .maybeSingle();

    const isHeadquarters = !existingHQ;

    // Create branch using verified partnerId
    const { data: branch, error } = await client
      .from('partner_branches')
      .insert({
        partner_id: partnerId,
        name,
        address: address || null,
        phone: phone || null,
        is_headquarters: isHeadquarters,
      })
      .select('id')
      .single();

    if (error || !branch) {
      logger.error('Failed to create branch', error, { userId: user.id });
      throw error;
    }

    logger.info('Branch created', { userId: user.id, branchId: branch.id });

    return NextResponse.json({
      success: true,
      branchId: branch.id,
    });
  } catch (error) {
    logger.error('Failed to create branch', error, { userId: user.id });
    throw error;
  }
});

