/**
 * API: Booking Reminders
 * GET /api/partner/bookings/[id]/reminders - Get reminder history
 * POST /api/partner/bookings/[id]/reminders - Trigger manual reminder (for testing)
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/integrations/resend';
import { generateBookingReminderEmail } from '@/lib/partner/email-templates/booking-reminder';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId } = await params;
  const supabase = await createClient();

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

  const client = supabase as unknown as any;

  try {
    // Verify booking belongs to partner
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select('id, booking_code, trip_date, mitra_id')
      .eq('id', bookingId)
      .eq('mitra_id', partnerId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get reminder history
    const { data: reminders, error: remindersError } = await client
      .from('booking_reminders')
      .select('*')
      .eq('booking_id', bookingId)
      .order('sent_at', { ascending: false });

    if (remindersError) {
      logger.error('Failed to fetch reminders', remindersError, { bookingId });
      return NextResponse.json(
        { error: 'Failed to fetch reminders' },
        { status: 500 }
      );
    }

    // Calculate next reminder date
    const tripDate = new Date(booking.trip_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilTrip = Math.ceil(
      (tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const sentReminderTypes = new Set(
      (reminders || []).map((r: { reminder_type: string }) => r.reminder_type)
    );

    let nextReminder: {
      type: string;
      date: string;
      daysUntil: number;
    } | null = null;

    if (daysUntilTrip > 7 && !sentReminderTypes.has('H-7')) {
      const h7Date = new Date(tripDate);
      h7Date.setDate(h7Date.getDate() - 7);
      nextReminder = {
        type: 'H-7',
        date: h7Date.toISOString().split('T')[0]!,
        daysUntil: daysUntilTrip - 7,
      };
    } else if (daysUntilTrip > 3 && !sentReminderTypes.has('H-3')) {
      const h3Date = new Date(tripDate);
      h3Date.setDate(h3Date.getDate() - 3);
      nextReminder = {
        type: 'H-3',
        date: h3Date.toISOString().split('T')[0]!,
        daysUntil: daysUntilTrip - 3,
      };
    } else if (daysUntilTrip > 1 && !sentReminderTypes.has('H-1')) {
      const h1Date = new Date(tripDate);
      h1Date.setDate(h1Date.getDate() - 1);
      nextReminder = {
        type: 'H-1',
        date: h1Date.toISOString().split('T')[0]!,
        daysUntil: daysUntilTrip - 1,
      };
    }

    return NextResponse.json({
      reminders: reminders || [],
      nextReminder,
      daysUntilTrip,
    });
  } catch (error) {
    logger.error('Failed to get reminders', error, { bookingId });
    throw error;
  }
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId } = await params;
  const supabase = await createClient();

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

  const body = await request.json().catch(() => ({}));
  const sanitizedBody = sanitizeRequestBody(body, { strings: ['reminderType'] });
  const { reminderType } = sanitizedBody as { reminderType?: 'H-7' | 'H-3' | 'H-1' };

  if (!reminderType || !['H-7', 'H-3', 'H-1'].includes(reminderType)) {
    return NextResponse.json(
      { error: 'Invalid reminder type. Must be H-7, H-3, or H-1' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    // Get booking details
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select(`
        id,
        booking_code,
        trip_date,
        adult_pax,
        child_pax,
        infant_pax,
        customer_email,
        customer_phone,
        mitra_id,
        package:packages(name),
        mitra:users!bookings_mitra_id_fkey(email, full_name)
      `)
      .eq('id', bookingId)
      .eq('mitra_id', partnerId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if reminder already sent
    const { data: existingReminder } = await client
      .from('booking_reminders')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('reminder_type', reminderType)
      .single();

    if (existingReminder) {
      return NextResponse.json(
        { error: `Reminder ${reminderType} already sent for this booking` },
        { status: 400 }
      );
    }

    // Send reminder email
    const partnerEmail = booking.mitra?.email;
    if (!partnerEmail) {
      return NextResponse.json(
        { error: 'Partner email not found' },
        { status: 400 }
      );
    }

    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.aerotravel.id'}/partner/bookings/${booking.id}`;
    
    const emailTemplate = generateBookingReminderEmail({
      bookingCode: booking.booking_code,
      tripDate: booking.trip_date,
      packageName: booking.package?.name || 'Paket Wisata',
      adultPax: booking.adult_pax,
      childPax: booking.child_pax,
      infantPax: booking.infant_pax,
      reminderType,
      bookingUrl,
    });

    await sendEmail({
      to: partnerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    // Record reminder in database
    const { error: insertError } = await client
      .from('booking_reminders')
      .insert({
        booking_id: booking.id,
        reminder_type: reminderType,
        sent_to_email: partnerEmail,
        sent_to_phone: booking.customer_phone,
        notification_method: 'email',
      });

    if (insertError) {
      logger.error('Failed to record reminder', insertError, { bookingId });
      // Don't fail the request if recording fails, email was sent
    }

    logger.info('Manual reminder sent', {
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      reminderType,
      email: partnerEmail,
    });

    return NextResponse.json({
      success: true,
      message: `Reminder ${reminderType} sent successfully`,
      reminderType,
    });
  } catch (error) {
    logger.error('Failed to send manual reminder', error, { bookingId });
    throw error;
  }
});

