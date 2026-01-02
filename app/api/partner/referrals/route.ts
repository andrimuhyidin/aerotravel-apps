/**
 * API: Partner Referrals
 * GET /api/partner/referrals - List partner's referrals
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
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
      { error: 'User is not a partner or team member' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  // Sanitize search params
  const sanitizedParams = sanitizeSearchParams(searchParams);
  const status = sanitizedParams.status || null;
  const limit = Math.min(parseInt(sanitizedParams.limit || '50'), 100); // Max 100
  const offset = parseInt(sanitizedParams.offset || '0');

  try {
    // Get partner's referral code first
    const { data: partnerProfile } = await client
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (!partnerProfile?.referral_code) {
      return NextResponse.json({
        referrals: [],
        total: 0,
      });
    }

    // Query referrals where this partner is the referrer
    let query = client
      .from('referrals')
      .select(`
        id,
        status,
        referrer_points,
        referee_discount,
        booking_id,
        completed_at,
        created_at,
        referee:referee_id(
          id,
          full_name,
          phone
        ),
        booking:booking_id(
          booking_code
        )
      `, { count: 'exact' })
      .eq('referrer_id', partnerId) // Use verified partnerId
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: referrals, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch partner referrals', error, { userId: user.id });
      throw error;
    }

    // Transform data
    const transformedReferrals = (referrals || []).map((r: any) => ({
      id: r.id,
      refereeName: r.referee?.full_name || 'Unknown',
      refereePhone: r.referee?.phone || '',
      status: r.status,
      referrerPoints: r.referrer_points,
      refereeDiscount: r.referee_discount,
      bookingId: r.booking_id,
      bookingCode: r.booking?.booking_code || null,
      completedAt: r.completed_at,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      referrals: transformedReferrals,
      total: count || 0,
    });
  } catch (error) {
    logger.error('Failed to fetch partner referrals', error, { userId: user.id });
    throw error;
  }
});

