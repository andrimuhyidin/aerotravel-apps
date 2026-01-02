/**
 * User Activity Feed API
 * GET /api/user/activity - Get recent activity for dashboard
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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const activities: ActivityItem[] = [];

  try {
    // Fetch recent bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, code, created_at, status, packages(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (bookings) {
      for (const booking of bookings) {
        const pkg = booking.packages as { name: string } | null;
        activities.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title:
            booking.status === 'paid'
              ? 'Booking Berhasil'
              : booking.status === 'completed'
                ? 'Trip Selesai'
                : 'Booking Dibuat',
          description: pkg?.name || `Booking ${booking.code}`,
          timestamp: booking.created_at,
        });
      }
    }

    // Fetch recent loyalty transactions
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
          timestamp: tx.created_at,
        });
      }
    }

    // Fetch recent reviews
    const { data: reviews } = await supabase
      .from('package_reviews')
      .select('id, rating, created_at, packages(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (reviews) {
      for (const review of reviews) {
        const pkg = review.packages as { name: string } | null;
        activities.push({
          id: `review-${review.id}`,
          type: 'review',
          title: 'Review Dikirim',
          description: `${pkg?.name || 'Paket Wisata'} - ${review.rating}⭐`,
          timestamp: review.created_at,
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
          timestamp: ref.created_at,
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

