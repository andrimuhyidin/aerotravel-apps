/**
 * API: Custom Reports
 * GET /api/partner/reports/custom - List saved reports
 * POST /api/partner/reports/custom - Save report template
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const saveReportSchema = z.object({
  name: z.string().min(1),
  dataSource: z.enum(['bookings', 'customers', 'packages', 'finance']),
  config: z.object({
    name: z.string(),
    dataSource: z.string(),
    columns: z.array(z.string()),
    filters: z.record(z.unknown()).optional(),
    groupBy: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

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
    const { data: reports, error } = await client
      .from('partner_custom_reports')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch custom reports', error, { userId: user.id });
      throw error;
    }

    const transformedReports = (reports || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      dataSource: r.data_source,
      config: r.config,
      createdAt: r.created_at,
      lastRunAt: r.last_run_at,
    }));

    return NextResponse.json({ reports: transformedReports });
  } catch (error) {
    logger.error('Failed to fetch custom reports', error, { userId: user.id });
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

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

  const body = await request.json();
  
  // Sanitize input
  const sanitizedBody = sanitizeRequestBody(body, {
    strings: ['name'],
  });
  
  const validation = saveReportSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const { name, dataSource, config } = validation.data;

  try {
    const { data: report, error } = await client
      .from('partner_custom_reports')
      .insert({
        partner_id: partnerId,
        name,
        data_source: dataSource,
        config,
      })
      .select('id')
      .single();

    if (error || !report) {
      logger.error('Failed to save custom report', error, { userId: user.id });
      throw error;
    }

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    logger.error('Failed to save custom report', error, { userId: user.id });
    throw error;
  }
});

