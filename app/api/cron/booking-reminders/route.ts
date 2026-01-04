/**
 * API: Booking Reminder Cron Job
 * GET /api/cron/booking-reminders
 * 
 * This endpoint should be called by Vercel Cron or external cron service
 * Schedule: Daily at 09:00 WIB (02:00 UTC)
 * 
 * Sends reminder notifications for bookings (H-7, H-3, H-1 days before trip)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sendEmail } from '@/lib/integrations/resend';
import { createClient } from '@/lib/supabase/server';
import { generateBookingReminderEmail } from '@/lib/partner/email-templates/booking-reminder';
import { logger } from '@/lib/utils/logger';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured, allowing request');
    return true; // Allow if not configured (for development)
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    logger.info('[Cron] Starting booking reminder notifications');

    // Call database function to get bookings needing reminders
    const { data: bookingsNeedingReminders, error: functionError } = await client.rpc(
      'get_bookings_needing_reminders'
    );

    if (functionError) {
      logger.error('[Cron] Failed to get bookings needing reminders', functionError instanceof Error ? functionError : new Error(String(functionError)));
      return NextResponse.json(
        { error: 'Failed to get bookings needing reminders', details: functionError.message },
        { status: 500 }
      );
    }

    const bookings = (bookingsNeedingReminders || []) as Array<{
      booking_id: string;
      booking_code: string;
      trip_date: string;
      days_until_trip: number;
      reminder_type: string;
      customer_email: string | null;
      customer_phone: string | null;
      partner_email: string;
      partner_id: string;
      package_name: string;
      adult_pax: number;
      child_pax: number;
      infant_pax: number;
    }>;

    logger.info('[Cron] Found bookings needing reminders', { count: bookings.length });

    if (bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings need reminders today',
        sent: 0,
      });
    }

    const results: Array<{
      bookingId: string;
      bookingCode: string;
      reminderType: string;
      status: 'sent' | 'failed';
      error?: string;
    }> = [];

    // Send reminders for each booking
    for (const booking of bookings) {
      try {
        // Send email to partner
        if (booking.partner_email) {
          const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.aerotravel.id'}/partner/bookings/${booking.booking_id}`;
          
          const emailTemplate = generateBookingReminderEmail({
            bookingCode: booking.booking_code,
            tripDate: booking.trip_date,
            packageName: booking.package_name || 'Paket Wisata',
            adultPax: booking.adult_pax,
            childPax: booking.child_pax,
            infantPax: booking.infant_pax,
            reminderType: booking.reminder_type as 'H-7' | 'H-3' | 'H-1',
            bookingUrl,
          });

          await sendEmail({
            to: booking.partner_email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          });

          logger.info('[Cron] Reminder email sent', {
            bookingId: booking.booking_id,
            bookingCode: booking.booking_code,
            reminderType: booking.reminder_type,
            email: booking.partner_email,
          });
        }

        // Record reminder in database
        const { error: insertError } = await client
          .from('booking_reminders')
          .insert({
            booking_id: booking.booking_id,
            reminder_type: booking.reminder_type,
            sent_to_email: booking.partner_email,
            sent_to_phone: booking.customer_phone,
            notification_method: 'email',
          });

        if (insertError) {
          logger.warn('[Cron] Failed to record reminder', { 
            bookingId: booking.booking_id,
            error: insertError instanceof Error ? insertError.message : String(insertError)
          });
        }

        results.push({
          bookingId: booking.booking_id,
          bookingCode: booking.booking_code,
          reminderType: booking.reminder_type,
          status: 'sent',
        });
      } catch (error) {
        logger.error('[Cron] Failed to send reminder', error, {
          bookingId: booking.booking_id,
          bookingCode: booking.booking_code,
        });

        results.push({
          bookingId: booking.booking_id,
          bookingCode: booking.booking_code,
          reminderType: booking.reminder_type,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    logger.info('[Cron] Booking reminder notifications completed', {
      total: bookings.length,
      sent,
      failed,
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} reminders, ${failed} failed`,
      total: bookings.length,
      sent,
      failed,
      results,
    });
  } catch (error) {
    logger.error('[Cron] Fatal error in booking reminders', error);
    return NextResponse.json(
      {
        error: 'Fatal error in booking reminders',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

