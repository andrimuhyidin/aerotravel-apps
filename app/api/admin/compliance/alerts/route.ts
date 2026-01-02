/**
 * API: Compliance Alerts Management
 * GET /api/admin/compliance/alerts - List alerts
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/compliance/alerts
 * List compliance alerts with filters
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin', 'finance_manager', 'investor'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const isRead = searchParams.get('isRead'); // 'true', 'false', or null for all
  const isResolved = searchParams.get('isResolved'); // 'true', 'false', or null for all
  const severity = searchParams.get('severity'); // 'info', 'warning', 'critical'
  const licenseId = searchParams.get('licenseId'); // Filter by specific license
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  logger.info('GET /api/admin/compliance/alerts', { isRead, isResolved, severity, page, limit });

  // Build query
  let query = supabase
    .from('compliance_alerts')
    .select(`
      *,
      license:business_licenses (
        id,
        license_type,
        license_number,
        license_name,
        status
      ),
      read_by_user:users!compliance_alerts_read_by_fkey (
        id,
        full_name
      ),
      resolved_by_user:users!compliance_alerts_resolved_by_fkey (
        id,
        full_name
      )
    `, { count: 'exact' });

  // Apply filters
  if (isRead !== null) {
    query = query.eq('is_read', isRead === 'true');
  }

  if (isResolved !== null) {
    query = query.eq('is_resolved', isResolved === 'true');
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (licenseId) {
    query = query.eq('license_id', licenseId);
  }

  // Order by severity (critical first) and created_at (newest first)
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: alerts, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch alerts', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }

  const enrichedAlerts = (alerts || []).map((alert) => {
    const a = alert as {
      id: string;
      license_id: string;
      alert_type: string;
      severity: string;
      message: string;
      is_read: boolean;
      is_resolved: boolean;
      read_at: string | null;
      resolved_at: string | null;
      resolution_notes: string | null;
      email_sent: boolean;
      whatsapp_sent: boolean;
      push_sent: boolean;
      created_at: string;
      license: {
        id: string;
        license_type: string;
        license_number: string;
        license_name: string;
        status: string;
      } | null;
      read_by_user: { id: string; full_name: string } | null;
      resolved_by_user: { id: string; full_name: string } | null;
    };

    return {
      id: a.id,
      licenseId: a.license_id,
      alertType: a.alert_type,
      severity: a.severity,
      message: a.message,
      isRead: a.is_read,
      isResolved: a.is_resolved,
      readAt: a.read_at,
      resolvedAt: a.resolved_at,
      resolutionNotes: a.resolution_notes,
      notificationsSent: {
        email: a.email_sent,
        whatsapp: a.whatsapp_sent,
        push: a.push_sent,
      },
      createdAt: a.created_at,
      license: a.license ? {
        id: a.license.id,
        type: a.license.license_type,
        number: a.license.license_number,
        name: a.license.license_name,
        status: a.license.status,
      } : null,
      readBy: a.read_by_user?.full_name || null,
      resolvedBy: a.resolved_by_user?.full_name || null,
    };
  });

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('compliance_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  return NextResponse.json({
    alerts: enrichedAlerts,
    unreadCount: unreadCount || 0,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
});

