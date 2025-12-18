/**
 * API: Mark Broadcast as Read
 * POST /api/guide/broadcasts/[id]/read - Mark a broadcast as read
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: broadcastId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Upsert read status (ignore if already exists due to UNIQUE constraint)
    const { error: insertError } = await client
      .from('broadcast_reads')
      .insert({
        broadcast_id: broadcastId,
        guide_id: user.id,
        read_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      // Ignore unique constraint violation (already read)
      if (insertError.code !== '23505') {
        logger.error('Failed to mark broadcast as read', insertError, {
          broadcastId,
          guideId: user.id,
        });
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark broadcast as read', error, { broadcastId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
});
