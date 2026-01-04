/**
 * API: Test Email Template
 * POST /api/admin/templates/email/[key]/test - Send test email with template
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sendEmail } from '@/lib/integrations/resend';
import { hasRole } from '@/lib/supabase/server';
import { processEmailTemplate } from '@/lib/templates/email';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ key: string }>;
};

const testEmailSchema = z.object({
  test_email: z.string().email('Invalid email format'),
  variables: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

/**
 * Default sample variables for common templates
 */
function getDefaultVariables(templateKey: string): Record<string, string | number> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myaerotravel.id';
  const now = new Date();

  const common = {
    company_name: 'Aero Travel',
    company_phone: '+62 812 3456 7890',
    company_email: 'info@aerotravel.co.id',
    year: now.getFullYear().toString(),
  };

  switch (templateKey) {
    case 'booking_confirmation':
      return {
        ...common,
        customer_name: 'John Doe',
        booking_code: 'BK-2024-001',
        package_name: 'Bromo Sunrise Adventure',
        trip_date: now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        total_amount: 'Rp 1.500.000',
        booking_url: `${baseUrl}/bookings/BK-2024-001`,
      };

    case 'license_expiry_alert':
      return {
        ...common,
        license_type: 'IUTA',
        license_name: 'Izin Usaha Tour & Travel',
        license_number: 'IUTA-2024-001',
        expiry_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
        days_until_expiry: 30,
        dashboard_url: `${baseUrl}/dashboard/compliance/licenses`,
      };

    case 'certification_expiry_alert':
      return {
        ...common,
        guide_name: 'Budi Santoso',
        guide_email: 'budi@example.com',
        certification_type: 'Sertifikasi Guide',
        certification_name: 'Sertifikasi Guide Profesional',
        expiry_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
        days_until_expiry: 7,
        urgency_level: '⚠️ Important',
        manage_url: `${baseUrl}/mobile/guide/certifications`,
        ops_email: 'ops@aerotravel.com',
        ops_phone: '0812-XXXX-XXXX',
      };

    case 'data_breach_notification':
      return {
        ...common,
        user_name: 'John Doe',
        incident_title: 'Unauthorized Access',
        incident_date: now.toLocaleDateString('id-ID'),
        severity: 'HIGH',
        affected_data_types: 'Email, Phone Number',
        description: 'Terjadi insiden keamanan data yang mempengaruhi informasi Anda.',
        remediation_steps: 'Kami telah mengamankan sistem dan mengubah password semua akun yang terpengaruh.',
        privacy_email: 'privacy@aerotravel.co.id',
        privacy_phone: '+62 812 3456 7890',
      };

    case 'data_breach_admin':
      return {
        ...common,
        incident_id: 'INC-2024-001',
        incident_type: 'Unauthorized Access',
        affected_records: 150,
        reported_at: now.toLocaleString('id-ID'),
        description: 'Detected unauthorized access to customer database.',
        incident_url: `${baseUrl}/dashboard/compliance/breach/INC-2024-001`,
      };

    case 'assessment_reminder':
      return {
        ...common,
        assessment_url: `${baseUrl}/dashboard/compliance/permenparekraf`,
      };

    case 'invoice_email':
      return {
        ...common,
        invoice_number: 'INV-2024-001',
      };

    default:
      return common;
  }
}

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { key } = await context.params;

  // Only super_admin can send test emails
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = testEmailSchema.parse(await request.json());

  // Get default variables for this template
  const defaultVariables = getDefaultVariables(key);
  const variables = { ...defaultVariables, ...body.variables };

  // Process template
  const processed = await processEmailTemplate(key, variables);

  if (!processed) {
    logger.warn('Template not found for test email', { templateKey: key });
    return NextResponse.json(
      { error: 'Template not found or inactive' },
      { status: 404 }
    );
  }

  try {
    // Send test email
    await sendEmail({
      to: body.test_email,
      subject: `[TEST] ${processed.subject}`,
      html: processed.html,
      text: processed.text,
    });

    logger.info('Test email sent', {
      templateKey: key,
      recipient: body.test_email,
    });

    return NextResponse.json({
      message: 'Test email sent successfully',
      templateKey: key,
      recipient: body.test_email,
    });
  } catch (error) {
    logger.error('Failed to send test email', error, {
      templateKey: key,
      recipient: body.test_email,
    });
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

