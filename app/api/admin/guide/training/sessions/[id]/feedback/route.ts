/**
 * API: Get Training Session Feedbacks
 * GET /api/admin/guide/training/sessions/[id]/feedback - Get existing feedbacks
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: sessionId } = await params;
  const allowed = await hasRole(['super_admin', 'ops_admin']);

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get feedbacks
  const { data: feedbacks, error } = await client
    .from('training_feedback')
    .select(`
      id,
      guide_id,
      rating,
      comment,
      guide:users!guide_id(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('session_id', sessionId);

  if (error) {
    logger.error('Failed to fetch feedbacks', error);
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
  }

  return NextResponse.json({ feedbacks: feedbacks || [] });
});
