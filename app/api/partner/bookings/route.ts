/**
 * API: Partner Bookings
 * GET /api/partner/bookings - List partner bookings
 * POST /api/partner/bookings - Create new booking
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!partnerId) {
    return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_code,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      total_amount,
      nta_total,
      status,
      customer_name,
      created_at,
      package:packages(name)
    `)
    .eq('mitra_id', partnerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch partner bookings', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = await request.json();

  const {
    partnerId,
    packageId,
    tripDate,
    adultPax,
    childPax = 0,
    infantPax = 0,
    customerName,
    customerPhone,
    customerEmail,
    paymentMethod = 'wallet',
    specialRequests,
  } = body;

  if (!partnerId || !packageId || !tripDate || !adultPax || !customerName || !customerPhone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get package pricing
  const { data: pkg } = (await supabase
    .from('packages')
    .select(`
      id,
      branch_id,
      prices:package_prices(
        min_pax,
        max_pax,
        price_publish,
        price_nta
      )
    `)
    .eq('id', packageId)
    .single()) as {
    data: {
      id: string;
      branch_id: string;
      prices: Array<{
        min_pax: number;
        max_pax: number;
        price_publish: number;
        price_nta: number;
      }> | null;
    } | null;
  };

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  // Calculate pricing
  const prices = pkg.prices as Array<{
    min_pax: number;
    max_pax: number;
    price_publish: number;
    price_nta: number;
  }>;
  const priceTier = prices?.find((p) => p.min_pax <= adultPax && p.max_pax >= adultPax) || prices?.[0];

  if (!priceTier) {
    return NextResponse.json({ error: 'No pricing available for this pax count' }, { status: 400 });
  }

  const pricePerAdult = Number(priceTier.price_publish);
  const ntaPricePerAdult = Number(priceTier.price_nta);
  const childPercent = 0.5;

  const subtotal = adultPax * pricePerAdult + childPax * pricePerAdult * childPercent;
  const ntaTotal = adultPax * ntaPricePerAdult + childPax * ntaPricePerAdult * childPercent;

  // Generate booking code
  const { data: bookingCodeData } = await supabase.rpc('generate_booking_code');
  const bookingCode = bookingCodeData || `BK-${Date.now()}`;

  // Create booking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: booking, error: bookingError } = (await (supabase as any)
    .from('bookings')
    .insert({
      branch_id: pkg.branch_id,
      package_id: packageId,
      booking_code: bookingCode,
      trip_date: tripDate,
      source: 'mitra',
      mitra_id: partnerId,
      adult_pax: adultPax,
      child_pax: childPax,
      infant_pax: infantPax,
      price_per_adult: pricePerAdult,
      price_per_child: pricePerAdult * childPercent,
      subtotal,
      total_amount: subtotal,
      nta_price_per_adult: ntaPricePerAdult,
      nta_total: ntaTotal,
      status: paymentMethod === 'wallet' ? 'paid' : 'pending_payment',
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      special_requests: specialRequests,
    } as Record<string, unknown>)
    .select('id, booking_code')
    .single()) as {
      data: { id: string; booking_code: string } | null;
      error: Error | null;
    };

  if (bookingError) {
    logger.error('Create partner booking failed', bookingError);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  if (!booking) {
    logger.error('Create partner booking failed - no booking returned');
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  logger.info('Partner booking created', { partnerId, bookingId: booking.id, bookingCode: booking.booking_code });

  return NextResponse.json({
    success: true,
    data: {
      id: booking.id,
      bookingCode: booking.booking_code,
      ntaTotal,
      publishTotal: subtotal,
    },
  });
});
