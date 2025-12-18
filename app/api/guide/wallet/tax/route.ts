/**
 * API: Guide Wallet Tax Calculation
 * GET /api/guide/wallet/tax - Calculate tax estimation and annual summary
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
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

  const client = supabase as unknown as any;

  try {
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('id')
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!wallet) {
      return NextResponse.json({
        year,
        totalEarnings: 0,
        estimatedTax: 0,
        taxRate: 0,
        netAfterTax: 0,
        monthlyBreakdown: [],
      });
    }

    const walletId = wallet.id as string;

    // Get all earnings for the year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const { data: earnings } = await client
      .from('guide_wallet_transactions')
      .select('amount, created_at')
      .eq('wallet_id', walletId)
      .eq('transaction_type', 'earning')
      .gte('created_at', yearStart.toISOString())
      .lte('created_at', yearEnd.toISOString());

    const totalEarnings = (earnings || []).reduce(
      (sum: number, e: { amount: number }) => sum + (Number(e.amount) || 0),
      0,
    );

    // Tax calculation (simplified PPh 21 - 5% for freelance/contractor)
    // PTKP (Penghasilan Tidak Kena Pajak) = Rp 54,000,000 per year
    const PTKP = 54000000;
    const taxableIncome = Math.max(0, totalEarnings - PTKP);
    const taxRate = 0.05; // 5% for freelance
    const estimatedTax = Math.round(taxableIncome * taxRate);
    const netAfterTax = totalEarnings - estimatedTax;

    // Monthly breakdown
    const monthlyBreakdown: Array<{ month: number; earnings: number; tax: number }> = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      const { data: monthEarnings } = await client
        .from('guide_wallet_transactions')
        .select('amount')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'earning')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const monthTotal = (monthEarnings || []).reduce(
        (sum: number, e: { amount: number }) => sum + (Number(e.amount) || 0),
        0,
      );

      const monthTaxable = Math.max(0, monthTotal - PTKP / 12);
      const monthTax = Math.round(monthTaxable * taxRate);

      monthlyBreakdown.push({
        month: month + 1,
        earnings: Math.round(monthTotal),
        tax: monthTax,
      });
    }

    return NextResponse.json({
      year,
      totalEarnings: Math.round(totalEarnings),
      estimatedTax: Math.round(estimatedTax),
      taxRate: taxRate * 100,
      netAfterTax: Math.round(netAfterTax),
      monthlyBreakdown,
      ptkp: PTKP,
    });
  } catch (error) {
    logger.error('Failed to calculate tax', error, { guideId: user.id, year });
    return NextResponse.json({ error: 'Failed to calculate tax' }, { status: 500 });
  }
});

