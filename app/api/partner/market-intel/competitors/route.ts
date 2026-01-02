/**
 * API: Competitor Prices
 * GET /api/partner/market-intel/competitors - List competitor prices
 * POST /api/partner/market-intel/competitors - Add competitor price
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const addCompetitorSchema = z.object({
  competitorName: z.string().min(2),
  productName: z.string().min(2),
  productUrl: z.string().url().optional().nullable(),
  currentPrice: z.number().positive(),
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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    const { data: prices, error } = await client
      .from('partner_competitor_prices')
      .select('*')
      .eq('partner_id', partnerId)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch competitor prices', error, { userId: user.id });
      throw error;
    }

    const transformedPrices = (prices || []).map((p: any) => {
      const priceChange = p.previous_price
        ? Number(p.current_price) - Number(p.previous_price)
        : 0;
      const priceChangePercent = p.previous_price
        ? (priceChange / Number(p.previous_price)) * 100
        : 0;

      // For demo, assume our_price is 10% lower on average
      const ourPrice = Number(p.current_price) * 0.9;
      const priceDifference = ourPrice - Number(p.current_price);
      const priceDifferencePercent = (priceDifference / Number(p.current_price)) * 100;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (priceChange > 0) trend = 'up';
      else if (priceChange < 0) trend = 'down';

      return {
        id: p.id,
        competitorName: p.competitor_name,
        productName: p.product_name,
        currentPrice: Number(p.current_price),
        previousPrice: p.previous_price ? Number(p.previous_price) : null,
        priceChange,
        priceChangePercent,
        lastUpdated: p.updated_at,
        ourPrice,
        priceDifference,
        priceDifferencePercent,
        trend,
      };
    });

    return NextResponse.json({ prices: transformedPrices });
  } catch (error) {
    logger.error('Failed to fetch competitor prices', error, { userId: user.id });
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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const sanitizedBody = sanitizeRequestBody(body, { strings: ['competitorName', 'productName'], urls: ['productUrl'] });
  const validation = addCompetitorSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const { competitorName, productName, productUrl, currentPrice } = validation.data;

  try {
    const { data: price, error } = await client
      .from('partner_competitor_prices')
      .insert({
        partner_id: partnerId,
        competitor_name: competitorName,
        product_name: productName,
        product_url: productUrl || null,
        current_price: currentPrice,
      })
      .select('id')
      .single();

    if (error || !price) {
      logger.error('Failed to add competitor price', error, { userId: user.id });
      throw error;
    }

    return NextResponse.json({ success: true, priceId: price.id });
  } catch (error) {
    logger.error('Failed to add competitor price', error, { userId: user.id });
    throw error;
  }
});

