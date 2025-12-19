/**
 * API: Guide Social Feed
 * GET  /api/guide/social/feed - Get social feed posts
 * POST /api/guide/social/feed - Create new post
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createPostSchema = z.object({
  caption: z.string().min(1).max(1000),
  photos: z.array(z.string().url()).max(10),
  trip_id: z.string().uuid().optional(),
  is_public: z.boolean().default(true),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const client = supabase as unknown as any;

  // Get public posts and own posts
  const { data: posts, error } = await client
    .from('guide_social_posts')
    .select(`
      id,
      guide_id,
      caption,
      photos,
      trip_id,
      likes_count,
      comments_count,
      is_public,
      created_at,
      guide:users!guide_social_posts_guide_id_fkey(full_name, avatar_url),
      trip:trips(trip_code, trip_date)
    `)
    .or(`is_public.eq.true,guide_id.eq.${user.id}`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Check which posts user liked
  const postIds = (posts || []).map((p: { id: string }) => p.id);
  const likedPosts = new Set<string>();
  if (postIds.length > 0) {
    const { data: likes } = await client
      .from('guide_social_post_likes')
      .select('post_id')
      .eq('guide_id', user.id)
      .in('post_id', postIds);
    
    (likes || []).forEach((like: { post_id: string }) => {
      likedPosts.add(like.post_id);
    });
  }

  if (error) {
    logger.error('Failed to fetch social feed', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }

  // Format posts
  const formattedPosts = (posts || []).map((post: any) => ({
    id: post.id,
    guideId: post.guide_id,
    guideName: post.guide?.full_name || 'Unknown',
    guideAvatar: post.guide?.avatar_url || null,
    caption: post.caption,
    photos: post.photos || [],
    tripCode: post.trip?.trip_code || null,
    tripDate: post.trip?.trip_date || null,
    likesCount: post.likes_count || 0,
    commentsCount: post.comments_count || 0,
    isPublic: post.is_public,
    isLiked: likedPosts.has(post.id),
    createdAt: post.created_at,
  }));

  return NextResponse.json({ posts: formattedPosts });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = createPostSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data: post, error } = await client
    .from('guide_social_posts')
    .insert({
      guide_id: user.id,
      caption: payload.caption,
      photos: payload.photos,
      trip_id: payload.trip_id || null,
      is_public: payload.is_public,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create social post', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }

  return NextResponse.json({ post });
});

