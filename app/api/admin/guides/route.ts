/**
 * API: Admin Guides List
 * GET /api/admin/guides - List all guides for selection
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  // Check admin role
  const isAuthorized = await hasRole([
    'super_admin',
    'ops_admin',
    'finance_manager',
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get all guides
  const { data: guides, error } = await withBranchFilter(
    client.from('users'),
    branchContext,
  )
    .select('id, full_name, email, phone, role')
    .eq('role', 'guide')
    .order('full_name', { ascending: true });

  if (error) {
    logger.error('Failed to load guides', error);
    return NextResponse.json({ error: 'Failed to load guides' }, { status: 500 });
  }

  return NextResponse.json({
    guides: guides ?? [],
  });
});
