/**
 * API: Partner Wallet Transactions
 * GET /api/partner/wallet/transactions - Get wallet transactions with filters
 * GET /api/partner/wallet/transactions?export=csv - Export transactions to CSV
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  // Sanitize search params
  const sanitizedParams = sanitizeSearchParams(searchParams);
  const type = sanitizedParams.type || null; // topup, booking_debit, refund, etc.
  const from = sanitizedParams.from || null; // YYYY-MM-DD
  const to = sanitizedParams.to || null; // YYYY-MM-DD
  const search = sanitizedParams.search || null; // Search by description/booking_code
  const page = parseInt(sanitizedParams.page || '1');
  const limit = Math.min(parseInt(sanitizedParams.limit || '20'), 100); // Max 100
  const offset = (page - 1) * limit;
  const exportFormat = sanitizedParams.export || null; // csv

  const client = supabase as unknown as any;

  try {
    // Get wallet ID using verified partnerId
    const { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select('id')
      .eq('mitra_id', partnerId)
      .single();

    if (walletError || !wallet) {
      // If wallet doesn't exist, return empty array instead of 404
      // This allows the UI to work even if wallet hasn't been initialized
      logger.info('Wallet not found for partner', { userId: user.id });
      return NextResponse.json({
        transactions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Build query
    let query = client
      .from('mitra_wallet_transactions')
      .select(
        `
        id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        status,
        external_id,
        xendit_invoice_id,
        booking_id,
        booking:bookings(booking_code, customer_name),
        created_at,
        completed_at
      `,
        { count: 'exact' }
      )
      .eq('wallet_id', wallet.id);

    // Filter by type
    if (type && type !== 'all') {
      query = query.eq('transaction_type', type);
    }

    // Filter by date range
    if (from) {
      query = query.gte('created_at', `${from}T00:00:00.000Z`);
    }
    if (to) {
      query = query.lte('created_at', `${to}T23:59:59.999Z`);
    }

    // Search filter
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,booking:bookings.booking_code.ilike.%${search}%`
      );
    }

    // Order by date (newest first)
    query = query.order('created_at', { ascending: false });

    // Export CSV
    if (exportFormat === 'csv') {
      const { data: allTransactions, error } = await query;

      if (error) {
        logger.error('Failed to export transactions', error, {
          walletId: wallet.id,
        });
        return NextResponse.json(
          { error: 'Failed to export transactions' },
          { status: 500 }
        );
      }

      // Convert to CSV
      const headers = [
        'Date',
        'Type',
        'Amount',
        'Balance Before',
        'Balance After',
        'Status',
        'Description',
        'Booking Code',
      ];
      const rows = (allTransactions || []).map(
        (t: {
          created_at: string;
          transaction_type: string;
          amount: number;
          balance_before: number | null;
          balance_after: number | null;
          status: string | null;
          description: string | null;
          booking: { booking_code: string | null } | null;
        }) => [
          new Date(t.created_at).toLocaleDateString('id-ID'),
          t.transaction_type,
          Number(t.amount || 0).toLocaleString('id-ID'),
          Number(t.balance_before || 0).toLocaleString('id-ID'),
          Number(t.balance_after || 0).toLocaleString('id-ID'),
          t.status || '',
          (t.description || '').replace(/,/g, ';'),
          t.booking?.booking_code || '',
        ]
      );

      const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="wallet-transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Paginated response
    const { data: transactions, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      logger.error('Failed to fetch transactions', error, {
        walletId: wallet.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Transform data
    const transformed = (transactions || []).map((t: any) => ({
      id: t.id,
      type: t.transaction_type,
      amount: Number(t.amount),
      balanceBefore: t.balance_before ? Number(t.balance_before) : null,
      balanceAfter: t.balance_after ? Number(t.balance_after) : null,
      description: t.description || '',
      status: t.status || 'completed',
      bookingCode: t.booking?.booking_code || null,
      bookingCustomerName: t.booking?.customer_name || null,
      createdAt: t.created_at,
      completedAt: t.completed_at || null,
    }));

    return NextResponse.json({
      transactions: transformed,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch wallet transactions', error, {
      userId: user.id,
    });
    throw error;
  }
});

