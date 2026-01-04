/**
 * API: Record Story View
 * POST /api/guide/social/stories/[id]/view
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: storyId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Check if already viewed
  const { data: existingView } = await client
    .from('guide_story_views')
    .select('id')
    .eq('story_id', storyId)
    .eq('viewer_id', user.id)
    .single();

  if (existingView) {
    return NextResponse.json({ already_viewed: true });
  }

  // Record view
  const { error: viewError } = await client
    .from('guide_story_views')
    .insert({
      story_id: storyId,
      viewer_id: user.id,
      viewed_at: new Date().toISOString(),
    });

  if (viewError) {
    logger.error('Failed to record story view', viewError, { storyId, viewerId: user.id });
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }

  // Increment view count
  const { error: updateError } = await client
    .from('guide_stories')
    .update({ views_count: client.raw('views_count + 1') })
    .eq('id', storyId);

  if (updateError) {
    logger.warn('Failed to increment view count', { storyId, error: updateError });
  }

  return NextResponse.json({ viewed: true });
});

