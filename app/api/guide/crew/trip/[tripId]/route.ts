/**
 * API: Trip Crew Management
 * GET  /api/guide/crew/trip/[tripId] - Get crew members for a trip
 * POST /api/guide/crew/trip/[tripId] - Assign crew member (Admin only)
 * PUT  /api/guide/crew/trip/[tripId] - Update crew role/status
 * DELETE /api/guide/crew/trip/[tripId] - Remove crew member (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const assignCrewSchema = z.object({
  guide_id: z.string().uuid(),
  role: z.enum(['lead', 'support']),
  assignment_notes: z.string().optional(),
});

const updateCrewSchema = z.object({
  crew_id: z.string().uuid(), // This is trip_guides.id
  role: z.enum(['lead', 'support']).optional(),
  status: z.enum(['assigned', 'confirmed', 'cancelled', 'rejected']).optional(),
});

const removeCrewSchema = z.object({
  crew_id: z.string().uuid(),
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

  // Get crew members for this trip from trip_guides (existing system)
  // Map guide_role: 'lead' -> 'lead', 'assistant'/'driver'/'photographer' -> 'support'
  const crewQuery = client
    .from('trip_guides')
    .select(`
      id,
      guide_id,
      guide_role,
      assignment_status,
      assigned_at,
      confirmed_at,
      fee_amount,
      guide:users!trip_guides_guide_id_fkey(
        id,
        full_name,
        avatar_url,
        phone
      )
    `)
    .eq('trip_id', tripId)
    .in('assignment_status', ['confirmed', 'pending_confirmation']);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    // Get trip branch_id first
    const { data: tripData } = await client
      .from('trips')
      .select('branch_id')
      .eq('id', tripId)
      .single();
    
    if (tripData?.branch_id && tripData.branch_id !== branchContext.branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { data: tripGuidesData, error } = await crewQuery;

  if (error) {
    logger.error('Failed to fetch trip crew', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch crew' }, { status: 500 });
  }

  // Map trip_guides data to crew format
  // guide_role: 'lead' -> 'lead', others -> 'support'
  const crewMembers = (tripGuidesData ?? []).map((tg: {
    id: string;
    guide_id: string;
    guide_role: 'lead' | 'assistant' | 'driver' | 'photographer';
    assignment_status: string;
    assigned_at: string;
    confirmed_at: string | null;
    fee_amount: number;
    guide?: {
      id: string;
      full_name: string;
      avatar_url: string | null;
      phone: string | null;
    } | null;
  }) => ({
    id: tg.id,
    guide_id: tg.guide_id,
    role: tg.guide_role === 'lead' ? 'lead' : 'support' as 'lead' | 'support',
    status: tg.assignment_status === 'confirmed' ? 'confirmed' : 'assigned',
    assigned_at: tg.assigned_at,
    confirmed_at: tg.confirmed_at,
    assignment_notes: null,
    guide: tg.guide,
  }));

  // Check if current user is part of this crew
  const currentUserCrew = crewMembers.find((c: { guide_id: string }) => c.guide_id === user.id);
  const isLeadGuide = currentUserCrew?.role === 'lead';
  const isSupportGuide = currentUserCrew?.role === 'support';
  const isCrewMember = !!currentUserCrew;

  // Check if user is ops/admin
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isOpsAdmin = userProfile?.role === 'ops_admin' || userProfile?.role === 'super_admin';

  // Sort crew: lead first, then support
  const sortedCrew = crewMembers.sort((a: { role: string }, b: { role: string }) => {
    if (a.role === 'lead' && b.role !== 'lead') return -1;
    if (a.role !== 'lead' && b.role === 'lead') return 1;
    return 0;
  });

  return NextResponse.json({
    crew: sortedCrew,
    currentUserRole: currentUserCrew?.role ?? null,
    currentUserId: user.id, // Add current user ID for client-side checks
    isLeadGuide,
    isSupportGuide,
    isCrewMember,
    isOpsAdmin,
  });
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

  // Only ops/admin can assign crew
  const { data: userProfile } = await (supabase as unknown as any)
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'ops_admin' && userProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = assignCrewSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify trip exists and get branch_id
  const { data: trip } = await client
    .from('trips')
    .select('id, branch_id')
    .eq('id', tripId)
    .single();

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Branch isolation check
  if (!branchContext.isSuperAdmin && trip.branch_id !== branchContext.branchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if guide is already assigned in trip_guides
  const { data: existing } = await client
    .from('trip_guides')
    .select('id, guide_role, assignment_status')
    .eq('trip_id', tripId)
    .eq('guide_id', payload.guide_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Guide already assigned to this trip' }, { status: 409 });
  }

  // If assigning as lead, check if there's already a lead
  if (payload.role === 'lead') {
    const { data: existingLead } = await client
      .from('trip_guides')
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_role', 'lead')
      .eq('assignment_status', 'confirmed')
      .single();

    if (existingLead) {
      return NextResponse.json({ error: 'Trip already has a lead guide' }, { status: 409 });
    }
  }

  // Map role to guide_role: 'lead' -> 'lead', 'support' -> 'assistant'
  const guideRole = payload.role === 'lead' ? 'lead' : 'assistant';

  // Insert crew assignment to trip_guides (existing system)
  const { data: crewAssignment, error } = await client
    .from('trip_guides')
    .insert({
      trip_id: tripId,
      guide_id: payload.guide_id,
      guide_role: guideRole,
      assignment_status: 'pending_confirmation',
      fee_amount: 0, // Will be set by admin later
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to assign crew', error, { tripId, guideId: payload.guide_id });
    return NextResponse.json({ error: 'Failed to assign crew' }, { status: 500 });
  }

  logger.info('Crew assigned', { tripId, guideId: payload.guide_id, role: payload.role, guideRole });

  // Return mapped format
  return NextResponse.json({
    crew: {
      id: crewAssignment.id,
      guide_id: crewAssignment.guide_id,
      role: payload.role,
      status: 'assigned',
      assigned_at: crewAssignment.assigned_at,
      confirmed_at: null,
      assignment_notes: payload.assignment_notes ?? null,
    },
  });
});

export const PUT = withErrorHandler(async (
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

  const payload = updateCrewSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get crew assignment from trip_guides
  const { data: crewAssignment } = await client
    .from('trip_guides')
    .select('*, trip:trips(branch_id)')
    .eq('id', payload.crew_id)
    .eq('trip_id', tripId)
    .single();

  if (!crewAssignment) {
    return NextResponse.json({ error: 'Crew assignment not found' }, { status: 404 });
  }

  // Check permissions
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isOpsAdmin = userProfile?.role === 'ops_admin' || userProfile?.role === 'super_admin';
  const isOwnAssignment = crewAssignment.guide_id === user.id;

  // Only ops/admin can change role, but guide can confirm their own assignment
  if (payload.role && !isOpsAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Guide can confirm their own assignment (change from pending_confirmation to confirmed)
  if (payload.status === 'confirmed' && isOwnAssignment) {
    // Allow guide to confirm their own assignment
  } else if (payload.status && !isOpsAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Branch isolation
  const tripBranchId = (crewAssignment.trip as { branch_id: string | null })?.branch_id;
  if (!branchContext.isSuperAdmin && tripBranchId !== branchContext.branchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update crew assignment in trip_guides
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.role) {
    // Map role to guide_role
    updateData.guide_role = payload.role === 'lead' ? 'lead' : 'assistant';
  }

  if (payload.status) {
    // Map status to assignment_status
    if (payload.status === 'confirmed') {
      updateData.assignment_status = 'confirmed';
      updateData.confirmed_at = new Date().toISOString();
    } else if (payload.status === 'rejected') {
      updateData.assignment_status = 'rejected';
      updateData.rejected_at = new Date().toISOString();
    } else if (payload.status === 'cancelled') {
      updateData.assignment_status = 'rejected'; // Use rejected for cancelled
      updateData.rejected_at = new Date().toISOString();
    } else {
      updateData.assignment_status = 'pending_confirmation';
    }
  }

  const { data: updatedCrew, error } = await client
    .from('trip_guides')
    .update(updateData)
    .eq('id', payload.crew_id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update crew', error, { crewId: payload.crew_id });
    return NextResponse.json({ error: 'Failed to update crew' }, { status: 500 });
  }

  logger.info('Crew updated', { crewId: payload.crew_id, updates: updateData });

  // Return mapped format
  return NextResponse.json({
    crew: {
      id: updatedCrew.id,
      guide_id: updatedCrew.guide_id,
      role: updatedCrew.guide_role === 'lead' ? 'lead' : 'support',
      status: updatedCrew.assignment_status === 'confirmed' ? 'confirmed' : 'assigned',
      assigned_at: updatedCrew.assigned_at,
      confirmed_at: updatedCrew.confirmed_at,
      assignment_notes: null,
    },
  });
});

export const DELETE = withErrorHandler(async (
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

  // Only ops/admin can remove crew
  const { data: userProfile } = await (supabase as unknown as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'ops_admin' && userProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = removeCrewSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get crew assignment from trip_guides
  const { data: crewAssignment } = await client
    .from('trip_guides')
    .select('*, trip:trips(branch_id)')
    .eq('id', payload.crew_id)
    .eq('trip_id', tripId)
    .single();

  if (!crewAssignment) {
    return NextResponse.json({ error: 'Crew assignment not found' }, { status: 404 });
  }

  // Branch isolation
  const tripBranchId = (crewAssignment.trip as { branch_id: string | null })?.branch_id;
  if (!branchContext.isSuperAdmin && tripBranchId !== branchContext.branchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete crew assignment from trip_guides
  const { error } = await client
    .from('trip_guides')
    .delete()
    .eq('id', payload.crew_id);

  if (error) {
    logger.error('Failed to remove crew', error, { crewId: payload.crew_id });
    return NextResponse.json({ error: 'Failed to remove crew' }, { status: 500 });
  }

  logger.info('Crew removed', { crewId: payload.crew_id, tripId, guideId: crewAssignment.guide_id });

  return NextResponse.json({ success: true });
});
