/**
 * API: Admin - Execute Custom Report
 * POST /api/admin/reports/custom/[id]/execute - Run a saved report
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { executeReport, ReportConfig, ReportFilter, ReportColumn, ReportSorting } from '@/lib/reports/report-builder';
import { logger } from '@/lib/utils/logger';

const executeReportSchema = z.object({
  additionalFilters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.unknown(),
  })).optional(),
  limit: z.number().int().min(1).max(10000).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: reportId } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse optional request body
  let additionalFilters: { field: string; operator: string; value: unknown }[] = [];
  let limit: number | undefined;
  
  try {
    const body = await request.json();
    const parsed = executeReportSchema.safeParse(body);
    if (parsed.success) {
      additionalFilters = parsed.data.additionalFilters || [];
      limit = parsed.data.limit;
    }
  } catch {
    // Empty body is fine
  }

  const supabase = await createAdminClient();

  try {
    // Get report configuration
    const { data: report, error: fetchError } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check access
    if (report.created_by !== user.id && !report.is_public && !(report.shared_with || []).includes(user.id)) {
      return NextResponse.json(
        { error: 'Access denied to this report' },
        { status: 403 }
      );
    }

    // Build report config
    const baseFilters = (report.filters || []) as ReportFilter[];
    const mergedFilters = [
      ...baseFilters,
      ...additionalFilters.map(f => ({
        field: f.field,
        operator: f.operator as ReportFilter['operator'],
        value: f.value,
      })),
    ];

    const config: ReportConfig = {
      dataSource: report.data_source,
      columns: (report.columns as ReportColumn[]) || [],
      filters: mergedFilters.length > 0 ? mergedFilters : undefined,
      sorting: (report.sorting as ReportSorting[]) || undefined,
      limit: limit || 1000,
    };

    // Execute report
    const result = await executeReport(config);

    // Log the run
    await supabase.from('report_runs').insert({
      report_id: reportId,
      run_type: 'manual',
      status: 'completed',
      filters_used: mergedFilters.length > 0 ? mergedFilters : null,
      result_count: result.totalCount,
      completed_at: new Date().toISOString(),
      triggered_by: user.id,
    });

    logger.info('Report executed', {
      reportId,
      reportName: report.report_name,
      resultCount: result.totalCount,
      executionTime: result.executionTime,
      triggeredBy: user.id,
    });

    return NextResponse.json({
      success: true,
      report: {
        id: reportId,
        name: report.report_name,
        chartType: report.chart_type,
        chartConfig: report.chart_config,
      },
      result: {
        data: result.data,
        totalCount: result.totalCount,
        aggregations: result.aggregations,
        executionTime: result.executionTime,
      },
      columns: report.columns,
    });
  } catch (error) {
    logger.error('Report execution error', error);

    // Log failed run
    await supabase.from('report_runs').insert({
      report_id: reportId,
      run_type: 'manual',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      completed_at: new Date().toISOString(),
      triggered_by: user.id,
    });

    return NextResponse.json(
      { error: 'Failed to execute report' },
      { status: 500 }
    );
  }
});

