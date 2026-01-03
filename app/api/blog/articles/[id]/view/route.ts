/**
 * API: Record Blog Article View
 * POST /api/blog/articles/[id]/view
 * Increments view count for a blog article
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
  const { id: articleId } = await params;

  // Use the database function for atomic increment
  const { error } = await supabase.rpc('increment_blog_article_views', {
    article_id: articleId,
  });

  if (error) {
    logger.error('Failed to increment article views', error, { articleId });
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }

  return NextResponse.json({ viewed: true });
});

