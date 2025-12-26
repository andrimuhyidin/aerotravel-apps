/**
 * API: End Trip
 * POST /api/guide/trips/[id]/end
 * Lead Guide only - End trip (change status to completed)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { invalidateCache, invalidateUserCache } from '@/lib/cache/redis-cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Check if user is Lead Guide for this trip
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id, role, status')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .eq('role', 'lead')
    .in('status', ['assigned', 'confirmed'])
    .maybeSingle();

  // Fallback: check trip_guides (legacy)
  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id, guide_role')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .in('assignment_status', ['confirmed', 'pending_confirmation'])
    .maybeSingle();

  // Check if ops/admin (can end any trip)
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isOpsAdmin = userProfile?.role === 'ops_admin' || userProfile?.role === 'super_admin';
  const isLeadGuide = crewAssignment?.role === 'lead' || legacyAssignment?.guide_role === 'lead';

  if (!isLeadGuide && !isOpsAdmin) {
    return NextResponse.json(
      { error: 'Hanya Lead Guide yang dapat end trip' },
      { status: 403 }
    );
  }

  // Get trip
  let tripQuery = client
    .from('trips')
    .select('id, status, branch_id')
    .eq('id', tripId)
    .single();

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip, error: tripError } = await tripQuery;

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Check if force complete is requested (admin override)
  let body: { forceComplete?: boolean; overrideReason?: string } = {};
  try {
    body = (await request.json()) as { forceComplete?: boolean; overrideReason?: string };
  } catch {
    // Body is optional, continue with empty object
  }
  const forceComplete = body.forceComplete === true;
  const overrideReason = body.overrideReason;

  // Validate completion checklist (unless admin force complete)
  if (!(forceComplete && isOpsAdmin)) {
    // Import and reuse validation logic from completion-status
    // We'll validate inline here to avoid circular dependencies
    
    const missingItems: string[] = [];

    // 1. Check all passengers returned
    try {
      const { data: tripBookings } = await client
        .from('trip_bookings')
        .select('booking_id')
        .eq('trip_id', tripId);

      const bookingIds = (tripBookings ?? []).map((b: { booking_id: string }) => b.booking_id) as string[];

      let totalPax = 0;
      if (bookingIds.length > 0) {
        const { count } = await client
          .from('booking_passengers')
          .select('id', { count: 'exact', head: true })
          .in('booking_id', bookingIds);

        totalPax = count ?? 0;
      }

      if (totalPax > 0) {
        const { count: returnedCount } = await client
          .from('manifest_checks')
          .select('id', { count: 'exact', head: true })
          .eq('trip_id', tripId)
          .not('returned_at', 'is', null);

        if ((returnedCount ?? 0) < totalPax) {
          missingItems.push(`Semua tamu belum kembali (${returnedCount}/${totalPax})`);
        }
      }
    } catch (error) {
      logger.error('Failed to validate passengers returned', error, { tripId });
    }

    // 2. Check documentation uploaded
    const { data: tripData } = await client
      .from('trips')
      .select('documentation_url')
      .eq('id', tripId)
      .single();

    if (!tripData?.documentation_url || tripData.documentation_url.trim() === '') {
      missingItems.push('Dokumentasi belum diupload');
    }

    // 3. Check logistics handover (inbound) completed
    try {
      const { count: totalHandovers } = await client
        .from('inventory_handovers')
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', tripId);

      if (totalHandovers && totalHandovers > 0) {
        const { data: inboundHandover } = await client
          .from('inventory_handovers')
          .select('status, verified_by_both')
          .eq('trip_id', tripId)
          .eq('handover_type', 'inbound')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!inboundHandover || inboundHandover.status !== 'completed' || !inboundHandover.verified_by_both) {
          missingItems.push('Logistics handover (inbound) belum selesai');
        }
      }
    } catch (error) {
      logger.error('Failed to validate logistics handover', error, { tripId });
    }

    // 4. Check attendance checked out
    try {
      const { data: tripGuide } = await client
        .from('trip_guides')
        .select('check_out_at')
        .eq('trip_id', tripId)
        .eq('guide_id', user.id)
        .maybeSingle();

      const { data: attendance } = await client
        .from('guide_attendance')
        .select('check_out_at')
        .eq('trip_id', tripId)
        .eq('guide_id', user.id)
        .maybeSingle();

      if (!tripGuide?.check_out_at && !attendance?.check_out_at) {
        missingItems.push('Attendance check-out belum dilakukan');
      }
    } catch (error) {
      logger.error('Failed to validate attendance', error, { tripId });
    }

    // 5. Check required tasks completed
    try {
      const { data: tasks } = await client
        .from('trip_tasks')
        .select('id, label, required, completed')
        .eq('trip_id', tripId);

      const requiredTasks = (tasks ?? []).filter((t: { required: boolean }) => t.required === true);
      if (requiredTasks.length > 0) {
        const completedRequiredTasks = requiredTasks.filter((t: { completed: boolean }) => t.completed === true);
        if (completedRequiredTasks.length < requiredTasks.length) {
          const pendingCount = requiredTasks.length - completedRequiredTasks.length;
          missingItems.push(`Required tasks belum selesai (${pendingCount} pending)`);
        }
      }
    } catch (error) {
      logger.error('Failed to validate tasks', error, { tripId });
    }

    // If there are missing items, block the completion
    if (missingItems.length > 0) {
      logger.warn('Trip cannot be completed - missing items', { tripId, missingItems });
      return NextResponse.json(
        {
          error: 'Trip tidak dapat diselesaikan',
          message: 'Beberapa item wajib belum selesai',
          missingItems,
        },
        { status: 400 }
      );
    }
  } else {
    // Admin force complete - log override
    logger.warn('Trip completed with admin override', {
      tripId,
      adminId: user.id,
      overrideReason,
      missingItems: [],
    });
  }

  // Update trip status
  const { error: updateError } = await client
    .from('trips')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId);

  if (updateError) {
    logger.error('Failed to end trip', updateError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to end trip' }, { status: 500 });
  }

  logger.info('Trip ended', {
    tripId,
    guideId: user.id,
    role: isLeadGuide ? 'lead' : 'admin',
    forceComplete: forceComplete || false,
  });

  // PRD 4.4.C: Inventory Auto-Reduce - Reduce stock based on logistics recipe
  try {
    // Get trip details with package info
    let tripQuery = client
      .from('trips')
      .select(`
        id,
        package_id,
        branch_id,
        total_pax,
        package:packages(
          id,
          fuel_per_pax_liter,
          water_per_pax_bottle
        )
      `)
      .eq('id', tripId);

    // Apply branch filter
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: tripData } = await tripQuery.single();

    if (tripData && tripData.package) {
      const packageData = tripData.package as {
        id: string;
        fuel_per_pax_liter?: number;
        water_per_pax_bottle?: number;
      };
      const totalPax = Number(tripData.total_pax || 0);

      // Get inventory items for fuel and water
      const { data: inventoryItems } = await client
        .from('inventory')
        .select('id, name, item_type')
        .in('item_type', ['fuel', 'water'])
        .eq('branch_id', tripData.branch_id)
        .is('deleted_at', null);

      if (inventoryItems && inventoryItems.length > 0) {
        const { recordTripUsage } = await import('@/lib/inventory/stock');

        // Reduce fuel stock if recipe exists
        if (packageData.fuel_per_pax_liter && totalPax > 0) {
          const fuelItem = inventoryItems.find((item: { item_type: string }) => item.item_type === 'fuel');
          if (fuelItem) {
            const expectedFuel = packageData.fuel_per_pax_liter * totalPax;
            const actualFuel = expectedFuel; // Use expected as actual (can be updated later by admin)
            
            await recordTripUsage(
              fuelItem.id,
              tripId,
              actualFuel,
              expectedFuel,
              `Auto-reduced saat trip completed. Recipe: ${packageData.fuel_per_pax_liter}L/pax × ${totalPax} pax`,
              user.id
            ).catch((inventoryError) => {
              logger.warn('Failed to auto-reduce fuel inventory', {
                error: inventoryError instanceof Error ? inventoryError.message : String(inventoryError),
                tripId,
              });
            });
          }
        }

        // Reduce water stock if recipe exists
        if (packageData.water_per_pax_bottle && totalPax > 0) {
          const waterItem = inventoryItems.find((item: { item_type: string }) => item.item_type === 'water');
          if (waterItem) {
            const expectedWater = packageData.water_per_pax_bottle * totalPax;
            const actualWater = expectedWater; // Use expected as actual
            
            await recordTripUsage(
              waterItem.id,
              tripId,
              actualWater,
              expectedWater,
              `Auto-reduced saat trip completed. Recipe: ${packageData.water_per_pax_bottle} botol/pax × ${totalPax} pax`,
              user.id
            ).catch((inventoryError) => {
              logger.warn('Failed to auto-reduce water inventory', {
                error: inventoryError instanceof Error ? inventoryError.message : String(inventoryError),
                tripId,
              });
            });
          }
        }

        logger.info('Inventory auto-reduced for completed trip', {
          tripId,
          totalPax,
          fuelReduced: packageData.fuel_per_pax_liter ? packageData.fuel_per_pax_liter * totalPax : 0,
          waterReduced: packageData.water_per_pax_bottle ? packageData.water_per_pax_bottle * totalPax : 0,
        });
      }
    }
  } catch (inventoryError) {
    // Non-critical - log but don't fail trip completion
    logger.warn('Inventory auto-reduce error (non-critical)', {
      error: inventoryError instanceof Error ? inventoryError.message : String(inventoryError),
      tripId,
    });
  }

  // Invalidate cache for this guide's stats, trips, and leaderboard
  await invalidateUserCache(user.id);
  await invalidateCache(`guide:leaderboard:*`); // Invalidate all leaderboards

  return NextResponse.json({
    success: true,
    message: 'Trip berhasil diselesaikan',
  });
});
