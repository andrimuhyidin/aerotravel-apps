/**
 * API: Package Quick Info
 * GET /api/partner/packages/:id/quick-info
 * 
 * Returns lightweight package data for booking flow:
 * - Name, destination, duration
 * - Price tiers (NTA + Publish)
 * - Availability summary
 * - Ratings & reviews
 * - Today's booking count (urgency)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type Params = {
  id: string;
};

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Params> }) => {
    const { id: packageId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = supabase as unknown as any;

    try {
      // Get package with minimal data
      const { data: pkg, error } = await client
        .from('packages')
        .select(`
          id,
          name,
          destination,
          duration_days,
          duration_nights,
          thumbnail_url,
          booking_count_today,
          last_booked_at,
          is_active,
          prices:package_prices(
            min_pax,
            max_pax,
            price_publish,
            price_nta
          )
        `)
        .eq('id', packageId)
        .single();

      if (error || !pkg) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      }

      if (!pkg.is_active) {
        return NextResponse.json({ error: 'Package is not active' }, { status: 400 });
      }

      // Get ratings summary (if ratings table exists)
      let ratingsData = null;
      try {
        const { data: ratings } = await client
          .from('package_ratings')
          .select('rating')
          .eq('package_id', packageId);

        if (ratings && ratings.length > 0) {
          const avgRating =
            ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
            ratings.length;
          ratingsData = {
            average: Math.round(avgRating * 10) / 10,
            count: ratings.length,
          };
        }
      } catch (e) {
        // Ratings table might not exist yet
        logger.warn('Failed to fetch ratings', e, { packageId });
      }

      // Format pricing tiers for easy consumption
      const pricingTiers = (pkg.prices || []).map((p: any) => ({
        minPax: p.min_pax,
        maxPax: p.max_pax,
        publishPrice: Number(p.price_publish || 0),
        ntaPrice: Number(p.price_nta || 0),
        margin: Number(p.price_publish || 0) - Number(p.price_nta || 0),
      }));

      // Availability status (simple calculation)
      const availabilityStatus =
        pkg.booking_count_today === 0
          ? 'high'
          : pkg.booking_count_today < 5
          ? 'medium'
          : 'low';

      const quickInfo = {
        id: pkg.id,
        name: pkg.name,
        destination: pkg.destination,
        duration: {
          days: pkg.duration_days,
          nights: pkg.duration_nights,
          label: `${pkg.duration_days}D${pkg.duration_nights}N`,
        },
        thumbnailUrl: pkg.thumbnail_url,
        pricingTiers,
        ratings: ratingsData,
        urgency: {
          bookingCountToday: pkg.booking_count_today || 0,
          lastBookedAt: pkg.last_booked_at,
        },
        availability: {
          status: availabilityStatus,
          label:
            availabilityStatus === 'high'
              ? 'Banyak tersedia'
              : availabilityStatus === 'medium'
              ? 'Terbatas'
              : 'Segera habis',
        },
      };

      return NextResponse.json({ package: quickInfo });
    } catch (error) {
      logger.error('Failed to fetch package quick info', error, {
        userId: user.id,
        packageId,
      });
      throw error;
    }
  }
);

