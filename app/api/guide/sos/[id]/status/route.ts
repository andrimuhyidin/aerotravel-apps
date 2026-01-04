/**
 * API: Get SOS Alert Status
 * GET /api/guide/sos/[id]/status - Get SOS alert status including ETA
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: sosAlertId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get SOS alert
  const { data: sosAlert, error: sosError } = await client
    .from('sos_alerts')
    .select(`
      id,
      status,
      guide_id,
      acknowledged_at,
      acknowledged_by,
      eta_minutes,
      created_at
    `)
    .eq('id', sosAlertId)
    .eq('guide_id', user.id) // Only guide who created the alert can view status
    .single();

  if (sosError || !sosAlert) {
    return NextResponse.json({ error: 'SOS alert not found' }, { status: 404 });
  }

  // Calculate remaining time if ETA is set
  let remainingMinutes: number | null = null;
  if (sosAlert.acknowledged_at && sosAlert.eta_minutes) {
    const acknowledgedAt = new Date(sosAlert.acknowledged_at);
    const etaTime = new Date(acknowledgedAt.getTime() + sosAlert.eta_minutes * 60 * 1000);
    const now = new Date();
    remainingMinutes = Math.max(0, Math.ceil((etaTime.getTime() - now.getTime()) / (60 * 1000)));
  }

  return NextResponse.json({
    id: sosAlert.id,
    status: sosAlert.status,
    acknowledged: !!sosAlert.acknowledged_at,
    acknowledgedAt: sosAlert.acknowledged_at,
    etaMinutes: sosAlert.eta_minutes,
    remainingMinutes,
    createdAt: sosAlert.created_at,
  });
});

