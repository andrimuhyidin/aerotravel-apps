/**
 * API: Get Training Session Attendees
 * GET /api/admin/guide/training/sessions/[id]/attendees - Get list of attendees
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

  // Get attendees
  const { data: attendees, error } = await client
    .from('training_attendance')
    .select(`
      id,
      guide_id,
      status,
      guide:users!guide_id(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('session_id', sessionId)
    .eq('status', 'present');

  if (error) {
    logger.error('Failed to fetch attendees', error);
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
  }

  return NextResponse.json({ attendees: attendees || [] });
});

