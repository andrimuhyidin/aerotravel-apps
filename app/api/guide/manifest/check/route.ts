/**
 * API: Manifest Check (Boarding/Return)
 * POST /api/guide/manifest/check
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  
  const authResponse = await supabase.auth.getUser();
  const authUser = authResponse.data.user;

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { tripId, passengerId, checkType } = body;

  if (!tripId || !passengerId || !checkType) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const guideId = authUser.id;

  if (!['boarding', 'return'].includes(checkType)) {
    return NextResponse.json(
      { error: 'Invalid check type' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  // Build manifest check data
  const updateData =
    checkType === 'boarding'
      ? { boarded_at: now, boarded_by: guideId }
      : { returned_at: now, returned_by: guideId };

  // Upsert manifest check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (supabase as any)
    .from('manifest_checks')
    .upsert(
      {
        trip_id: tripId,
        passenger_id: passengerId,
        ...updateData,
      },
      { onConflict: 'trip_id,passenger_id' }
    )) as { error: Error | null };

  if (error) {
    logger.error('Manifest check failed', { error: error.message });
    return NextResponse.json({ error: 'Failed to update manifest' }, { status: 500 });
  }

  logger.info('Manifest check saved', { tripId, passengerId, checkType });

  return NextResponse.json({ success: true });
});
