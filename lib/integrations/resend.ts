import { Resend } from 'resend';

import { getSetting } from '@/lib/settings';

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
    // Get email settings from database
    const [fromName, fromAddress] = await Promise.all([
      getSetting('email.from_name'),
      getSetting('email.from_address'),
    ]);

    const defaultFromName = (fromName as string) || 'Aero Travel';
    const defaultFromAddress = (fromAddress as string) || 'noreply@aerotravel.co.id';

    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html?: string;
      text?: string;
      attachments?: Array<{ filename: string; content: Buffer | string }>;
    } = {
      from: options.from || `${defaultFromName} <${defaultFromAddress}>`,
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
  const { processEmailTemplateWithFallback } = await import('@/lib/templates/email');

  const formattedDate = data.tripDate
    ? new Date(data.tripDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Segera dikonfirmasi';

  const formattedAmount = data.totalAmount
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
      }).format(data.totalAmount)
    : '-';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myaerotravel.id';

  // Prepare variables for template
  const variables = {
    customer_name: data.customerName,
    booking_code: data.bookingCode,
    package_name: data.packageName || '-',
    trip_date: formattedDate,
    total_amount: formattedAmount,
    booking_url: `${baseUrl}/bookings/${data.bookingCode}`,
    company_name: 'Aero Travel',
    year: new Date().getFullYear().toString(),
  };

  // Fallback HTML template
  const fallbackHtml = `
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
          <p style="font-size: 16px; color: #333;">Halo <strong>{{customer_name}}</strong>,</p>
          <p style="font-size: 16px; color: #333;">Terima kasih atas pembayaran Anda. Booking Anda telah dikonfirmasi.</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #0ea5e9;">Detail Booking</h3>
            <p>Kode: {{booking_code}}</p>
            <p>Paket: {{package_name}}</p>
            <p>Tanggal: {{trip_date}}</p>
            <p>Total: {{total_amount}}</p>
          </div>
          <p style="font-size: 14px; color: #666;">Tim kami akan segera menghubungi Anda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Process template with database template or fallback
  const processed = await processEmailTemplateWithFallback(
    'booking_confirmation',
    variables,
    {
      subject: `Pembayaran Berhasil - {{booking_code}} | {{company_name}}`,
      html: fallbackHtml,
    }
  );

  return sendEmail({
    to: data.customerEmail,
    subject: processed.subject,
    html: processed.html,
  });
}

// Helper function untuk email template umum
export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  pdfBuffer: Buffer
) {
  const { processEmailTemplateWithFallback } = await import('@/lib/templates/email');

  const variables = {
    invoice_number: invoiceNumber,
    company_name: 'Aero Travel',
    company_phone: '+62 812 3456 7890',
    company_email: 'info@aerotravel.co.id',
  };

  const processed = await processEmailTemplateWithFallback(
    'invoice_email',
    variables,
    {
      subject: `Invoice {{invoice_number}} - {{company_name}}`,
      html: `
        <h1>Terima kasih atas pemesanan Anda!</h1>
        <p>Invoice <strong>{{invoice_number}}</strong> terlampir dalam email ini.</p>
        <p>Jika ada pertanyaan, silakan hubungi customer service kami.</p>
      `,
    }
  );

  return sendEmail({
    to,
    subject: processed.subject,
    html: processed.html,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}

