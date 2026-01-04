/**
 * API: Cancel SOS Alert
 * PATCH /api/guide/sos/[id]/cancel - Cancel SOS alert with reason
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const cancelSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: sosAlertId } = await params;
  const payload = cancelSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify that the SOS alert belongs to the current guide
  const { data: sosAlert, error: sosError } = await client
    .from('sos_alerts')
    .select('id, guide_id, status')
    .eq('id', sosAlertId)
    .eq('guide_id', user.id)
    .single();

  if (sosError || !sosAlert) {
    logger.warn('SOS alert not found or unauthorized', {
      sosAlertId,
      guideId: user.id,
      error: sosError,
    });
    return NextResponse.json({ error: 'SOS alert not found or unauthorized' }, { status: 403 });
  }

  if (sosAlert.status !== 'active') {
    return NextResponse.json(
      { error: 'SOS alert sudah tidak aktif' },
      { status: 400 }
    );
  }

  // Update SOS alert status to cancelled
  const { data: updatedAlert, error: updateError } = await client
    .from('sos_alerts')
    .update({
      status: 'cancelled',
      cancelled_reason: payload.reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sosAlertId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to cancel SOS alert', updateError, {
      sosAlertId,
      guideId: user.id,
    });
    return NextResponse.json({ error: 'Failed to cancel SOS alert' }, { status: 500 });
  }

  // Stop GPS streaming (client-side will handle this, but we log it)
  logger.info('SOS alert cancelled', {
    sosAlertId,
    guideId: user.id,
    reason: payload.reason,
  });

  return NextResponse.json({
    success: true,
    message: 'SOS alert berhasil dibatalkan',
    alert: updatedAlert,
  });
});

