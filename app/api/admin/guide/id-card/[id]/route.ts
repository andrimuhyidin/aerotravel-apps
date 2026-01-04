/**
 * API: Admin - Update Guide ID Card
 * PATCH /api/admin/guide/id-card/[id] - Update ID card (revoke, suspend, renew)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateIDCardSchema = z.object({
  status: z.enum(['active', 'expired', 'revoked', 'suspended']).optional(),
  revoked_reason: z.string().optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // For renewal
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

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

  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(
    userProfile?.role || ''
  );

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate input
  const validated = updateIDCardSchema.parse(body);

  // Get existing card
  const { data: existingCard } = await client
    .from('guide_id_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (!existingCard) {
    return NextResponse.json({ error: 'ID card not found' }, { status: 404 });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (validated.status) {
    updateData.status = validated.status;

    if (validated.status === 'revoked') {
      updateData.revoked_by = user.id;
      updateData.revoked_at = new Date().toISOString();
      if (validated.revoked_reason) {
        updateData.revoked_reason = validated.revoked_reason;
      }
    }
  }

  if (validated.expiry_date) {
    updateData.expiry_date = validated.expiry_date;
    // If renewing, set status back to active
    if (existingCard.status === 'expired') {
      updateData.status = 'active';
    }
  }

  // Update card
  const { data: idCard, error } = await client
    .from('guide_id_cards')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update ID card', error, { cardId: id });
    return NextResponse.json({ error: 'Failed to update ID card' }, { status: 500 });
  }

  logger.info('ID card updated', {
    cardId: id,
    status: validated.status,
    updatedBy: user.id,
  });

  return NextResponse.json({ id_card: idCard });
});
