/**
 * API: Fuel Consumption Logging (Admin Only)
 * PATCH /api/admin/trips/[id]/fuel-consumption - Log fuel consumption with auto CO2 calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const fuelConsumptionSchema = z.object({
  fuel_liters: z.number().positive(),
  fuel_type: z.enum(['diesel', 'gasoline', 'other']),
  distance_nm: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const payload = fuelConsumptionSchema.parse(await request.json());

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
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  // Verify trip exists
  const { data: trip } = await client
    .from('trips')
    .select('id, branch_id')
    .eq('id', tripId)
    .single();

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Check if fuel log already exists for this trip
  const { data: existingLog } = await client
    .from('trip_fuel_logs')
    .select('id')
    .eq('trip_id', tripId)
    .single();

  let fuelLog;

  if (existingLog) {
    // Update existing log
    const { data: updatedLog, error: updateError } = await withBranchFilter(
      client.from('trip_fuel_logs'),
      branchContext,
    )
      .update({
        fuel_liters: payload.fuel_liters,
        fuel_type: payload.fuel_type,
        distance_nm: payload.distance_nm || null,
        notes: payload.notes || null,
        logged_by: user.id,
        logged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // CO2 will be auto-calculated by trigger
      })
      .eq('id', existingLog.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update fuel log', updateError, { tripId, adminId: user.id });
      return NextResponse.json({ error: 'Failed to update fuel log' }, { status: 500 });
    }

    fuelLog = updatedLog;
  } else {
    // Create new log
    const { data: newLog, error: insertError } = await withBranchFilter(
      client.from('trip_fuel_logs'),
      branchContext,
    )
      .insert({
        trip_id: tripId,
        branch_id: branchContext.branchId,
        fuel_liters: payload.fuel_liters,
        fuel_type: payload.fuel_type,
        distance_nm: payload.distance_nm || null,
        logged_by: user.id,
        logged_at: new Date().toISOString(),
        notes: payload.notes || null,
        // CO2 will be auto-calculated by trigger
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create fuel log', insertError, { tripId, adminId: user.id });
      return NextResponse.json({ error: 'Failed to create fuel log' }, { status: 500 });
    }

    fuelLog = newLog;
  }

  logger.info('Fuel consumption logged', {
    fuelLogId: fuelLog.id,
    tripId,
    fuelLiters: payload.fuel_liters,
    co2Emissions: fuelLog.co2_emissions_kg,
    adminId: user.id,
  });

  return NextResponse.json({
    fuel_log: fuelLog,
    message: 'Fuel consumption logged successfully',
  });
});

