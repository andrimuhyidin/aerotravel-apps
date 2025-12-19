import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = (await request.json()) as {
    tripId?: string;
    passengerId?: string;
    notes?: string;
    allergy?: string;
    seasick?: boolean;
    specialRequest?: string;
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId, passengerId, notes, allergy, seasick, specialRequest } = body;

  if (!tripId || !passengerId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const { error } = await withBranchFilter(
    client.from('manifest_passengers'),
    branchContext,
  )
    .update({
      notes: notes ?? null,
      allergy: allergy ?? null,
      seasick: seasick ?? null,
      special_request: specialRequest ?? null,
    } as never)
    .eq('trip_id', tripId)
    .eq('passenger_id', passengerId);

  if (error) {
    logger.error('Failed to update passenger details', error, { tripId, passengerId });
    return NextResponse.json({ error: 'Failed to update passenger details' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

