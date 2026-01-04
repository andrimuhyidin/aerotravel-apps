/**
 * API: Get Supervisors List
 * GET /api/guide/profile/supervisors - Get list of potential supervisors for dropdown
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get potential supervisors (ops_admin, super_admin)
  let supervisorsQuery = client
    .from('users')
    .select('id, full_name, role')
    .in('role', ['ops_admin', 'super_admin'])
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  // Branch filter (if not super admin)
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    supervisorsQuery = supervisorsQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: supervisors, error } = await supervisorsQuery;

  if (error) {
    logger.error('Failed to fetch supervisors', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch supervisors' }, { status: 500 });
  }

  return NextResponse.json({
    supervisors:
      supervisors?.map((s: { id: string; full_name: string; role: string }) => ({
        id: s.id,
        name: s.full_name,
        role: s.role,
      })) || [],
  });
});

