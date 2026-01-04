/**
 * API: Test Email Template
 * POST /api/partner/whitelabel/email-templates/[type]/test - Send test email
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ type: string }>;

const testEmailSchema = z.object({
  testEmail: z.string().email('Email tidak valid'),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { type } = await params;

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

  try {
    const body = await request.json();
    const validated = testEmailSchema.parse(body);
    const sanitizedBody = sanitizeRequestBody(validated, {
      emails: ['testEmail'],
    });

    const client = supabase as unknown as any;

    // Get template
    const { data: template, error: templateError } = await client
      .from('partner_email_templates')
      .select('subject, body_html, body_text')
      .eq('partner_id', partnerId)
      .eq('template_type', type)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found. Please create a template first.' },
        { status: 404 }
      );
    }

    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      '{{customer_name}}': 'Test Customer',
      '{{booking_code}}': 'TEST-123456',
      '{{package_name}}': 'Paket Test',
      '{{trip_date}}': new Date().toLocaleDateString('id-ID'),
      '{{total_amount}}': 'Rp 1.000.000',
      '{{payment_method}}': 'Wallet',
      '{{invoice_number}}': 'INV-TEST-123456',
      '{{invoice_date}}': new Date().toLocaleDateString('id-ID'),
      '{{payment_status}}': 'Paid',
      '{{payment_amount}}': 'Rp 1.000.000',
      '{{payment_date}}': new Date().toLocaleDateString('id-ID'),
      '{{days_until_trip}}': '7',
      '{{refund_amount}}': 'Rp 500.000',
      '{{cancellation_reason}}': 'Test cancellation',
    };

    let subject = template.subject;
    let bodyHtml = template.body_html;
    let bodyText = template.body_text || '';

    // Replace variables
    Object.entries(sampleData).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key, 'g'), value);
      bodyHtml = bodyHtml.replace(new RegExp(key, 'g'), value);
      bodyText = bodyText.replace(new RegExp(key, 'g'), value);
    });

    // Send test email (using Resend or your email service)
    try {
      const { sendEmail } = await import('@/lib/integrations/resend');
      
      await sendEmail({
        to: sanitizedBody.testEmail,
        subject: `[TEST] ${subject}`,
        html: bodyHtml,
        text: bodyText,
      });

      logger.info('Test email sent', {
        userId: user.id,
        partnerId,
        templateType: type,
        testEmail: sanitizedBody.testEmail,
      });

      return NextResponse.json({
        success: true,
        message: 'Test email berhasil dikirim',
      });
    } catch (emailError) {
      logger.error('Failed to send test email', emailError, {
        userId: user.id,
        partnerId,
        templateType: type,
      });
      return NextResponse.json(
        { error: 'Gagal mengirim test email. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Failed to send test email', error, {
      userId: user.id,
      partnerId,
    });
    throw error;
  }
});

