/**
 * API: Partner Email Template (Single)
 * GET /api/partner/whitelabel/email-templates/[type] - Get template
 * PUT /api/partner/whitelabel/email-templates/[type] - Update template
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ type: string }>;

const emailTemplateSchema = z.object({
  subject: z.string().min(1, 'Subject wajib diisi').max(500),
  bodyHtml: z.string().min(1, 'Body HTML wajib diisi'),
  bodyText: z.string().optional(),
  isActive: z.boolean().default(true),
});

const TEMPLATE_VARIABLES: Record<string, string[]> = {
  booking_confirmation: [
    '{{customer_name}}',
    '{{booking_code}}',
    '{{package_name}}',
    '{{trip_date}}',
    '{{total_amount}}',
    '{{payment_method}}',
  ],
  invoice: [
    '{{customer_name}}',
    '{{invoice_number}}',
    '{{invoice_date}}',
    '{{total_amount}}',
    '{{payment_status}}',
  ],
  payment_receipt: [
    '{{customer_name}}',
    '{{booking_code}}',
    '{{payment_amount}}',
    '{{payment_date}}',
    '{{payment_method}}',
  ],
  booking_reminder: [
    '{{customer_name}}',
    '{{booking_code}}',
    '{{package_name}}',
    '{{trip_date}}',
    '{{days_until_trip}}',
  ],
  trip_cancellation: [
    '{{customer_name}}',
    '{{booking_code}}',
    '{{package_name}}',
    '{{trip_date}}',
    '{{refund_amount}}',
    '{{cancellation_reason}}',
  ],
};

export const GET = withErrorHandler(async (
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

  if (!TEMPLATE_VARIABLES[type]) {
    return NextResponse.json(
      { error: 'Invalid template type' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    const { data: template, error } = await client
      .from('partner_email_templates')
      .select('*')
      .eq('partner_id', user.id)
      .eq('template_type', type)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch email template', error, {
        userId: user.id,
        templateType: type,
      });
      throw error;
    }

    return NextResponse.json({
      template: template
        ? {
            id: template.id,
            templateType: template.template_type,
            subject: template.subject,
            bodyHtml: template.body_html,
            bodyText: template.body_text,
            isActive: template.is_active,
            variables: TEMPLATE_VARIABLES[type],
          }
        : null,
      variables: TEMPLATE_VARIABLES[type],
    });
  } catch (error) {
    logger.error('Failed to get email template', error, {
      userId: user.id,
    });
    throw error;
  }
});

export const PUT = withErrorHandler(async (
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

  if (!TEMPLATE_VARIABLES[type]) {
    return NextResponse.json(
      { error: 'Invalid template type' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validated = emailTemplateSchema.parse(body);

    const client = supabase as unknown as any;

    // Deactivate other templates of the same type if this one is being activated
    if (validated.isActive) {
      await client
        .from('partner_email_templates')
        .update({ is_active: false })
        .eq('partner_id', user.id)
        .eq('template_type', type);
    }

    // Check if template exists
    const { data: existing } = await client
      .from('partner_email_templates')
      .select('id')
      .eq('partner_id', user.id)
      .eq('template_type', type)
      .maybeSingle();

    const templateData = {
      partner_id: user.id,
      template_type: type,
      subject: validated.subject,
      body_html: validated.bodyHtml,
      body_text: validated.bodyText || null,
      is_active: validated.isActive,
      variables: TEMPLATE_VARIABLES[type],
    };

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await client
        .from('partner_email_templates')
        .update(templateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await client
        .from('partner_email_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    logger.info('Email template updated', {
      userId: user.id,
      templateType: type,
      templateId: result.id,
    });

    return NextResponse.json({
      success: true,
      template: {
        id: result.id,
        templateType: result.template_type,
        subject: result.subject,
        bodyHtml: result.body_html,
        bodyText: result.body_text,
        isActive: result.is_active,
        variables: TEMPLATE_VARIABLES[type],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Failed to update email template', error, {
      userId: user.id,
    });
    throw error;
  }
});

