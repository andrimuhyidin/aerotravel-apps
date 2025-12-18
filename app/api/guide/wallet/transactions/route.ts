/**
 * API: Guide Wallet Transactions (Enhanced)
 * GET /api/guide/wallet/transactions - Get transactions with filters, search, pagination
 * GET /api/guide/wallet/transactions/export - Export transactions to CSV
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
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

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // earning, withdraw_request, withdraw_approved, adjustment
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to'); // YYYY-MM-DD
  const search = searchParams.get('search'); // Search by description/reference
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const exportFormat = searchParams.get('export'); // csv

  const client = supabase as unknown as any;

  try {
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('id')
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!wallet) {
      return NextResponse.json({ transactions: [], total: 0, page: 1, limit });
    }

    const walletId = wallet.id as string;

    let query = client
      .from('guide_wallet_transactions')
      .select('id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at', { count: 'exact' })
      .eq('wallet_id', walletId);

    // Filter by type
    if (type) {
      query = query.eq('transaction_type', type);
    }

    // Filter by date range
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', fromDate.toISOString());
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }

    // Search by description
    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false });

    if (exportFormat === 'csv') {
      // Export all matching records
      const { data: allTransactions, error } = await query;

      if (error) {
        logger.error('Failed to export transactions', error, { walletId });
        return NextResponse.json({ error: 'Failed to export transactions' }, { status: 500 });
      }

      // Convert to CSV
      const headers = ['Date', 'Type', 'Amount', 'Balance Before', 'Balance After', 'Status', 'Description'];
      const rows = (allTransactions || []).map((t: {
        created_at: string;
        transaction_type: string;
        amount: number;
        balance_before: number;
        balance_after: number;
        status: string | null;
        description: string | null;
      }) => [
        new Date(t.created_at).toLocaleDateString('id-ID'),
        t.transaction_type,
        Number(t.amount || 0).toLocaleString('id-ID'),
        Number(t.balance_before || 0).toLocaleString('id-ID'),
        Number(t.balance_after || 0).toLocaleString('id-ID'),
        t.status || '',
        (t.description || '').replace(/,/g, ';'),
      ]);

      const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wallet-transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Paginated response
    const offset = (page - 1) * limit;
    const { data: transactions, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch transactions', error, { walletId });
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Group transactions by date
    const grouped: Record<string, Array<{
      id: string;
      transaction_type: string;
      amount: number;
      balance_before: number;
      balance_after: number;
      reference_type: string | null;
      reference_id: string | null;
      status: string | null;
      description: string | null;
      created_at: string;
    }>> = {};

    (transactions || []).forEach((t: {
      id: string;
      transaction_type: string;
      amount: number;
      balance_before: number;
      balance_after: number;
      reference_type: string | null;
      reference_id: string | null;
      status: string | null;
      description: string | null;
      created_at: string;
    }) => {
      const date = new Date(t.created_at);
      const dateKey = date.toISOString().split('T')[0];
      if (dateKey) {
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(t);
      }
    });

    return NextResponse.json({
      transactions: transactions || [],
      grouped,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    logger.error('Failed to fetch transactions', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
});

