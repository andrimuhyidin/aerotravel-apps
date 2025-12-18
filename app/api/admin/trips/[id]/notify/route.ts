/**
 * API: Admin Trip Notifications
 * POST /api/admin/trips/[id]/notify
 *
 * Broadcast WhatsApp notifications to all passengers of a trip
 * Body: { type: 'h_minus_one' | 'h_day' | 'post_trip', surveyLink?: string }
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
    sendHDayReminder,
    sendHMinusOneReminder,
    sendPostTripMessage,
} from '@/lib/integrations/whatsapp-trip-notifications';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: tripId } = await context.params;
  const body = (await request.json()) as {
    type?: 'h_minus_one' | 'h_day' | 'post_trip';
    surveyLink?: string;
  };

  const { type } = body;

  if (!type || !['h_minus_one', 'h_day', 'post_trip'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Get trip details
  const { data: trip, error: tripError } = await client
    .from('trips')
    .select(
      `
      id,
      trip_code,
      trip_date,
      departure_time,
      documentation_url,
      package:packages(name)
    `
    )
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    logger.error('Trip not found for notification', tripError, { tripId });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Get assigned guide(s)
  const { data: guideAssignments } = await client
    .from('trip_guides')
    .select(
      `
      guide:users(full_name, phone)
    `
    )
    .eq('trip_id', tripId)
    .limit(1);

  const leadGuide = guideAssignments?.[0]?.guide as
    | { full_name: string | null; phone: string | null }
    | null
    | undefined;

  // Get all passengers for this trip
  const { data: bookingIdsData } = await client
    .from('trip_bookings')
    .select('booking_id')
    .eq('trip_id', tripId);

  if (!bookingIdsData || bookingIdsData.length === 0) {
    return NextResponse.json({ error: 'No bookings found for this trip' }, { status: 404 });
  }

  const bookingIds = bookingIdsData.map((b: any) => b.booking_id) as string[];

  const { data: passengers } = await client
    .from('booking_passengers')
    .select('id, full_name, phone, booking:bookings(customer_phone)')
    .in('booking_id', bookingIds);

  if (!passengers || passengers.length === 0) {
    return NextResponse.json({ error: 'No passengers found' }, { status: 404 });
  }

  // Default meeting point (can be made dynamic later)
  const meetingPoint = 'Dermaga Ketapang';

  const tripInfo = {
    tripCode: (trip.trip_code as string) ?? 'Trip',
    tripDate: (trip.trip_date as string) ?? '',
    departureTime: (trip.departure_time as string | null) ?? null,
    meetingPoint,
    guideName: leadGuide?.full_name ?? null,
    guidePhone: leadGuide?.phone ?? null,
    packageName: (trip.package as { name: string | null } | null)?.name ?? null,
    documentationUrl: (trip.documentation_url as string | null) ?? null,
  };

  let sent = 0;
  let failed = 0;

  for (const pax of passengers) {
    const phone =
      (pax.phone as string | null) ??
      ((pax.booking as { customer_phone: string | null } | null)?.customer_phone ?? null);

    if (!phone) {
      failed++;
      continue;
    }

    // Normalize phone number (remove +, spaces, ensure starts with country code)
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^\+/, '').replace(/^0/, '62');

    let result: { success: boolean; messageId?: string };

    switch (type) {
      case 'h_minus_one':
        result = await sendHMinusOneReminder(normalizedPhone, tripInfo);
        break;
      case 'h_day':
        result = await sendHDayReminder(normalizedPhone, tripInfo);
        break;
      case 'post_trip':
        result = await sendPostTripMessage(
          normalizedPhone,
          tripInfo,
          body.surveyLink ?? undefined
        );
        break;
      default:
        result = { success: false };
    }

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  logger.info('Trip notification broadcast completed', {
    tripId,
    type,
    sent,
    failed,
    total: passengers.length,
  });

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: passengers.length,
  });
});
