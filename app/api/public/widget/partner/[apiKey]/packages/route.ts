/**
 * API: Public Widget Packages
 * GET /api/public/widget/partner/[apiKey]/packages - Get packages for widget
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ apiKey: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { apiKey } = await params;

  const client = supabase as unknown as any;

  try {
    // Verify API key and get partner ID
    const { data: settings, error: settingsError } = await client
      .from('partner_whitelabel_settings')
      .select('partner_id, widget_enabled, widget_config')
      .eq('widget_api_key', apiKey)
      .eq('widget_enabled', true)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get packages (respecting widget config)
    const config = settings.widget_config || {};
    const showAllPackages = config.showAllPackages ?? true;
    const packageIds = config.packageIds || [];

    let query = client
      .from('packages')
      .select(`
        id,
        slug,
        name,
        destination,
        province,
        duration_days,
        duration_nights,
        thumbnail_url,
        prices:package_prices(min_pax, max_pax, price_publish)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter by package IDs if configured
    if (!showAllPackages && packageIds.length > 0) {
      query = query.in('id', packageIds);
    }

    const { data: packages, error: packagesError } = await query;

    if (packagesError) {
      logger.error('Failed to fetch widget packages', packagesError, {
        apiKey: apiKey.substring(0, 10) + '...',
      });
      throw packagesError;
    }

    // Format packages for widget
    const formattedPackages = (packages || []).map((pkg: any) => ({
      id: pkg.id,
      slug: pkg.slug,
      name: pkg.name,
      destination: pkg.destination,
      province: pkg.province,
      durationDays: pkg.duration_days,
      durationNights: pkg.duration_nights,
      thumbnailUrl: pkg.thumbnail_url,
      priceRange: pkg.prices && pkg.prices.length > 0
        ? {
            min: Math.min(...pkg.prices.map((p: any) => Number(p.price_publish || 0))),
            max: Math.max(...pkg.prices.map((p: any) => Number(p.price_publish || 0))),
          }
        : null,
    }));

    return NextResponse.json({
      packages: formattedPackages,
      config: {
        primaryColor: config.primaryColor || '#ea580c',
        secondaryColor: config.secondaryColor || '#fb923c',
      },
    });
  } catch (error) {
    logger.error('Failed to get widget packages', error);
    throw error;
  }
});

