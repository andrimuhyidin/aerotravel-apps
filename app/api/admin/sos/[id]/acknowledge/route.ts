/**
 * API: Acknowledge SOS Alert (Admin)
 * POST /api/admin/sos/[id]/acknowledge - Admin acknowledge SOS and set ETA
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const acknowledgeSchema = z.object({
  eta_minutes: z.number().int().min(1).max(1440), // 1 minute to 24 hours
  notes: z.string().optional(),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: sosAlertId } = await params;
  const payload = acknowledgeSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify admin access
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get SOS alert
  const { data: sosAlert, error: sosError } = await client
    .from('sos_alerts')
    .select('id, status, guide_id')
    .eq('id', sosAlertId)
    .single();

  if (sosError || !sosAlert) {
    return NextResponse.json({ error: 'SOS alert not found' }, { status: 404 });
  }

  if (sosAlert.status !== 'active') {
    return NextResponse.json(
      { error: 'SOS alert sudah tidak aktif' },
      { status: 400 }
    );
  }

  // Update SOS alert with acknowledgment
  const { data: updatedAlert, error: updateError } = await client
    .from('sos_alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
      eta_minutes: payload.eta_minutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sosAlertId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to acknowledge SOS alert', updateError, {
      sosAlertId,
      adminId: user.id,
    });
    return NextResponse.json({ error: 'Failed to acknowledge SOS alert' }, { status: 500 });
  }

  logger.info('SOS alert acknowledged', {
    sosAlertId,
    adminId: user.id,
    etaMinutes: payload.eta_minutes,
  });

  return NextResponse.json({
    success: true,
    message: 'SOS alert acknowledged',
    alert: updatedAlert,
  });
});

