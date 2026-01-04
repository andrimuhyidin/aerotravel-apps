/**
 * API: Admin - Export Audit Logs
 * GET /api/admin/audit-log/export - Export audit logs to Excel
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient } from '@/lib/supabase/server';
import { ReportExporter } from '@/lib/excel/export';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);
  
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const action = searchParams.get('action');
  const limit = Math.min(parseInt(searchParams.get('limit') || '1000', 10), 5000);

  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data: logs, error } = await query;

    if (error) {
      logger.error('Failed to fetch audit logs for export', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    // Get user names
    const userIds = [...new Set((logs || []).map(log => log.user_id).filter(Boolean))];
    let usersMap: Record<string, string> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', userIds);
      
      if (users) {
        usersMap = Object.fromEntries(users.map(u => [u.id, u.full_name || 'Unknown']));
      }
    }

    const exportData = (logs || []).map(log => ({
      created_at: log.created_at,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      user_name: log.user_id ? usersMap[log.user_id] || 'Unknown' : 'System',
      ip_address: log.ip_address || '-',
      details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '-',
    }));

    const buffer = await ReportExporter.auditLogs(exportData);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    logger.error('Export audit logs error', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
});

