import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
};

export async function sendEmail(options: EmailOptions) {
  try {
    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html?: string;
      text?: string;
      attachments?: Array<{ filename: string; content: Buffer | string }>;
    } = {
      from: options.from || 'Aero Travel <noreply@aerotravel.co.id>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };
    
    if (options.html) emailPayload.html = options.html;
    if (options.text) emailPayload.text = options.text;
    if (options.attachments) emailPayload.attachments = options.attachments;
    
    const { data, error } = await resend.emails.send(emailPayload as Parameters<typeof resend.emails.send>[0]);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    // Use structured logging instead of console.error
    if (error instanceof Error) {
      throw new Error(`Resend email error: ${error.message}`);
    }
    throw error;
  }
}

// Helper function untuk booking confirmation email
export type BookingConfirmationData = {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  packageName?: string;
  tripDate?: string;
  totalAmount?: number;
};

export async function sendBookingConfirmationEmail(data: BookingConfirmationData) {
  const formattedDate = data.tripDate 
    ? new Date(data.tripDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Segera dikonfirmasi';

  const formattedAmount = data.totalAmount
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.totalAmount)
    : '-';

  return sendEmail({
    to: data.customerEmail,
    subject: `Pembayaran Berhasil - ${data.bookingCode} | Aero Travel`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Pembayaran Berhasil!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Halo <strong>${data.customerName}</strong>,</p>
            <p style="font-size: 16px; color: #333;">Terima kasih atas pembayaran Anda. Booking Anda telah dikonfirmasi.</p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #0ea5e9;">Detail Booking</h3>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Kode Booking:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">${data.bookingCode}</td>
                </tr>
                ${data.packageName ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Paket:</td>
                  <td style="padding: 8px 0; color: #333;">${data.packageName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;">Tanggal:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                </tr>
                ${data.totalAmount ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Total:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">${formattedAmount}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <p style="font-size: 14px; color: #666;">Tim kami akan segera menghubungi Anda untuk konfirmasi detail perjalanan.</p>
            <p style="font-size: 14px; color: #666;">Jika ada pertanyaan, silakan hubungi customer service kami.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://myaerotravel.id/bookings/${data.bookingCode}" 
                 style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Lihat Detail Booking
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Aero Travel. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// Helper function untuk email template umum
export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  pdfBuffer: Buffer
) {
  return sendEmail({
    to,
    subject: `Invoice ${invoiceNumber} - Aero Travel`,
    html: `
      <h1>Terima kasih atas pemesanan Anda!</h1>
      <p>Invoice ${invoiceNumber} terlampir dalam email ini.</p>
      <p>Jika ada pertanyaan, silakan hubungi customer service kami.</p>
    `,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}

