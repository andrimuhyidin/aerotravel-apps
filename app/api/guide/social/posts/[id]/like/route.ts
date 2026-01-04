/**
 * API: Like/Unlike Social Post
 * POST /api/guide/social/posts/[id]/like - Toggle like
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id: postId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = supabase as unknown as any;

    // Check if already liked
    const { data: existingLike } = await client
      .from('guide_social_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      await client
        .from('guide_social_post_likes')
        .delete()
        .eq('id', existingLike.id);

      // Decrement likes count (fallback method)
      const { data: post } = await client
        .from('guide_social_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (post) {
        await client
          .from('guide_social_posts')
          .update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) })
          .eq('id', postId);
      }

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await client.from('guide_social_post_likes').insert({
        post_id: postId,
        guide_id: user.id,
      });

      // Increment likes count (fallback method)
      const { data: post } = await client
        .from('guide_social_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (post) {
        await client
          .from('guide_social_posts')
          .update({ likes_count: (post.likes_count || 0) + 1 })
          .eq('id', postId);
      }

      return NextResponse.json({ liked: true });
    }
  }
);
