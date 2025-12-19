/**
 * API: Guide Shift Swap Request
 * POST /api/guide/shifts/swap - create swap request
 * GET  /api/guide/shifts/swap - list own requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const swapRequestSchema = z.object({
  tripId: z.string().min(1),
  targetEmail: z.string().email(),
  reason: z.string().max(1000).optional(),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data, error } = await client
    .from('guide_shift_requests')
    .select(
      `
      id,
      trip_id,
      from_guide_id,
      to_guide_id,
      status,
      reason,
      admin_note,
      created_at,
      updated_at,
      decided_at,
      trip:trips(trip_code, trip_date),
      to_guide:users(full_name, email)
    `,
    )
    .eq('from_guide_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch shift swap requests', error, { guideId: user.id });
    return NextResponse.json(
      { error: 'Failed to fetch shift requests' },
      { status: 500 },
    );
  }

  return NextResponse.json({ requests: data ?? [] });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const payload = swapRequestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { tripId, targetEmail, reason } = payload.data;
  const client = supabase as unknown as any;

  // Find target guide by email
  const { data: targetUser, error: userError } = await client
    .from('users')
    .select('id, email, full_name')
    .eq('email', targetEmail)
    .maybeSingle();

  if (userError) {
    logger.error('Failed to lookup target guide', userError, {
      guideId: user.id,
      targetEmail,
    });
    return NextResponse.json(
      { error: 'Failed to lookup target guide' },
      { status: 500 },
    );
  }

  if (!targetUser) {
    return NextResponse.json(
      { error: 'Guide dengan email tersebut tidak ditemukan' },
      { status: 400 },
    );
  }

  if (targetUser.id === user.id) {
    return NextResponse.json(
      { error: 'Tidak bisa mengajukan swap ke diri sendiri' },
      { status: 400 },
    );
  }

  // Ensure the current user is assigned to this trip
  const { data: tripGuide, error: tgError } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (tgError) {
    logger.error('Failed to validate trip assignment', tgError, {
      guideId: user.id,
      tripId,
    });
    return NextResponse.json(
      { error: 'Gagal memvalidasi penugasan trip' },
      { status: 500 },
    );
  }

  if (!tripGuide) {
    return NextResponse.json(
      { error: 'Anda tidak terdaftar sebagai guide untuk trip ini' },
      { status: 400 },
    );
  }

  // Create shift request
  const { data: inserted, error: insertError } = await client
    .from('guide_shift_requests')
    .insert({
      trip_id: tripId,
      from_guide_id: user.id,
      to_guide_id: targetUser.id,
      status: 'pending',
      reason: reason ?? null,
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Failed to create shift swap request', insertError, {
      guideId: user.id,
      tripId,
      targetEmail,
    });
    return NextResponse.json(
      { error: 'Gagal membuat permintaan shift' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, request: inserted });
});


