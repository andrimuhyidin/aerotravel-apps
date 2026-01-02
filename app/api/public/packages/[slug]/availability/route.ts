/**
 * Public Package Availability API
 * GET /api/public/packages/[slug]/availability - Get package availability
 */

import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { slug } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  logger.info('GET /api/public/packages/[slug]/availability', { slug, fromDate, toDate });

  const supabase = await createClient();

  // Get package
  const { data: pkg } = await supabase
    .from('packages')
    .select('id, max_pax')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!pkg) {
    return NextResponse.json(
      { error: 'Package not found' },
      { status: 404 }
    );
  }

  const packageId = pkg.id;
  const maxPax = pkg.max_pax || 20;

  // Date range
  const from = fromDate ? parseISO(fromDate) : new Date();
  const to = toDate ? parseISO(toDate) : addDays(new Date(), 90);

  // Get existing bookings for this package in date range
  const { data: bookings } = await supabase
    .from('bookings')
    .select('trip_date, adult_pax, child_pax, infant_pax')
    .eq('package_id', packageId)
    .gte('trip_date', format(from, 'yyyy-MM-dd'))
    .lte('trip_date', format(to, 'yyyy-MM-dd'))
    .in('status', ['pending', 'confirmed', 'paid']);

  // Calculate booked pax per date
  const bookedByDate: Record<string, number> = {};
  (bookings || []).forEach((b) => {
    const dateStr = format(new Date(b.trip_date), 'yyyy-MM-dd');
    const pax = (b.adult_pax || 0) + (b.child_pax || 0) + (b.infant_pax || 0);
    bookedByDate[dateStr] = (bookedByDate[dateStr] || 0) + pax;
  });

  // Generate availability for each day
  const days = eachDayOfInterval({ start: from, end: to });
  const availability = days.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const booked = bookedByDate[dateStr] || 0;
    const remaining = maxPax - booked;

    let status: 'available' | 'limited' | 'full' = 'available';
    if (remaining <= 0) {
      status = 'full';
    } else if (remaining <= maxPax * 0.3) {
      status = 'limited';
    }

    return {
      date: dateStr,
      available: remaining > 0,
      remainingSlots: Math.max(0, remaining),
      status,
    };
  });

  return NextResponse.json({ availability });
});

