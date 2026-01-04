/**
 * API: Guide Mentorship System
 * GET /api/guide/mentorship - Get mentorship data
 * POST /api/guide/mentorship - Create mentorship pairing
 * 
 * PRD: Mentor-Mentee Pairing for new guides
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createMentorshipSchema = z.object({
  mentee_id: z.string().uuid(),
  mentor_id: z.string().uuid(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  goals: z.array(z.string()).optional(),
  notes: z.string().optional(),
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

  // Check if user is a mentor or mentee
  let mentorshipQuery = client
    .from('guide_mentorships')
    .select(`
      id,
      mentor_id,
      mentee_id,
      status,
      start_date,
      end_date,
      goals,
      notes,
      progress_percentage,
      created_at,
      updated_at,
      mentor:users!guide_mentorships_mentor_id_fkey(
        id,
        full_name,
        avatar_url,
        email
      ),
      mentee:users!guide_mentorships_mentee_id_fkey(
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    mentorshipQuery = mentorshipQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: mentorships, error } = await mentorshipQuery;

  if (error) {
    logger.error('Failed to fetch mentorships', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch mentorships' }, { status: 500 });
  }

  // Separate into mentor and mentee relationships
  const asMentor = (mentorships || []).filter((m: { mentor_id: string }) => m.mentor_id === user.id);
  const asMentee = (mentorships || []).filter((m: { mentee_id: string }) => m.mentee_id === user.id);

  // Get available mentors (senior guides with good ratings)
  let mentorsQuery = client
    .from('users')
    .select(`
      id,
      full_name,
      avatar_url,
      guide_profiles:guide_profiles(
        experience_years,
        specializations,
        is_senior_guide,
        average_rating,
        total_trips
      )
    `)
    .eq('role', 'guide')
    .not('id', 'eq', user.id);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    mentorsQuery = mentorsQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: potentialMentors } = await mentorsQuery;

  // Filter to senior guides only
  const availableMentors = (potentialMentors || []).filter((u: any) => {
    const profile = u.guide_profiles?.[0];
    return profile?.is_senior_guide || (profile?.experience_years >= 2 && profile?.total_trips >= 20);
  });

  // Get user's own profile to check if they can be a mentor
  const { data: userProfile } = await client
    .from('guide_profiles')
    .select('experience_years, is_senior_guide, total_trips')
    .eq('user_id', user.id)
    .single();

  const canBeMentor = userProfile?.is_senior_guide || 
    (userProfile?.experience_years >= 2 && userProfile?.total_trips >= 20);

  return NextResponse.json({
    as_mentor: asMentor,
    as_mentee: asMentee,
    available_mentors: availableMentors,
    can_be_mentor: canBeMentor,
    total_mentorships: (mentorships || []).length,
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = createMentorshipSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Check if mentorship already exists
  const { data: existing } = await client
    .from('guide_mentorships')
    .select('id')
    .eq('mentor_id', payload.mentor_id)
    .eq('mentee_id', payload.mentee_id)
    .eq('status', 'active')
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Mentorship already exists' }, { status: 400 });
  }

  // Create mentorship
  const { data: mentorship, error } = await withBranchFilter(
    client.from('guide_mentorships'),
    branchContext,
  ).insert({
    mentor_id: payload.mentor_id,
    mentee_id: payload.mentee_id,
    status: 'pending',
    start_date: payload.start_date || new Date().toISOString(),
    end_date: payload.end_date || null,
    goals: payload.goals || [],
    notes: payload.notes || null,
    progress_percentage: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as never).select().single();

  if (error) {
    logger.error('Failed to create mentorship', error, { userId: user.id, payload });
    return NextResponse.json({ error: 'Failed to create mentorship' }, { status: 500 });
  }

  logger.info('Mentorship created', { mentorshipId: mentorship.id, mentorId: payload.mentor_id, menteeId: payload.mentee_id });

  return NextResponse.json({
    mentorship,
    message: 'Mentorship request sent successfully',
  });
});

