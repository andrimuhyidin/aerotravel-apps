/**
 * API: Guide Mentorship Detail
 * GET /api/guide/mentorship/[id] - Get mentorship details
 * PATCH /api/guide/mentorship/[id] - Update mentorship
 * DELETE /api/guide/mentorship/[id] - End mentorship
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateMentorshipSchema = z.object({
  status: z.enum(['pending', 'active', 'completed', 'cancelled']).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  goals: z.array(z.string()).optional(),
  notes: z.string().optional(),
  end_date: z.string().optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data: mentorship, error } = await client
    .from('guide_mentorships')
    .select(`
      *,
      mentor:users!guide_mentorships_mentor_id_fkey(
        id,
        full_name,
        avatar_url,
        email,
        phone
      ),
      mentee:users!guide_mentorships_mentee_id_fkey(
        id,
        full_name,
        avatar_url,
        email,
        phone
      ),
      sessions:mentorship_sessions(
        id,
        session_date,
        duration_minutes,
        topics,
        notes,
        completed
      )
    `)
    .eq('id', id)
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .single();

  if (error || !mentorship) {
    return NextResponse.json({ error: 'Mentorship not found' }, { status: 404 });
  }

  return NextResponse.json({ mentorship });
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;
  const payload = updateMentorshipSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify user is part of this mentorship
  const { data: existing } = await client
    .from('guide_mentorships')
    .select('id, mentor_id, mentee_id')
    .eq('id', id)
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Mentorship not found' }, { status: 404 });
  }

  const { data: updated, error } = await client
    .from('guide_mentorships')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update mentorship', error, { mentorshipId: id });
    return NextResponse.json({ error: 'Failed to update mentorship' }, { status: 500 });
  }

  logger.info('Mentorship updated', { mentorshipId: id, updates: payload });

  return NextResponse.json({ mentorship: updated });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify user is part of this mentorship
  const { data: existing } = await client
    .from('guide_mentorships')
    .select('id, mentor_id')
    .eq('id', id)
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Mentorship not found' }, { status: 404 });
  }

  // Soft delete by updating status
  const { error } = await client
    .from('guide_mentorships')
    .update({
      status: 'cancelled',
      end_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    logger.error('Failed to end mentorship', error, { mentorshipId: id });
    return NextResponse.json({ error: 'Failed to end mentorship' }, { status: 500 });
  }

  logger.info('Mentorship ended', { mentorshipId: id });

  return NextResponse.json({ success: true, message: 'Mentorship ended' });
});

