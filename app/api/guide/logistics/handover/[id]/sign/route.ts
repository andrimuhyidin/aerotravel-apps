/**
 * API: Sign Handover
 * POST /api/guide/logistics/handover/[id]/sign - Add signature to handover
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const signSchema = z.object({
  signature: z.object({
    method: z.enum(['draw', 'upload', 'typed']),
    data: z.string(),
  }),
  party: z.enum(['from', 'to']), // Who is signing
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: handoverId } = await params;
  const payload = signSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get handover
  const { data: handover } = await client
    .from('inventory_handovers')
    .select('from_user_id, to_user_id, status')
    .eq('id', handoverId)
    .single();

  if (!handover) {
    return NextResponse.json({ error: 'Handover not found' }, { status: 404 });
  }

  // Verify user is authorized to sign
  const isFromParty = handover.from_user_id === user.id;
  const isToParty = handover.to_user_id === user.id;

  if (payload.party === 'from' && !isFromParty) {
    return NextResponse.json({ error: 'Unauthorized to sign as from party' }, { status: 403 });
  }

  if (payload.party === 'to' && !isToParty) {
    return NextResponse.json({ error: 'Unauthorized to sign as to party' }, { status: 403 });
  }

  // Update signature
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.party === 'from') {
    updateData.from_signature_data = payload.signature.data;
    updateData.from_signature_method = payload.signature.method;
    updateData.from_signature_timestamp = new Date().toISOString();
  } else {
    updateData.to_signature_data = payload.signature.data;
    updateData.to_signature_method = payload.signature.method;
    updateData.to_signature_timestamp = new Date().toISOString();
  }

  // Check if both parties have signed
  const { data: updatedHandover } = await client
    .from('inventory_handovers')
    .select('from_signature_data, to_signature_data')
    .eq('id', handoverId)
    .single();

  const bothSigned = !!(updatedHandover?.from_signature_data && updatedHandover?.to_signature_data);
  if (bothSigned) {
    updateData.verified_by_both = true;
    updateData.status = 'completed';
  }

  const { data: result, error } = await client
    .from('inventory_handovers')
    .update(updateData)
    .eq('id', handoverId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to sign handover', error, { handoverId });
    return NextResponse.json({ error: 'Failed to sign handover' }, { status: 500 });
  }

  logger.info('Handover signed', {
    handoverId,
    party: payload.party,
    bothSigned,
  });

  return NextResponse.json({
    success: true,
    handover: result,
    both_signed: bothSigned,
  });
});
