/**
 * API: Partner Email Templates
 * GET /api/partner/whitelabel/email-templates - List email templates
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

// Available variables for each template type
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

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Get all templates for this partner
    const { data: templates, error } = await client
      .from('partner_email_templates')
      .select('*')
      .eq('partner_id', user.id)
      .order('template_type', { ascending: true });

    if (error) {
      logger.error('Failed to fetch email templates', error, {
        userId: user.id,
      });
      throw error;
    }

    // Get all available template types with their variables
    const templateTypes = Object.keys(TEMPLATE_VARIABLES).map((type) => ({
      type,
      variables: TEMPLATE_VARIABLES[type],
      template: templates?.find((t: any) => t.template_type === type && t.is_active) || null,
    }));

    return NextResponse.json({
      templates: templateTypes,
    });
  } catch (error) {
    logger.error('Failed to get email templates', error, {
      userId: user.id,
    });
    throw error;
  }
});

