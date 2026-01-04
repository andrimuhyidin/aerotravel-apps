/**
 * Public Package Detail API
 * GET /api/public/packages/[slug] - Get package by slug
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { slug } = await context.params;
  
  logger.info('GET /api/public/packages/[slug]', { slug });

  const supabase = await createClient();

  const { data: pkg, error } = await supabase
    .from('packages')
    .select(`
      id,
      slug,
      name,
      destination,
      province,
      description,
      duration_days,
      duration_nights,
      min_pax,
      max_pax,
      inclusions,
      exclusions,
      itinerary,
      meeting_point,
      created_at,
      package_prices (
        min_pax,
        max_pax,
        price_publish,
        price_nta
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !pkg) {
    logger.warn('Package not found', { slug, error });
    return NextResponse.json(
      { error: 'Package not found' },
      { status: 404 }
    );
  }

  const prices = pkg.package_prices || [];
  const lowestPrice = prices[0];
  const adultPrice = lowestPrice?.price_publish || 0;

  const transformedPackage = {
    id: pkg.id,
    slug: pkg.slug,
    name: pkg.name,
    destination: pkg.destination,
    province: pkg.province,
    description: pkg.description,
    duration: {
      days: pkg.duration_days,
      nights: pkg.duration_nights,
      label: `${pkg.duration_days}D${pkg.duration_nights}N`,
    },
    minPax: pkg.min_pax,
    maxPax: pkg.max_pax,
    inclusions: pkg.inclusions || [],
    exclusions: pkg.exclusions || [],
    itinerary: pkg.itinerary || [],
    meetingPoint: pkg.meeting_point || null,
    pricing: {
      adultPrice: adultPrice,
      // Child price is typically 75% of adult price
      childPrice: Math.round(adultPrice * 0.75),
      // Infant price is typically free
      infantPrice: 0,
    },
    pricingTiers: prices.map((p: { min_pax: number; max_pax: number; price_publish: number; price_nta: number }) => ({
      minPax: p.min_pax,
      maxPax: p.max_pax,
      adultPrice: p.price_publish,
      childPrice: Math.round(p.price_publish * 0.75),
      infantPrice: 0,
    })),
  };

  return NextResponse.json({ package: transformedPackage });
});

