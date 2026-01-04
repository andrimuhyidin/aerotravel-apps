/**
 * API: Get Withdrawal History
 * GET /api/partner/wallet/withdraw/history
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
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

  const searchParams = sanitizeSearchParams(request);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    // Build query
    let query = client
      .from('mitra_withdrawal_requests')
      .select(
        `
        id,
        amount,
        bank_name,
        account_number,
        account_name,
        status,
        rejection_reason,
        processed_by,
        processed_at,
        notes,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .eq('mitra_id', partnerId);

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Order by created_at (newest first)
    query = query.order('created_at', { ascending: false });

    // Paginate
    const { data: withdrawals, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch withdrawal history', error, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch withdrawal history' },
        { status: 500 }
      );
    }

    // Transform data
    const formattedWithdrawals = (withdrawals || []).map((w: any) => ({
      id: w.id,
      amount: Number(w.amount),
      bankName: w.bank_name,
      accountNumber: w.account_number,
      accountName: w.account_name,
      status: w.status,
      rejectionReason: w.rejection_reason || null,
      processedAt: w.processed_at || null,
      notes: w.notes || null,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }));

    return NextResponse.json({
      withdrawals: formattedWithdrawals,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch withdrawal history', error, {
      userId: user.id,
    });
    throw error;
  }
});

