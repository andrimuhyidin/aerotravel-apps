/**
 * API: Market Intel Summary
 * GET /api/partner/market-intel/summary - Get market summary stats
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    // Get competitor prices
    const { data: prices, error } = await client
      .from('partner_competitor_prices')
      .select('current_price')
      .eq('partner_id', partnerId);

    if (error) {
      logger.error('Failed to fetch market summary', error, { userId: user.id });
      throw error;
    }

    const totalTracked = prices?.length || 0;
    
    if (totalTracked === 0) {
      return NextResponse.json({
        totalTracked: 0,
        averageMarketPrice: 0,
        ourAveragePrice: 0,
        pricePosition: 'at',
        competitiveIndex: 50,
        alertsCount: 0,
      });
    }

    const totalPrice = (prices || []).reduce(
      (sum: number, p: { current_price: number }) => sum + Number(p.current_price),
      0
    );
    const averageMarketPrice = totalPrice / totalTracked;

    // For demo, assume our average is 10% lower
    const ourAveragePrice = averageMarketPrice * 0.9;

    let pricePosition: 'below' | 'at' | 'above' = 'at';
    const difference = (ourAveragePrice - averageMarketPrice) / averageMarketPrice;
    if (difference < -0.05) pricePosition = 'below';
    else if (difference > 0.05) pricePosition = 'above';

    // Competitive index: 0-100 where higher is better (we're more competitive)
    const competitiveIndex = Math.min(100, Math.max(0, 50 - difference * 100));

    return NextResponse.json({
      totalTracked,
      averageMarketPrice: Math.round(averageMarketPrice),
      ourAveragePrice: Math.round(ourAveragePrice),
      pricePosition,
      competitiveIndex: Math.round(competitiveIndex),
      alertsCount: 0, // Can implement price change alerts
    });
  } catch (error) {
    logger.error('Failed to fetch market summary', error, { userId: user.id });
    throw error;
  }
});

