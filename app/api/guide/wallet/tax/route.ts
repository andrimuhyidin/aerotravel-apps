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

    // Get all earnings for the year - filter by check_out_at from trip_guides for date consistency
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    // First, get trip IDs with check_out_at in this year
    const { data: yearTrips } = await client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .not('check_out_at', 'is', null)
      .gte('check_out_at', yearStart.toISOString())
      .lte('check_out_at', yearEnd.toISOString());

    const yearTripIds = yearTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

    const { data: earnings } =
      yearTripIds.length > 0
        ? await client
            .from('guide_wallet_transactions')
            .select('amount, created_at')
            .eq('wallet_id', walletId)
            .eq('transaction_type', 'earning')
            .eq('reference_type', 'trip')
            .in('reference_id', yearTripIds)
        : { data: [] };

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

      // Get month earnings - filter by check_out_at
      const { data: monthTrips } = await client
        .from('trip_guides')
        .select('trip_id')
        .eq('guide_id', user.id)
        .not('check_out_at', 'is', null)
        .gte('check_out_at', monthStart.toISOString())
        .lte('check_out_at', monthEnd.toISOString());

      const monthTripIds = monthTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

      const { data: monthEarnings } =
        monthTripIds.length > 0
          ? await client
              .from('guide_wallet_transactions')
              .select('amount')
              .eq('wallet_id', walletId)
              .eq('transaction_type', 'earning')
              .eq('reference_type', 'trip')
              .in('reference_id', monthTripIds)
          : { data: [] };

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

