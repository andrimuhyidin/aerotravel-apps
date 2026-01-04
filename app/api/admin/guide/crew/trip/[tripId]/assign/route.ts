/**
 * Admin API: Assign Guides to Trip
 * POST /api/admin/guide/crew/trip/[tripId]/assign
 * Admin-only endpoint for assigning guide members
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const assignCrewSchema = z.object({
  guide_ids: z.array(z.string().uuid()).min(1),
  roles: z.array(z.enum(['lead', 'support'])).optional(), // Optional: if not provided, first is lead, rest are support
  assignment_notes: z.string().optional(),
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

  // Only ops/admin can assign guides
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

  // Verify trip exists
  const { data: trip } = await client
    .from('trips')
    .select('id, branch_id')
    .eq('id', tripId)
    .single();

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Branch isolation
  if (!branchContext.isSuperAdmin && trip.branch_id !== branchContext.branchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Determine roles: if roles array provided, use it; otherwise first is lead, rest are support
  const roles = payload.roles ?? [
    'lead',
    ...Array(payload.guide_ids.length - 1).fill('support'),
  ] as ('lead' | 'support')[];

  // Ensure only one lead
  const leadCount = roles.filter((r) => r === 'lead').length;
  if (leadCount > 1) {
    return NextResponse.json({ error: 'Only one lead guide allowed per trip' }, { status: 400 });
  }

  // Check existing assignments
  const { data: existing } = await client
    .from('trip_crews')
    .select('guide_id')
    .eq('trip_id', tripId);

  const existingGuideIds = new Set((existing ?? []).map((e: { guide_id: string }) => e.guide_id));
  const newGuideIds = payload.guide_ids.filter((id) => !existingGuideIds.has(id));

  if (newGuideIds.length === 0) {
    return NextResponse.json({ error: 'All guides already assigned' }, { status: 409 });
  }

  // Insert guide assignments
  const assignments = newGuideIds.map((guideId, index) => {
    const roleIndex = payload.guide_ids.indexOf(guideId);
    return {
      trip_id: tripId,
      guide_id: guideId,
      branch_id: trip.branch_id,
      role: roles[roleIndex] || 'support',
      status: 'assigned',
      assigned_by: user.id,
      assignment_notes: payload.assignment_notes ?? null,
    };
  });

  const { data: createdAssignments, error } = await client
    .from('trip_crews')
    .insert(assignments)
    .select();

  if (error) {
    logger.error('Failed to assign guides', error, { tripId, guideIds: newGuideIds });
    return NextResponse.json({ error: 'Failed to assign guides' }, { status: 500 });
  }

  // Log audit for each assignment
  for (const assignment of assignments) {
    await client.rpc('log_guide_assignment_audit', {
      p_trip_id: tripId,
      p_guide_id: assignment.guide_id,
      p_action_type: 'assign',
      p_action_details: {
        role: assignment.role,
        assigned_by: user.id,
      },
      p_performed_by: user.id,
    });
  }

  logger.info('Guides assigned', { tripId, count: createdAssignments?.length });

  return NextResponse.json({
    success: true,
    assigned: createdAssignments,
    count: createdAssignments?.length,
  });
});
