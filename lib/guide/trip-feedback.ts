/**
 * Trip Feedback Utilities
 * Functions untuk mengirim feedback request setelah trip selesai
 */

import { sendEmail } from '@/lib/integrations/resend';
import { sendTextMessage } from '@/lib/integrations/whatsapp';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Send rating feedback request to customers after trip completion
 */
export async function sendFeedbackRequests(tripId: string) {
  const supabase = await createClient();

  try {
    // Get trip info
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, trip_code, trip_date, package:packages(name)')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      logger.error('Failed to fetch trip for feedback', tripError, { tripId });
      return { success: false, error: 'Trip not found' };
    }

    // Get bookings for this trip through trip_bookings
    const { data: tripBookings, error: tripBookingsError } = await supabase
      .from('trip_bookings')
      .select('booking_id, booking:bookings(id, booking_code, customer_email, customer_phone, customer_name)')
      .eq('trip_id', tripId);

    if (tripBookingsError) {
      logger.error('Failed to fetch trip bookings', tripBookingsError, { tripId });
      return { success: false, error: 'Failed to fetch bookings' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
    const locale = 'id'; // Default to Indonesian

    // Collect unique customers (booking level)
    const customers: Array<{
      bookingId: string;
      bookingCode: string;
      email: string | null;
      phone: string | null;
      name: string;
      ratingLink: string;
    }> = [];

    if (tripBookings && tripBookings.length > 0) {
      for (const tb of tripBookings) {
        const booking = (tb as any).booking;
        if (booking) {
          const ratingToken = await generateRatingToken(booking.id);
          const ratingLink = `${baseUrl}/${locale}/review/${ratingToken}`;

          customers.push({
            bookingId: booking.id,
            bookingCode: booking.booking_code,
            email: booking.customer_email || null,
            phone: booking.customer_phone || null,
            name: booking.customer_name,
            ratingLink,
          });
        }
      }
    }

    // Send feedback requests
    const results = [];
    for (const customer of customers) {
      // Send email if available
      if (customer.email) {
        try {
          await sendEmail({
            to: customer.email,
            subject: `Rating & Review Trip ${trip.trip_code} - Aero Travel`,
            html: `
              <h1>Terima Kasih Telah Berwisata dengan Kami!</h1>
              <p>Halo ${customer.name},</p>
              <p>Terima kasih telah memilih Aero Travel untuk perjalanan Anda. Kami sangat menghargai feedback Anda tentang pengalaman perjalanan.</p>
              <p>Silakan berikan rating dan review untuk membantu kami meningkatkan layanan:</p>
              <p style="margin: 20px 0;">
                <a href="${customer.ratingLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Berikan Rating & Review
                </a>
              </p>
              <p>Atau klik link berikut:</p>
              <p><a href="${customer.ratingLink}">${customer.ratingLink}</a></p>
              <p>Terima kasih atas waktu dan masukan Anda!</p>
              <p>Best regards,<br>Aero Travel Team</p>
            `,
          });
          results.push({ bookingId: customer.bookingId, method: 'email', success: true });
          logger.info('Feedback email sent', { tripId, bookingId: customer.bookingId, email: customer.email });
        } catch (emailError) {
          logger.error('Failed to send feedback email', emailError, {
            tripId,
            bookingId: customer.bookingId,
            email: customer.email,
          });
          results.push({ bookingId: customer.bookingId, method: 'email', success: false });
        }
      }

      // Send WhatsApp if available
      if (customer.phone) {
        try {
          const message = `Terima kasih ${customer.name} telah memilih Aero Travel! 

Silakan berikan rating & review untuk trip ${trip.trip_code}:
${customer.ratingLink}

Feedback Anda sangat berarti untuk kami. Terima kasih! 🙏`;

          await sendTextMessage(customer.phone.replace(/^0/, '+62'), message);
          results.push({ bookingId: customer.bookingId, method: 'whatsapp', success: true });
          logger.info('Feedback WhatsApp sent', {
            tripId,
            bookingId: customer.bookingId,
            phone: customer.phone,
          });
        } catch (waError) {
          logger.error('Failed to send feedback WhatsApp', waError, {
            tripId,
            bookingId: customer.bookingId,
            phone: customer.phone,
          });
          results.push({ bookingId: customer.bookingId, method: 'whatsapp', success: false });
        }
      }
    }

    return { success: true, results, sentCount: results.filter((r) => r.success).length };
  } catch (error) {
    logger.error('Failed to send feedback requests', error, { tripId });
    return { success: false, error: 'Failed to send feedback requests' };
  }
}

/**
 * Generate a unique token for rating link
 * In production, this should use a secure token generator
 */
async function generateRatingToken(bookingId: string): Promise<string> {
  // For now, use a simple hash. In production, use crypto.randomBytes or JWT
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${bookingId}-${timestamp}-${random}`.replace(/[^a-zA-Z0-9-]/g, '');
}
