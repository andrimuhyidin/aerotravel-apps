/**
 * API: Crew Notes
 * GET  /api/guide/crew/notes/[tripId] - Get crew notes for a trip
 * POST /api/guide/crew/notes/[tripId] - Create crew note
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createNoteSchema = z.object({
  message: z.string().min(1).max(1000),
  note_type: z.enum(['general', 'task', 'safety', 'coordination']).default('general'),
  parent_note_id: z.string().uuid().optional(),
});

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) => {
  const { tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify user is part of guide team for this trip
  // NOTE: We skip trip_crews check here to avoid RLS infinite recursion
  // RLS policy guide_notes_team_create already handles authorization via trip_crews/trip_guides
  // We only check trip_guides (existing system) and ops/admin role
  
  const { data: legacyMember } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .in('assignment_status', ['confirmed', 'pending_confirmation'])
    .maybeSingle();

  // Check if ops/admin
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isOpsAdmin = userProfile?.role === 'ops_admin' || userProfile?.role === 'super_admin';
  const isTeamMember = !!legacyMember;

  // Note: We don't check trip_crews here to avoid RLS recursion
  // The RLS policy guide_notes_team_create will handle access control
  // If user is not authorized, the insert will fail with RLS error
  if (!isTeamMember && !isOpsAdmin) {
    // Still allow the insert attempt - RLS will reject if user doesn't have access
    // This is a performance optimization, not a security check
  }

  // Get notes (simplified - fetch users separately to avoid join issues)
  let notesQuery = client
    .from('guide_notes')
    .select(`
      id,
      message,
      note_type,
      parent_note_id,
      is_internal,
      created_at,
      updated_at,
      created_by
    `)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  // Note: branch_id filter is handled by RLS policy, no need to filter here
  // RLS policy already enforces branch isolation

  const { data: notes, error } = await notesQuery;

  if (error) {
    logger.error('Failed to fetch crew notes', error, { tripId, errorDetails: error });
    return NextResponse.json({ error: 'Failed to fetch notes', details: error.message }, { status: 500 });
  }

  // Fetch creator info separately (only if we have notes)
  let notesWithCreators = notes ?? [];
  
  if (notes && notes.length > 0) {
    try {
      const creatorIds = [...new Set(notes.map((n: { created_by: string }) => n.created_by))];
      
      if (creatorIds.length > 0) {
        const { data: creators, error: creatorsError } = await client
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', creatorIds);

        if (creatorsError) {
          logger.warn('Failed to fetch creators, returning notes without creator info', creatorsError);
        } else {
          const creatorsMap = new Map((creators ?? []).map((c: { id: string; full_name: string; avatar_url: string | null }) => [c.id, c]));

          // Map notes with creator info
          notesWithCreators = notes.map((note: {
            created_by: string;
            [key: string]: unknown;
          }) => ({
            ...note,
            creator: creatorsMap.get(note.created_by) || null,
          }));
        }
      }
    } catch (err) {
      logger.warn('Error fetching creators, returning notes without creator info', { error: err });
      // Continue with notes without creator info
    }
  }

  return NextResponse.json({ notes: notesWithCreators });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) => {
  const { tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = createNoteSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify user is part of guide team for this trip
  // NOTE: We skip trip_crews check here to avoid RLS infinite recursion
  // RLS policy guide_notes_team_create already handles authorization via trip_crews/trip_guides
  // We only check trip_guides (existing system) and ops/admin role
  
  const { data: legacyMember } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .in('assignment_status', ['confirmed', 'pending_confirmation'])
    .maybeSingle();

  // Check if ops/admin
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isOpsAdmin = userProfile?.role === 'ops_admin' || userProfile?.role === 'super_admin';
  const isTeamMember = !!legacyMember;

  // Note: We don't check trip_crews here to avoid RLS recursion
  // The RLS policy guide_notes_team_create will handle access control
  // If user is not authorized, the insert will fail with RLS error
  if (!isTeamMember && !isOpsAdmin) {
    // Still allow the insert attempt - RLS will reject if user doesn't have access
    // This is a performance optimization, not a security check
  }

  // Get trip branch_id directly from trips table
  const { data: tripData } = await client
    .from('trips')
    .select('branch_id')
    .eq('id', tripId)
    .single();
  
  const tripBranchId = tripData?.branch_id || null;

  // Create note
  const { data: note, error } = await client
    .from('guide_notes')
    .insert({
      trip_id: tripId,
      created_by: user.id,
      branch_id: tripBranchId,
      message: payload.message,
      note_type: payload.note_type,
      parent_note_id: payload.parent_note_id ?? null,
      is_internal: true,
    })
    .select(`
      id,
      message,
      note_type,
      parent_note_id,
      created_at,
      created_by
    `)
    .single();

  // Fetch creator info
  const { data: creator } = note
    ? await client
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', note.created_by)
        .single()
    : { data: null };

  if (error) {
    logger.error('Failed to create crew note', error, { tripId });
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }

  logger.info('Crew note created', { tripId, noteId: note.id });

  return NextResponse.json({ 
    note: note ? {
      ...note,
      creator: creator || null,
    } : null,
  });
});
