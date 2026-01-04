/**
 * API: Guide Stories (Instagram-like ephemeral stories)
 * GET /api/guide/social/stories - Get active stories
 * POST /api/guide/social/stories - Create a story
 * 
 * Stories expire after 24 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createStorySchema = z.object({
  media_url: z.string().url(),
  media_type: z.enum(['image', 'video']),
  caption: z.string().max(500).optional(),
  trip_id: z.string().uuid().optional(),
  location: z.string().optional(),
  duration_seconds: z.number().min(3).max(15).default(5),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get stories from last 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  let storiesQuery = client
    .from('guide_stories')
    .select(`
      id,
      guide_id,
      media_url,
      media_type,
      caption,
      location,
      duration_seconds,
      views_count,
      created_at,
      expires_at,
      guide:users!guide_stories_guide_id_fkey(
        id,
        full_name,
        avatar_url
      ),
      views:guide_story_views(
        viewer_id
      )
    `)
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: false });

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    storiesQuery = storiesQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: stories, error } = await storiesQuery;

  if (error) {
    logger.error('Failed to fetch stories', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }

  // Group stories by guide
  const groupedStories = (stories || []).reduce((acc: Record<string, any>, story: any) => {
    const guideId = story.guide_id;
    if (!acc[guideId]) {
      acc[guideId] = {
        guide: story.guide,
        stories: [],
        has_unseen: false,
      };
    }
    
    // Check if current user has viewed this story
    const hasViewed = story.views?.some((v: { viewer_id: string }) => v.viewer_id === user.id);
    if (!hasViewed) {
      acc[guideId].has_unseen = true;
    }
    
    acc[guideId].stories.push({
      ...story,
      has_viewed: hasViewed,
    });
    
    return acc;
  }, {});

  // Convert to array and sort (unseen first, then by most recent)
  const storyGroups = Object.values(groupedStories).sort((a: any, b: any) => {
    // Current user's stories first
    if (a.guide.id === user.id) return -1;
    if (b.guide.id === user.id) return 1;
    // Then unseen stories
    if (a.has_unseen && !b.has_unseen) return -1;
    if (!a.has_unseen && b.has_unseen) return 1;
    // Then by most recent
    return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
  });

  // Get current user's story count
  const myStories = (stories || []).filter((s: { guide_id: string }) => s.guide_id === user.id);

  return NextResponse.json({
    story_groups: storyGroups,
    my_stories_count: myStories.length,
    total_stories: (stories || []).length,
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = createStorySchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Calculate expiry (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data: story, error } = await withBranchFilter(
    client.from('guide_stories'),
    branchContext,
  ).insert({
    guide_id: user.id,
    media_url: payload.media_url,
    media_type: payload.media_type,
    caption: payload.caption || null,
    trip_id: payload.trip_id || null,
    location: payload.location || null,
    duration_seconds: payload.duration_seconds,
    views_count: 0,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  } as never).select().single();

  if (error) {
    logger.error('Failed to create story', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }

  logger.info('Story created', { storyId: story.id, guideId: user.id });

  return NextResponse.json({
    story,
    message: 'Story created successfully',
  });
});

