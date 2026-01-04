/**
 * User Activity Feed API
 * GET /api/user/activity - Get recent activity for dashboard
 * 
 * Note: Customer bookings are linked via customer_email (not user_id)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type ActivityItem = {
  id: string;
  type: 'booking' | 'points' | 'review' | 'referral';
  title: string;
  description: string;
  timestamp: string;
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/user/activity');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const activities: ActivityItem[] = [];

  try {
    // Fetch recent bookings - use customer_email OR created_by
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_code, created_at, status, package_id')
      .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (bookings && bookings.length > 0) {
      // Fetch package names for bookings
      const packageIds = [...new Set(bookings.map(b => b.package_id).filter(Boolean))];
      let packagesMap: Record<string, string> = {};
      
      if (packageIds.length > 0) {
        const { data: packages } = await supabase
          .from('packages')
          .select('id, name')
          .in('id', packageIds);
        
        if (packages) {
          packagesMap = Object.fromEntries(packages.map(p => [p.id, p.name]));
        }
      }

      for (const booking of bookings) {
        const packageName = booking.package_id ? packagesMap[booking.package_id] : null;
        activities.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title:
            booking.status === 'paid'
              ? 'Booking Berhasil'
              : booking.status === 'completed'
                ? 'Trip Selesai'
                : 'Booking Dibuat',
          description: packageName || `Booking ${booking.booking_code}`,
          timestamp: booking.created_at || new Date().toISOString(),
        });
      }
    }

    // Fetch recent loyalty transactions - user_id is correct here (loyalty_points table)
    const { data: loyaltyTx } = await supabase
      .from('loyalty_transactions')
      .select('id, transaction_type, points, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (loyaltyTx) {
      for (const tx of loyaltyTx) {
        const isEarned = tx.points > 0;
        activities.push({
          id: `points-${tx.id}`,
          type: 'points',
          title: isEarned ? 'Poin Didapat' : 'Poin Digunakan',
          description:
            tx.description ||
            `${isEarned ? '+' : ''}${tx.points.toLocaleString('id-ID')} AeroPoints`,
          timestamp: tx.created_at || new Date().toISOString(),
        });
      }
    }

    // Fetch recent reviews - package_reviews uses reviewer_id
    const { data: reviews } = await supabase
      .from('package_reviews')
      .select('id, overall_rating, created_at, package_id')
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (reviews && reviews.length > 0) {
      // Fetch package names for reviews
      const reviewPackageIds = [...new Set(reviews.map(r => r.package_id).filter(Boolean))];
      let reviewPackagesMap: Record<string, string> = {};
      
      if (reviewPackageIds.length > 0) {
        const { data: packages } = await supabase
          .from('packages')
          .select('id, name')
          .in('id', reviewPackageIds);
        
        if (packages) {
          reviewPackagesMap = Object.fromEntries(packages.map(p => [p.id, p.name]));
        }
      }

      for (const review of reviews) {
        const packageName = review.package_id ? reviewPackagesMap[review.package_id] : null;
        activities.push({
          id: `review-${review.id}`,
          type: 'review',
          title: 'Review Dikirim',
          description: `${packageName || 'Paket Wisata'} - ${review.overall_rating}⭐`,
          timestamp: review.created_at || new Date().toISOString(),
        });
      }
    }

    // Fetch referral rewards
    const { data: referrals } = await supabase
      .from('loyalty_transactions')
      .select('id, points, created_at')
      .eq('user_id', user.id)
      .eq('transaction_type', 'earn_referral')
      .order('created_at', { ascending: false })
      .limit(3);

    if (referrals) {
      for (const ref of referrals) {
        activities.push({
          id: `referral-${ref.id}`,
          type: 'referral',
          title: 'Bonus Referral',
          description: `Teman kamu sudah booking! +${ref.points.toLocaleString('id-ID')} poin`,
          timestamp: ref.created_at || new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    logger.error('Failed to fetch activity components', error);
    // Continue with whatever we have
  }

  // Sort by timestamp and limit
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return NextResponse.json({
    activities: activities.slice(0, limit),
  });
});
