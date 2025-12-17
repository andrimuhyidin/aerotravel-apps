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
    console.error('Resend email error:', error);
    throw error;
  }
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

