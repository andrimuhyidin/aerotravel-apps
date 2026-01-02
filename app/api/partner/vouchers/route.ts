/**
 * API: Partner Vouchers
 * GET /api/partner/vouchers - List partner's vouchers
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
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sanitizedParams = sanitizeSearchParams(searchParams);
  const status = sanitizedParams.status || null;
  const limit = Math.min(parseInt(sanitizedParams.limit || '50'), 100);
  const offset = parseInt(sanitizedParams.offset || '0');

  try {
    let query = client
      .from('gift_vouchers')
      .select('*', { count: 'exact' })
      .eq('partner_id', partnerId) // Use verified partnerId
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: vouchers, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch vouchers', error, { userId: user.id });
      throw error;
    }

    const transformedVouchers = (vouchers || []).map((v: any) => ({
      id: v.id,
      code: v.code,
      amount: Number(v.amount),
      recipientName: v.recipient_name,
      recipientEmail: v.recipient_email,
      recipientPhone: v.recipient_phone,
      senderName: v.sender_name,
      message: v.message,
      status: v.status,
      expiresAt: v.expires_at,
      redeemedAt: v.redeemed_at,
      createdAt: v.created_at,
    }));

    return NextResponse.json({
      vouchers: transformedVouchers,
      total: count || 0,
    });
  } catch (error) {
    logger.error('Failed to fetch vouchers', error, { userId: user.id });
    throw error;
  }
});

