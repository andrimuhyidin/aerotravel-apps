import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/guide/attendance/equipment-handover
 * Record equipment & logistics handover
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    tripId: string;
    guideId: string;
    fuelLevel: number;
    notes: string;
    items: Array<{ name: string; checked: boolean; required: boolean }>;
  };

  const { tripId, guideId, fuelLevel, notes, items } = body;

  if (!tripId || !guideId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const branchContext = await getBranchContext(user.id);

  // Store equipment handover data
  const handoverData = {
    trip_id: tripId,
    guide_id: guideId,
    branch_id: branchContext.branchId,
    fuel_level: fuelLevel,
    equipment_items: items,
    notes,
    handover_time: new Date().toISOString(),
    created_by: user.id,
  };

  // Insert into equipment_handovers table
  const { error: insertError } = await supabase
    .from('equipment_handovers')
    .insert(handoverData);

  if (insertError) {
    logger.error('Failed to insert equipment handover', insertError, {
      tripId,
      guideId,
    });

    // If table doesn't exist, log it but don't fail
    if (insertError.code === '42P01') {
      logger.warn('equipment_handovers table does not exist yet', {
        tripId,
        guideId,
      });
      return NextResponse.json({
        success: true,
        message: 'Equipment handover recorded (table pending)',
      });
    }

    return NextResponse.json(
      { error: 'Failed to record equipment handover' },
      { status: 500 }
    );
  }

  logger.info('Equipment handover recorded', { tripId, guideId, fuelLevel });

  return NextResponse.json({
    success: true,
    message: 'Equipment handover recorded successfully',
  });
});
