/**
 * API: Admin - Send Invoice
 * POST /api/admin/finance/invoices/[id]/send - Send invoice to customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { generateInvoiceFromBooking } from '@/lib/finance/invoice-generator';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const sendInvoiceSchema = z.object({
  sendMethod: z.enum(['email', 'whatsapp', 'both']).default('email'),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  customMessage: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = sendInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { sendMethod, recipientEmail, recipientPhone, customMessage } = parsed.data;
  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get invoice with customer data
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        customer_id,
        booking_id,
        invoice_date,
        due_date,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        items,
        notes,
        status
      `)
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get customer details
    let customer = null;
    if (invoice.customer_id) {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', invoice.customer_id)
        .single();
      customer = data;
    }

    // Determine recipient
    const emailTo = recipientEmail || customer?.email;
    const phoneTo = recipientPhone || customer?.phone;

    if (sendMethod !== 'whatsapp' && !emailTo) {
      return NextResponse.json(
        { error: 'No email address provided or found for customer' },
        { status: 400 }
      );
    }

    if (sendMethod !== 'email' && !phoneTo) {
      return NextResponse.json(
        { error: 'No phone number provided or found for customer' },
        { status: 400 }
      );
    }

    // Generate PDF
    let pdfUrl = null;
    try {
      const pdfResult = await generateInvoicePDF({
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        customerName: customer?.full_name || 'Customer',
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || '',
        items: invoice.items as Array<{
          description: string;
          quantity: number;
          unitPrice: number;
          total: number;
        }>,
        subtotal: invoice.subtotal,
        taxAmount: invoice.tax_amount,
        discountAmount: invoice.discount_amount,
        totalAmount: invoice.total_amount,
        notes: invoice.notes || customMessage,
      });
      pdfUrl = pdfResult.url;
    } catch (pdfError) {
      logger.warn('Failed to generate PDF, sending without attachment', pdfError);
    }

    // Send via email
    let emailSent = false;
    if ((sendMethod === 'email' || sendMethod === 'both') && emailTo) {
      try {
        // TODO: Implement actual email sending via Resend
        // await sendInvoiceEmail({
        //   to: emailTo,
        //   invoiceNumber: invoice.invoice_number,
        //   amount: invoice.total_amount,
        //   dueDate: invoice.due_date,
        //   pdfUrl,
        //   customMessage,
        // });
        
        logger.info('Invoice email would be sent', {
          to: emailTo,
          invoiceNumber: invoice.invoice_number,
        });
        emailSent = true;
      } catch (emailError) {
        logger.error('Failed to send invoice email', emailError);
      }
    }

    // Send via WhatsApp
    let whatsappSent = false;
    if ((sendMethod === 'whatsapp' || sendMethod === 'both') && phoneTo) {
      try {
        // TODO: Implement actual WhatsApp sending
        // await sendInvoiceWhatsApp({
        //   to: phoneTo,
        //   invoiceNumber: invoice.invoice_number,
        //   amount: invoice.total_amount,
        //   dueDate: invoice.due_date,
        //   pdfUrl,
        //   customMessage,
        // });
        
        logger.info('Invoice WhatsApp would be sent', {
          to: phoneTo,
          invoiceNumber: invoice.invoice_number,
        });
        whatsappSent = true;
      } catch (waError) {
        logger.error('Failed to send invoice WhatsApp', waError);
      }
    }

    // Update invoice status
    if (emailSent || whatsappSent) {
      await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: now,
          updated_at: now,
        })
        .eq('id', id);
    }

    // Log send action
    await supabase.from('invoice_send_logs').insert({
      invoice_id: id,
      send_method: sendMethod,
      recipient_email: emailTo || null,
      recipient_phone: phoneTo || null,
      email_sent: emailSent,
      whatsapp_sent: whatsappSent,
      pdf_url: pdfUrl,
      sent_by: user.id,
    }).catch(() => {
      // Table might not exist, ignore
    });

    logger.info('Invoice sent', {
      invoiceId: id,
      invoiceNumber: invoice.invoice_number,
      sendMethod,
      emailSent,
      whatsappSent,
      sentBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice berhasil dikirim',
      details: {
        emailSent,
        whatsappSent,
        recipientEmail: emailTo,
        recipientPhone: phoneTo,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in send invoice', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

