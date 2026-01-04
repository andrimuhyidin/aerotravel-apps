/**
 * API: Admin - Custom Reports
 * GET /api/admin/reports/custom - List user's saved reports
 * POST /api/admin/reports/custom - Create new custom report
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { validateReportConfig } from '@/lib/reports/report-builder';
import { logger } from '@/lib/utils/logger';

const createReportSchema = z.object({
  reportName: z.string().min(3).max(100),
  description: z.string().optional(),
  reportType: z.enum(['booking_analysis', 'revenue_report', 'customer_report', 'operations_report', 'custom_query']),
  dataSource: z.string(),
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['string', 'number', 'currency', 'date', 'percent', 'boolean']),
    aggregation: z.enum(['sum', 'count', 'avg', 'min', 'max']).optional(),
  })),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.unknown(),
  })).optional(),
  grouping: z.array(z.object({
    field: z.string(),
    label: z.string().optional(),
  })).optional(),
  sorting: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
  chartType: z.enum(['table', 'bar', 'line', 'pie', 'area', 'scatter']).optional(),
  chartConfig: z.record(z.unknown()).optional(),
  isPublic: z.boolean().default(false),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('reportType');

  try {
    // Get user's reports and public reports
    let query = supabase
      .from('custom_reports')
      .select(`
        id,
        report_name,
        description,
        report_type,
        data_source,
        chart_type,
        is_public,
        created_by,
        created_at,
        updated_at
      `)
      .or(`created_by.eq.${user.id},is_public.eq.true`)
      .order('updated_at', { ascending: false });

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data: reports, error } = await query;

    if (error) {
      logger.error('Failed to fetch custom reports', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // Mark which ones are owned by current user
    const mappedReports = (reports || []).map(report => ({
      ...report,
      isOwner: report.created_by === user.id,
    }));

    return NextResponse.json({ reports: mappedReports });
  } catch (error) {
    logger.error('Unexpected error in reports API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = createReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    reportName,
    description,
    reportType,
    dataSource,
    columns,
    filters,
    grouping,
    sorting,
    chartType,
    chartConfig,
    isPublic,
  } = parsed.data;

  // Validate report configuration
  const validation = validateReportConfig({
    dataSource,
    columns: columns.map(c => ({
      key: c.key,
      label: c.label,
      type: c.type,
      aggregation: c.aggregation,
    })),
    filters: filters?.map(f => ({
      field: f.field,
      operator: f.operator as 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between',
      value: f.value,
    })),
    sorting: sorting?.map(s => ({
      field: s.field,
      direction: s.direction,
    })),
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid report configuration', details: validation.errors },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();

  try {
    // Create report
    const { data: report, error: createError } = await supabase
      .from('custom_reports')
      .insert({
        report_name: reportName,
        description: description || null,
        report_type: reportType,
        data_source: dataSource,
        columns,
        filters: filters || null,
        grouping: grouping || null,
        sorting: sorting || null,
        chart_type: chartType || 'table',
        chart_config: chartConfig || null,
        is_public: isPublic,
        created_by: user.id,
      })
      .select('id, report_name')
      .single();

    if (createError) {
      logger.error('Failed to create report', createError);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    logger.info('Custom report created', {
      reportId: report?.id,
      reportName,
      reportType,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Report created successfully',
      report,
    });
  } catch (error) {
    logger.error('Unexpected error in create report', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

