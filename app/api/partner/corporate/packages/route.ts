/**
 * API: Corporate Packages Listing
 * GET /api/partner/corporate/packages - List packages for corporate employees
 *
 * Returns packages available to corporate users with simplified filtering
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { getCorporateClient } from '@/lib/corporate';
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

  // Verify corporate access
  const corporate = await getCorporateClient(user.id);
  if (!corporate) {
    return NextResponse.json({ error: 'Corporate access required' }, { status: 403 });
  }

  // Get query params with sanitization
  const searchParams = sanitizeSearchParams(request);
  const search = searchParams.get('search') || '';
  const destination = searchParams.get('destination');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
  const offset = (page - 1) * limit;

  try {
    // Build packages query
    let query = supabase
      .from('packages')
      .select(
        `
        id,
        name,
        slug,
        description,
        short_description,
        destination,
        package_type,
        duration_days,
        duration_nights,
        min_pax,
        max_pax,
        price_per_adult,
        price_per_child,
        nta_price_per_adult,
        nta_price_per_child,
        includes,
        excludes,
        highlights,
        main_image_url,
        gallery_urls,
        is_active,
        is_published
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,destination.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (destination) {
      query = query.ilike('destination', `%${destination}%`);
    }

    if (minPrice) {
      query = query.gte('nta_price_per_adult', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('nta_price_per_adult', parseFloat(maxPrice));
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: packages, count, error } = await query;

    if (error) {
      logger.error('Failed to fetch packages', error, { corporateId: corporate.id });
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }

    // Format packages for response
    const formattedPackages = (packages || []).map((pkg) => {
      const p = pkg as {
        id: string;
        name: string;
        slug: string;
        description: string;
        short_description: string | null;
        destination: string;
        package_type: string;
        duration_days: number;
        duration_nights: number;
        min_pax: number;
        max_pax: number;
        price_per_adult: number;
        price_per_child: number;
        nta_price_per_adult: number;
        nta_price_per_child: number;
        includes: string[] | null;
        excludes: string[] | null;
        highlights: string[] | null;
        main_image_url: string | null;
        gallery_urls: string[] | null;
      };

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.short_description || p.description?.substring(0, 200),
        destination: p.destination,
        packageType: p.package_type,
        duration: `${p.duration_days}D${p.duration_nights}N`,
        durationDays: p.duration_days,
        durationNights: p.duration_nights,
        minPax: p.min_pax,
        maxPax: p.max_pax,
        pricePerAdult: Number(p.nta_price_per_adult || p.price_per_adult),
        pricePerChild: Number(p.nta_price_per_child || p.price_per_child),
        includes: p.includes || [],
        highlights: p.highlights || [],
        mainImage: p.main_image_url,
        galleryImages: p.gallery_urls || [],
      };
    });

    return NextResponse.json({
      packages: formattedPackages,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: offset + formattedPackages.length < (count || 0),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch corporate packages', error, {
      corporateId: corporate.id,
      userId: user.id,
    });
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
});

