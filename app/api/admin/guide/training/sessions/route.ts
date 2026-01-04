/**
 * API: Training Sessions (Admin)
 * GET /api/admin/guide/training/sessions - List training sessions
 * POST /api/admin/guide/training/sessions - Create training session
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  session_type: z.enum(['sop', 'safety', 'drill', 'other']),
  training_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  location: z.string().optional(),
  module_id: z.string().uuid().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'super_admin' && userProfile?.role !== 'ops_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = client
    .from('training_sessions')
    .select('*')
    .eq('is_active', true)
    .order('training_date', { ascending: false });

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: sessions, error } = await query;

  if (error) {
    logger.error('Failed to fetch training sessions', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }

  return NextResponse.json({
    sessions: sessions || [],
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = createSessionSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'super_admin' && userProfile?.role !== 'ops_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  // Create session
  const { data: session, error } = await withBranchFilter(
    client.from('training_sessions'),
    branchContext,
  )
    .insert({
      branch_id: branchContext.branchId,
      title: payload.title,
      description: payload.description || null,
      session_type: payload.session_type,
      training_date: payload.training_date,
      start_time: payload.start_time || null,
      end_time: payload.end_time || null,
      location: payload.location || null,
      module_id: payload.module_id || null,
      status: 'scheduled',
      is_active: true,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create training session', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  logger.info('Training session created', {
    sessionId: session.id,
    createdBy: user.id,
    title: payload.title,
  });

  return NextResponse.json(
    {
      success: true,
      session,
    },
    { status: 201 },
  );
});
