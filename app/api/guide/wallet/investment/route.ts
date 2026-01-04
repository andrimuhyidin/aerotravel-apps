/**
 * API: Guide Wallet Investment Suggestions
 * GET /api/guide/wallet/investment - Get investment suggestions and ROI calculator
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
  const amount = parseFloat(searchParams.get('amount') || '0');
  const period = parseInt(searchParams.get('period') || '12', 10); // months

  const client = supabase as unknown as any;

  try {
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('balance')
      .eq('guide_id', user.id)
      .maybeSingle();

    const balance = Number(wallet?.balance || 0);
    const investmentAmount = amount > 0 ? amount : balance;

    if (investmentAmount <= 0) {
      return NextResponse.json({
        suggestions: [],
        calculator: null,
      });
    }

    // Investment suggestions
    const suggestions = [
      {
        type: 'deposito',
        name: 'Deposito',
        description: 'Investasi aman dengan bunga tetap',
        interestRate: 6, // 6% per year
        minAmount: 1000000,
        risk: 'low' as const,
        liquidity: 'medium' as const,
      },
      {
        type: 'reksadana',
        name: 'Reksadana Pasar Uang',
        description: 'Likuiditas tinggi, risiko rendah',
        interestRate: 5.5, // 5.5% per year
        minAmount: 100000,
        risk: 'low' as const,
        liquidity: 'high' as const,
      },
      {
        type: 'emas',
        name: 'Emas',
        description: 'Investasi fisik, nilai stabil',
        interestRate: 4, // 4% per year (historical average)
        minAmount: 500000,
        risk: 'low' as const,
        liquidity: 'medium' as const,
      },
    ];

    // ROI Calculator for selected amount and period
    const calculator = suggestions.map((s) => {
      const monthlyRate = s.interestRate / 100 / 12;
      const futureValue = investmentAmount * Math.pow(1 + monthlyRate, period);
      const profit = futureValue - investmentAmount;
      const roi = (profit / investmentAmount) * 100;

      return {
        ...s,
        investmentAmount: Math.round(investmentAmount),
        period,
        futureValue: Math.round(futureValue),
        profit: Math.round(profit),
        roi: Math.round(roi * 100) / 100,
      };
    });

    return NextResponse.json({
      suggestions,
      calculator,
      currentBalance: Math.round(balance),
    });
  } catch (error) {
    logger.error('Failed to fetch investment suggestions', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
});

