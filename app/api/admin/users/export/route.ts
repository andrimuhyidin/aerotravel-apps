/**
 * API: Admin - Export Users
 * GET /api/admin/users/export - Export users to Excel
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient } from '@/lib/supabase/server';
import { ReportExporter } from '@/lib/excel/export';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);
  
  const role = searchParams.get('role') || 'all';
  const status = searchParams.get('status') || 'all';

  try {
    let query = supabase
      .from('users')
      .select('id, full_name, email, phone, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (role !== 'all') {
      query = query.eq('role', role);
    }

    if (status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    const { data: users, error } = await query;

    if (error) {
      logger.error('Failed to fetch users for export', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const exportData = (users || []).map(user => ({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '-',
      role: user.role,
      status: user.is_active ? 'Active' : 'Inactive',
      created_at: user.created_at,
    }));

    const buffer = await ReportExporter.users(exportData);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    logger.error('Export users error', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
});

