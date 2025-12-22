/**
 * API: Safety Briefing Video
 * GET /api/guide/trips/[id]/briefing/video - Get video briefing for trip
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'id';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify guide assignment
  const client = supabase as unknown as any;
  const { data: assignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment && !crewAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);

  // Get video briefing
  const { data: video, error } = await withBranchFilter(
    client.from('safety_briefing_videos'),
    branchContext,
  )
    .select('*')
    .eq('trip_id', tripId)
    .eq('language', language)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch video briefing', error, { tripId, language });
    return NextResponse.json({ error: 'Failed to fetch video briefing' }, { status: 500 });
  }

  if (!video) {
    return NextResponse.json({ video: null });
  }

  return NextResponse.json({
    video: {
      id: video.id,
      title: video.video_title,
      description: video.video_description,
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url,
      durationSeconds: video.duration_seconds,
      fileSizeBytes: video.file_size_bytes,
      language: video.language,
      isAvailableOffline: video.is_available_offline,
      offlineDownloadUrl: video.offline_download_url,
    },
  });
});

