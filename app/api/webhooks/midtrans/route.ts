import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sendAdminAlert } from '@/lib/notifications/admin-alerts';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Webhook handler untuk Midtrans payment notifications
 * Endpoint: /api/webhooks/midtrans
 * Handles both booking payments and tipping payments
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Verify signature (recommended for production)
  // const signature = request.headers.get('x-midtrans-signature');
  // if (!verifySignature(body, signature)) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  // }

  const { order_id, transaction_status, fraud_status, gross_amount } = body;

  const supabase = await createClient();
  const client = supabase as unknown as any;

  // Check if this is a tipping payment (order_id starts with "TIP-")
  const isTippingPayment = order_id?.startsWith('TIP-');

  if (isTippingPayment) {
    // Handle tipping payment
    const { data: tippingRequest } = await client
      .from('tipping_requests')
      .select('id, guide_id, amount, payment_status')
      .eq('qris_payment_id', order_id)
      .maybeSingle();

    if (!tippingRequest) {
      logger.warn('Tipping request not found for order_id', { order_id });
      return NextResponse.json({
        received: true,
        message: 'Tipping request not found',
      });
    }

    switch (transaction_status) {
      case 'settlement':
        // Payment successful - update tipping request status
        // The trigger will automatically process the payment to wallet
        await client
          .from('tipping_requests')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', tippingRequest.id);

        logger.info('Tipping payment successful', {
          requestId: tippingRequest.id,
          guideId: tippingRequest.guide_id,
          amount: gross_amount,
        });

        // Send push notification to guide (handled by trigger or separate service)
        break;

      case 'pending':
        // Payment pending - no action needed
        break;

      case 'expire':
        // Payment expired
        await client
          .from('tipping_requests')
          .update({ payment_status: 'expired' })
          .eq('id', tippingRequest.id);
        break;

      case 'cancel':
        // Payment cancelled
        await client
          .from('tipping_requests')
          .update({ payment_status: 'cancelled' })
          .eq('id', tippingRequest.id);
        break;

      default:
        logger.info('Unhandled tipping transaction status', {
          transaction_status,
          order_id,
        });
    }
  } else {
    // Handle booking payment
    // Find booking by booking_code (order_id)
    const { data: booking } = await client
      .from('bookings')
      .select('id, booking_code, status, mitra_id, customer_name, customer_email')
      .eq('booking_code', order_id)
      .maybeSingle();

    if (!booking) {
      logger.warn('Booking not found for order_id', { order_id });
      return NextResponse.json({
        received: true,
        message: 'Booking not found',
      });
    }

    // Find payment record
    const { data: payment } = await client
      .from('payments')
      .select('id, status')
      .eq('booking_id', booking.id)
      .maybeSingle();

    switch (transaction_status) {
      case 'settlement':
        // Payment successful
        await client
          .from('bookings')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (payment) {
          await client
            .from('payments')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);
        }

        logger.info('Booking payment successful', {
          bookingId: booking.id,
          bookingCode: booking.booking_code,
          amount: gross_amount,
        });

        // PRD 4.3.C: Send WA Tiket to Customer & Notify Admin
        try {
          const { sendBookingConfirmation } = await import('@/lib/integrations/whatsapp');
          
          // Get package name for WA message
          const { data: packageData } = await client
            .from('packages')
            .select('name')
            .eq('id', booking.package_id)
            .single();

          const packageName = packageData?.name || 'Paket Wisata';

          // Send WA to customer if phone number available
          if (booking.customer_phone) {
            // Format phone number (remove + if exists, ensure starts with country code)
            const phoneNumber = booking.customer_phone.startsWith('+')
              ? booking.customer_phone.slice(1)
              : booking.customer_phone.startsWith('62')
              ? booking.customer_phone
              : `62${booking.customer_phone.replace(/^0/, '')}`;

            sendBookingConfirmation(
              phoneNumber,
              booking.booking_code,
              packageName,
              new Date().toISOString().split('T')[0]!,
              Number(gross_amount)
            ).catch((waError) => {
              logger.warn('Failed to send WA confirmation', {
                bookingId: booking.id,
                error: waError instanceof Error ? waError.message : String(waError),
              });
            });
          }

          // Notify Admin via WA (if configured)
          const opsPhone = process.env.WHATSAPP_OPS_PHONE;
          if (opsPhone) {
            const { sendTextMessage } = await import('@/lib/integrations/whatsapp');
            sendTextMessage(
              opsPhone,
              `✅ Pembayaran Diterima\n\nBooking: ${booking.booking_code}\nCustomer: ${booking.customer_name}\nPaket: ${packageName}\nAmount: Rp ${Number(gross_amount).toLocaleString('id-ID')}`
            ).catch((waError) => {
              logger.warn('Failed to send WA notification to admin', {
                error: waError instanceof Error ? waError.message : String(waError),
              });
            });
          }
        } catch (waError) {
          // Non-critical - log but continue
          logger.warn('WA notification error (non-critical)', {
            error: waError instanceof Error ? waError.message : String(waError),
          });
        }

        // Emit payment.received event (non-blocking)
        try {
          const { emitEvent } = await import('@/lib/events/event-bus');
          await emitEvent(
            {
              type: 'payment.received',
              app: booking.source === 'mitra' ? 'partner' : 'customer',
              userId: booking.mitra_id || booking.customer_id || null,
              data: {
                bookingId: booking.id,
                bookingCode: booking.booking_code,
                amount: gross_amount,
                paymentId: payment?.id,
              },
            },
            {
              ipAddress: request.headers.get('x-forwarded-for') || undefined,
              userAgent: request.headers.get('user-agent') || undefined,
            }
          ).catch((eventError) => {
            logger.warn('Failed to emit payment.received event', eventError);
          });
        } catch (eventError) {
          logger.warn('Event emission error (non-critical)', {
            error: eventError instanceof Error ? eventError.message : String(eventError),
          });
        }

        // Emit booking.status_changed event (non-blocking)
        try {
          const { emitEvent } = await import('@/lib/events/event-bus');
          await emitEvent(
            {
              type: 'booking.status_changed',
              app: booking.source === 'mitra' ? 'partner' : 'customer',
              userId: booking.mitra_id || booking.customer_id || null,
              data: {
                bookingId: booking.id,
                bookingCode: booking.booking_code,
                oldStatus: booking.status,
                newStatus: 'paid',
                packageId: booking.package_id,
              },
            }
          ).catch((eventError) => {
            logger.warn('Failed to emit booking.status_changed event', eventError);
          });
        } catch (eventError) {
          logger.warn('Event emission error (non-critical)', {
            error: eventError instanceof Error ? eventError.message : String(eventError),
          });
        }

        // Create in-app notification (non-blocking)
        if (booking.mitra_id) {
          try {
            const { createPartnerNotification } = await import('@/lib/partner/notifications');
            createPartnerNotification(
              booking.mitra_id,
              'payment_received',
              'Pembayaran Diterima',
              `Pembayaran untuk booking ${booking.booking_code} telah diterima.`,
              { bookingId: booking.id, bookingCode: booking.booking_code, amount: gross_amount }
            ).catch((notifError) => {
              logger.warn('Failed to create payment notification', notifError);
            });
          } catch (notifError) {
            logger.warn('Notification error (non-critical)', notifError);
          }
        }

        // Send confirmation email (non-blocking)
        try {
          const { sendBookingConfirmationEmail } = await import('@/lib/partner/email-notifications');
          
          if (booking.mitra_id) {
            const { data: partnerProfile } = await client
              .from('users')
              .select('email, full_name')
              .eq('id', booking.mitra_id)
              .single();

            if (partnerProfile?.email) {
              sendBookingConfirmationEmail(
                partnerProfile.email,
                partnerProfile.full_name || 'Partner',
                booking.booking_code,
                booking.customer_name,
                'Paket Wisata',
                new Date().toISOString().split('T')[0]!,
                Number(gross_amount),
                0,
                Number(gross_amount)
              ).catch((emailError) => {
                logger.warn('Failed to send payment confirmation email', emailError);
              });
            }
          }
        } catch (emailError) {
          logger.warn('Email notification error (non-critical)', emailError);
        }
        break;

      case 'pending':
        // Payment pending - update payment status only
        if (payment) {
          await client
            .from('payments')
            .update({
              status: 'processing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);
        }
        break;

      case 'expire':
        // PRD 4.3.C: Payment expired → Release Inventory
        await client
          .from('bookings')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: 'Payment expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (payment) {
          await client
            .from('payments')
            .update({
              status: 'expired',
              expired_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);
        }

        // PRD 4.3.C: Release Inventory (invalidasi availability cache)
        try {
          const { invalidateAvailabilityCache } = await import('@/lib/cache/package-availability-cache');
          
          // Get package and trip date from booking
          const { data: bookingData } = await client
            .from('bookings')
            .select('package_id, trip_date')
            .eq('id', booking.id)
            .single();

          if (bookingData?.package_id && bookingData?.trip_date) {
            await invalidateAvailabilityCache(bookingData.package_id, bookingData.trip_date);
            logger.info('Inventory released after payment expiry', {
              bookingId: booking.id,
              packageId: bookingData.package_id,
              tripDate: bookingData.trip_date,
            });
          }
        } catch (inventoryError) {
          // Non-critical - log but continue
          logger.warn('Failed to release inventory', {
            error: inventoryError instanceof Error ? inventoryError.message : String(inventoryError),
            bookingId: booking.id,
          });
        }

        logger.info('Booking payment expired', {
          bookingId: booking.id,
          bookingCode: booking.booking_code,
        });
        break;

      case 'cancel':
        // Payment cancelled
        await client
          .from('bookings')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: 'Payment cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (payment) {
          await client
            .from('payments')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);
        }
        break;

      case 'deny':
        // Payment denied
        if (payment) {
          await client
            .from('payments')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);
        }
        break;

      default:
        logger.info('Unhandled transaction status', { transaction_status, order_id });
    }
  }

  // Check fraud status
  if (fraud_status === 'accept') {
    // Transaction is safe
  } else if (fraud_status === 'deny' || fraud_status === 'challenge') {
    // Transaction flagged - manual review needed
    logger.warn('Transaction flagged for review', {
      order_id,
      fraud_status,
      transaction_status,
    });

    // Send admin alert for fraud detection
    await sendAdminAlert({
      type: 'payment_fraud',
      title: 'Payment Fraud Alert',
      message: `Transaction flagged with status: ${fraud_status}. Transaction status: ${transaction_status}. Amount: Rp ${Number(gross_amount || 0).toLocaleString('id-ID')}. Manual review required.`,
      orderId: order_id,
      severity: fraud_status === 'deny' ? 'critical' : 'high',
      metadata: {
        fraud_status,
        transaction_status,
        gross_amount,
      },
    });
  }

  return NextResponse.json({ received: true });
});
