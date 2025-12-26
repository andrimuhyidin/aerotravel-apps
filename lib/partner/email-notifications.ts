/**
 * Partner Email Notifications
 * Email templates and helpers for partner notifications
 */

import { sendEmail } from '@/lib/integrations/resend';
import { logger } from '@/lib/utils/logger';

/**
 * Send booking confirmation email to partner
 */
export async function sendBookingConfirmationEmail(
  partnerEmail: string,
  partnerName: string,
  bookingCode: string,
  customerName: string,
  packageName: string,
  tripDate: string,
  totalAmount: number,
  ntaAmount: number,
  commission: number
) {
  try {
    await sendEmail({
      to: partnerEmail,
      subject: `Booking Dikonfirmasi: ${bookingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Booking Berhasil Dikonfirmasi!</h2>
          
          <p>Halo ${partnerName},</p>
          
          <p>Booking Anda telah berhasil dikonfirmasi. Detail booking:</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking Code:</strong> ${bookingCode}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Paket:</strong> ${packageName}</p>
            <p><strong>Trip Date:</strong> ${new Date(tripDate).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>
            <p><strong>Total NTA:</strong> Rp ${ntaAmount.toLocaleString('id-ID')}</p>
            <p><strong>Komisi Anda:</strong> Rp ${commission.toLocaleString('id-ID')}</p>
          </div>
          
          <p>Invoice dapat diunduh dari dashboard partner portal Anda.</p>
          
          <p>Terima kasih telah menggunakan layanan kami!</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
          </p>
        </div>
      `,
    });

    logger.info('Booking confirmation email sent', {
      partnerEmail,
      bookingCode,
    });
  } catch (error) {
    logger.error('Failed to send booking confirmation email', error, {
      partnerEmail,
      bookingCode,
    });
    // Don't throw - email failure shouldn't break booking flow
  }
}

/**
 * Send invoice ready email to partner
 */
export async function sendInvoiceReadyEmail(
  partnerEmail: string,
  partnerName: string,
  bookingCode: string,
  invoiceNumber: string
) {
  try {
    await sendEmail({
      to: partnerEmail,
      subject: `Invoice Siap: ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Invoice Siap!</h2>
          
          <p>Halo ${partnerName},</p>
          
          <p>Invoice untuk booking <strong>${bookingCode}</strong> telah siap untuk diunduh.</p>
          
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          
          <p style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/partner/bookings" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Lihat Invoice
            </a>
          </p>
          
          <p>Terima kasih!</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
          </p>
        </div>
      `,
    });

    logger.info('Invoice ready email sent', {
      partnerEmail,
      bookingCode,
      invoiceNumber,
    });
  } catch (error) {
    logger.error('Failed to send invoice ready email', error, {
      partnerEmail,
      bookingCode,
    });
  }
}

/**
 * Send low wallet balance alert
 */
export async function sendLowWalletBalanceEmail(
  partnerEmail: string,
  partnerName: string,
  currentBalance: number,
  threshold: number = 1000000 // Default 1 juta
) {
  try {
    await sendEmail({
      to: partnerEmail,
      subject: 'Peringatan: Saldo Wallet Rendah',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Peringatan Saldo Wallet</h2>
          
          <p>Halo ${partnerName},</p>
          
          <p>Saldo wallet Anda saat ini <strong>Rp ${currentBalance.toLocaleString('id-ID')}</strong>.</p>
          
          <p style="background: #FEF3C7; padding: 15px; border-radius: 6px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <strong>Perhatian:</strong> Saldo Anda di bawah Rp ${threshold.toLocaleString('id-ID')}. 
            Silakan lakukan top-up untuk memastikan booking dapat diproses dengan lancar.
          </p>
          
          <p style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/partner/wallet" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Top-up Wallet
            </a>
          </p>
          
          <p>Terima kasih!</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
          </p>
        </div>
      `,
    });

    logger.info('Low wallet balance email sent', {
      partnerEmail,
      currentBalance,
      threshold,
    });
  } catch (error) {
    logger.error('Failed to send low wallet balance email', error, {
      partnerEmail,
    });
  }
}

/**
 * Send booking status update email
 */
export async function sendBookingStatusUpdateEmail(
  partnerEmail: string,
  partnerName: string,
  bookingCode: string,
  status: string,
  statusLabel: string,
  details?: string
) {
  try {
    const statusColors: Record<string, string> = {
      completed: '#10B981',
      cancelled: '#EF4444',
      ongoing: '#8B5CF6',
      confirmed: '#3B82F6',
    };

    const statusColor = statusColors[status] || '#6B7280';

    await sendEmail({
      to: partnerEmail,
      subject: `Update Status Booking: ${bookingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">Status Booking Diperbarui</h2>
          
          <p>Halo ${partnerName},</p>
          
          <p>Status booking <strong>${bookingCode}</strong> telah diperbarui:</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${statusColor};">
              ${statusLabel}
            </p>
            ${details ? `<p style="margin-top: 10px; color: #6b7280;">${details}</p>` : ''}
          </div>
          
          <p style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/partner/bookings/${bookingCode}" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Lihat Detail Booking
            </a>
          </p>
          
          <p>Terima kasih!</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
          </p>
        </div>
      `,
    });

    logger.info('Booking status update email sent', {
      partnerEmail,
      bookingCode,
      status,
    });
  } catch (error) {
    logger.error('Failed to send booking status update email', error, {
      partnerEmail,
      bookingCode,
    });
  }
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellationEmail(
  partnerEmail: string,
  partnerName: string,
  bookingCode: string,
  refundAmount: number,
  refundPercentage: number
) {
  try {
    await sendEmail({
      to: partnerEmail,
      subject: `Booking Dibatalkan: ${bookingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Booking Dibatalkan</h2>
          
          <p>Halo ${partnerName},</p>
          
          <p>Booking <strong>${bookingCode}</strong> telah dibatalkan.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking Code:</strong> ${bookingCode}</p>
            ${refundAmount > 0 ? `
              <p><strong>Refund:</strong> Rp ${refundAmount.toLocaleString('id-ID')} (${refundPercentage}%)</p>
              <p style="color: #10B981; margin-top: 10px;">
                Refund telah dikreditkan ke wallet Anda.
              </p>
            ` : `
              <p style="color: #6b7280;">
                Sesuai kebijakan pembatalan, tidak ada refund untuk booking ini.
              </p>
            `}
          </div>
          
          <p style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/partner/bookings" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Lihat Daftar Booking
            </a>
          </p>
          
          <p>Terima kasih!</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
          </p>
        </div>
      `,
    });

    logger.info('Booking cancellation email sent', {
      partnerEmail,
      bookingCode,
      refundAmount,
    });
  } catch (error) {
    logger.error('Failed to send booking cancellation email', error, {
      partnerEmail,
      bookingCode,
    });
  }
}

/**
 * Send wallet top-up success email
 */
export async function sendWalletTopupSuccessEmail(
  partnerEmail: string,
  partnerName: string,
  amount: number,
  newBalance: number
) {
  try {
    await sendEmail({
      to: partnerEmail,
      subject: 'Top-up Wallet Berhasil',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Top-up Berhasil!</h2>
          
          <p>Halo ${partnerName},</p>
          
          <p>Top-up wallet Anda telah berhasil diproses.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Jumlah Top-up:</strong> Rp ${amount.toLocaleString('id-ID')}</p>
            <p><strong>Saldo Baru:</strong> Rp ${newBalance.toLocaleString('id-ID')}</p>
          </div>
          
          <p>Saldo wallet Anda sudah dapat digunakan untuk melakukan booking.</p>
          
          <p style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/partner/wallet" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Lihat Wallet
            </a>
          </p>
          
          <p>Terima kasih!</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
          </p>
        </div>
      `,
    });

    logger.info('Wallet topup success email sent', {
      partnerEmail,
      amount,
      newBalance,
    });
  } catch (error) {
    logger.error('Failed to send wallet topup success email', error, {
      partnerEmail,
    });
  }
}

