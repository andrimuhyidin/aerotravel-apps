/**
 * Xendit Webhook Handler
 * POST /api/webhooks/xendit - Handle Xendit payment callbacks
 */

import { NextRequest, NextResponse } from 'next/server';

import { sendBookingConfirmationEmail } from '@/lib/integrations/resend';
import { verifyWebhookToken } from '@/lib/integrations/xendit';
import { sendTextMessage } from '@/lib/integrations/whatsapp';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type XenditInvoiceCallback = {
  id: string;
  external_id: string;
  user_id: string;
  status: 'PAID' | 'EXPIRED' | 'FAILED';
  merchant_name: string;
  amount: number;
  payer_email: string;
  description: string;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
  bank_code?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Verify webhook token
    const callbackToken = request.headers.get('x-callback-token');
    if (!callbackToken || !verifyWebhookToken(callbackToken)) {
      logger.warn('Invalid Xendit webhook token');
      return NextResponse.json(
        { error: 'Invalid callback token' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as XenditInvoiceCallback;
    logger.info('Xendit webhook received', { 
      invoiceId: body.id,
      externalId: body.external_id,
      status: body.status,
    });

    // Use admin client for webhook (no user context)
    const supabase = await createAdminClient();

    // Find booking by external_id (booking code)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, code, customer_name, customer_phone, customer_email, package_id, trip_date, total_amount, packages(name)')
      .eq('code', body.external_id)
      .single();

    if (bookingError || !booking) {
      logger.error('Booking not found for webhook', { externalId: body.external_id });
      // Return 200 to prevent Xendit from retrying
      return NextResponse.json({ received: true, error: 'Booking not found' });
    }

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: body.status.toLowerCase(),
        paid_at: body.paid_at || null,
        payment_method: body.payment_method || null,
        payment_channel: body.payment_channel || null,
        updated_at: new Date().toISOString(),
      })
      .eq('invoice_id', body.id);

    // Handle based on status
    if (body.status === 'PAID') {
      // Update booking status to confirmed/paid
      await supabase
        .from('bookings')
        .update({
          status: 'paid',
          paid_at: body.paid_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      logger.info('Booking payment confirmed', { 
        bookingId: booking.id,
        code: booking.code,
      });

      // Send WhatsApp confirmation (best effort)
      try {
        if (booking.customer_phone) {
          // Format phone number for WhatsApp (add 62 if starts with 0)
          let phone = booking.customer_phone;
          if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
          }

          await sendTextMessage(
            phone,
            `✅ *Pembayaran Berhasil!*\n\n` +
            `Halo ${booking.customer_name},\n\n` +
            `Booking Anda dengan kode *${booking.code}* telah berhasil dibayar.\n\n` +
            `Tim kami akan segera menghubungi Anda untuk konfirmasi detail perjalanan.\n\n` +
            `Terima kasih telah memilih Aero Travel! 🌴`
          );
        }
      } catch (waError) {
        logger.error('Failed to send WhatsApp confirmation', waError);
        // Don't fail the webhook for WhatsApp errors
      }

      // Send email confirmation via Resend (best effort)
      try {
        if (booking.customer_email) {
          const packageData = booking.packages as { name: string } | null;
          await sendBookingConfirmationEmail({
            bookingCode: booking.code,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            packageName: packageData?.name,
            tripDate: booking.trip_date,
            totalAmount: booking.total_amount,
          });
          logger.info('Email confirmation sent', { bookingCode: booking.code });
        }
      } catch (emailError) {
        logger.error('Failed to send email confirmation', emailError);
        // Don't fail the webhook for email errors
      }

    } else if (body.status === 'EXPIRED') {
      // Update booking status to expired
      await supabase
        .from('bookings')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      logger.info('Booking payment expired', { 
        bookingId: booking.id,
        code: booking.code,
      });

    } else if (body.status === 'FAILED') {
      // Update booking status to failed
      await supabase
        .from('bookings')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      logger.info('Booking payment failed', { 
        bookingId: booking.id,
        code: booking.code,
      });
    }

    return NextResponse.json({ received: true, status: body.status });
  } catch (error) {
    logger.error('Error processing Xendit webhook', error);
    // Return 200 to prevent retries for processing errors
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

