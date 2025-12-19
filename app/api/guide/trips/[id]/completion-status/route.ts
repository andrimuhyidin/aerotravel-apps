/**
 * API: Trip Completion Status
 * GET /api/guide/trips/[id]/completion-status
 * Returns completion checklist status for trip
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
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

  // Get trip data
  let tripQuery = client
    .from('trips')
    .select('id, documentation_url, status, trip_code')
    .eq('id', tripId);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip, error: tripError } = await tripQuery.single();

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const checklist: {
    allPassengersReturned: { done: boolean; current: number; required: number; applicable: boolean };
    documentationUploaded: { done: boolean; url: string | null; applicable: boolean };
    logisticsHandoverCompleted: { done: boolean; inboundHandoverId: string | null; applicable: boolean };
    attendanceCheckedOut: { done: boolean; checkOutTime: string | null; applicable: boolean };
    requiredTasksCompleted: { done: boolean; pendingTasks: string[]; applicable: boolean };
    expensesSubmitted: { done: boolean; warning: boolean; applicable: boolean };
    paymentSplitCalculated: { done: boolean; warning: boolean; applicable: boolean };
  } = {
    allPassengersReturned: { done: false, current: 0, required: 0, applicable: true },
    documentationUploaded: { done: false, url: null, applicable: true },
    logisticsHandoverCompleted: { done: false, inboundHandoverId: null, applicable: true },
    attendanceCheckedOut: { done: false, checkOutTime: null, applicable: true },
    requiredTasksCompleted: { done: false, pendingTasks: [], applicable: true },
    expensesSubmitted: { done: false, warning: false, applicable: true },
    paymentSplitCalculated: { done: false, warning: false, applicable: true },
  };

  const missingItems: string[] = [];
  const warnings: string[] = [];

  // 1. Check all passengers returned
  try {
    const { data: tripBookings } = await withBranchFilter(
      client.from('trip_bookings'),
      branchContext,
    )
      .select('booking_id')
      .eq('trip_id', tripId);

    const bookingIds = (tripBookings ?? []).map((b: { booking_id: string }) => b.booking_id) as string[];

    let totalPax = 0;
    if (bookingIds.length > 0) {
      const { count } = await withBranchFilter(
        client.from('booking_passengers'),
        branchContext,
      )
        .select('id', { count: 'exact', head: true })
        .in('booking_id', bookingIds);

      totalPax = count ?? 0;
    }

    if (totalPax === 0) {
      checklist.allPassengersReturned.applicable = false;
      checklist.allPassengersReturned.done = true; // N/A
    } else {
      const { count: returnedCount } = await withBranchFilter(
        client.from('manifest_checks'),
        branchContext,
      )
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', tripId)
        .not('returned_at', 'is', null);

      checklist.allPassengersReturned.current = returnedCount ?? 0;
      checklist.allPassengersReturned.required = totalPax;
      checklist.allPassengersReturned.done = checklist.allPassengersReturned.current >= totalPax;

      if (!checklist.allPassengersReturned.done) {
        missingItems.push('Semua tamu belum kembali');
      }
    }
  } catch (error) {
    logger.error('Failed to check passengers returned', error, { tripId });
  }

  // 2. Check documentation uploaded
  checklist.documentationUploaded.url = trip.documentation_url;
  checklist.documentationUploaded.done = Boolean(trip.documentation_url && trip.documentation_url.trim() !== '');
  if (!checklist.documentationUploaded.done) {
    missingItems.push('Dokumentasi belum diupload');
  }

  // 3. Check logistics handover (inbound) completed
  try {
    const { data: inboundHandover } = await withBranchFilter(
      client.from('inventory_handovers'),
      branchContext,
    )
      .select('id, status, verified_by_both')
      .eq('trip_id', tripId)
      .eq('handover_type', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if trip has inventory items - if no handovers exist at all, might not be applicable
    const { count: totalHandovers } = await withBranchFilter(
      client.from('inventory_handovers'),
      branchContext,
    )
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    if (totalHandovers === 0) {
      // No handovers at all - might not be applicable (trip without inventory)
      checklist.logisticsHandoverCompleted.applicable = false;
      checklist.logisticsHandoverCompleted.done = true; // N/A
    } else {
      checklist.logisticsHandoverCompleted.applicable = true;
      checklist.logisticsHandoverCompleted.inboundHandoverId = inboundHandover?.id ?? null;
      checklist.logisticsHandoverCompleted.done =
        inboundHandover?.status === 'completed' && inboundHandover?.verified_by_both === true;

      if (!checklist.logisticsHandoverCompleted.done) {
        missingItems.push('Logistics handover (inbound) belum selesai');
      }
    }
  } catch (error) {
    logger.error('Failed to check logistics handover', error, { tripId });
  }

  // 4. Check attendance checked out
  try {
    // Check trip_guides (legacy)
    const { data: tripGuide } = await client
      .from('trip_guides')
      .select('check_out_at')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    // Also check guide_attendance (new table)
    const { data: attendance } = await withBranchFilter(
      client.from('guide_attendance'),
      branchContext,
    )
      .select('check_out_at')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    const checkOutTime = tripGuide?.check_out_at || attendance?.check_out_at || null;
    checklist.attendanceCheckedOut.checkOutTime = checkOutTime;
    checklist.attendanceCheckedOut.done = Boolean(checkOutTime);

    if (!checklist.attendanceCheckedOut.done) {
      missingItems.push('Attendance check-out belum dilakukan');
    }
  } catch (error) {
    logger.error('Failed to check attendance', error, { tripId });
  }

  // 5. Check required tasks completed
  try {
    const { data: tasks } = await withBranchFilter(
      client.from('trip_tasks'),
      branchContext,
    )
      .select('id, label, required, completed')
      .eq('trip_id', tripId);

    const requiredTasks = (tasks ?? []).filter((t: { required: boolean }) => t.required === true);

    if (requiredTasks.length === 0) {
      checklist.requiredTasksCompleted.applicable = false;
      checklist.requiredTasksCompleted.done = true; // N/A
    } else {
      const completedRequiredTasks = requiredTasks.filter((t: { completed: boolean }) => t.completed === true);
      const pendingTasks = requiredTasks
        .filter((t: { completed: boolean }) => !t.completed)
        .map((t: { label: string }) => t.label);

      checklist.requiredTasksCompleted.done = completedRequiredTasks.length === requiredTasks.length;
      checklist.requiredTasksCompleted.pendingTasks = pendingTasks;

      if (!checklist.requiredTasksCompleted.done) {
        missingItems.push(`Required tasks belum selesai (${pendingTasks.length} pending)`);
      }
    }
  } catch (error) {
    logger.error('Failed to check tasks', error, { tripId });
  }

  // 6. Check expenses submitted (optional - warning only)
  try {
    const { count: expensesCount } = await withBranchFilter(
      client.from('guide_expenses'),
      branchContext,
    )
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    checklist.expensesSubmitted.done = (expensesCount ?? 0) > 0;
    checklist.expensesSubmitted.warning = !checklist.expensesSubmitted.done;

    if (checklist.expensesSubmitted.warning) {
      warnings.push('Expenses belum di-submit. Pastikan submit untuk reimbursement.');
    }
  } catch (error) {
    logger.warn('Failed to check expenses', { tripId, error });
    // Don't fail if expenses check fails
  }

  // 7. Check payment split calculated (optional - warning only, multi-guide)
  try {
    // Check if multi-guide trip
    const { count: crewCount } = await withBranchFilter(
      client.from('trip_crews'),
      branchContext,
    )
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .in('status', ['assigned', 'confirmed']);

    // Also check legacy trip_guides
    const { count: legacyCrewCount } = await client
      .from('trip_guides')
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .in('assignment_status', ['confirmed', 'pending_confirmation']);

    const isMultiGuide = (crewCount ?? 0) > 1 || (legacyCrewCount ?? 0) > 1;

    if (!isMultiGuide) {
      checklist.paymentSplitCalculated.applicable = false;
      checklist.paymentSplitCalculated.done = true; // N/A
    } else {
      const { count: splitCount } = await withBranchFilter(
        client.from('trip_payment_splits'),
        branchContext,
      )
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', tripId);

      checklist.paymentSplitCalculated.done = (splitCount ?? 0) > 0;
      checklist.paymentSplitCalculated.warning = !checklist.paymentSplitCalculated.done;

      if (checklist.paymentSplitCalculated.warning) {
        warnings.push('Payment split belum dihitung untuk multi-guide trip.');
      }
    }
  } catch (error) {
    logger.warn('Failed to check payment split', { tripId, error });
    // Don't fail if payment split check fails
  }

  // Calculate completion status
  const requiredItems = [
    checklist.allPassengersReturned,
    checklist.documentationUploaded,
    checklist.logisticsHandoverCompleted,
    checklist.attendanceCheckedOut,
    checklist.requiredTasksCompleted,
  ].filter((item) => item.applicable);

  const allRequiredDone = requiredItems.every((item) => item.done);
  const completedCount = requiredItems.filter((item) => item.done).length;
  const totalRequired = requiredItems.length;

  logger.info('Completion status checked', {
    tripId,
    guideId: user.id,
    canComplete: allRequiredDone,
    completedCount,
    totalRequired,
    missingItems: missingItems.length,
  });

  return NextResponse.json({
    canComplete: allRequiredDone,
    checklist,
    missingItems,
    warnings,
    progress: {
      completed: completedCount,
      total: totalRequired,
      percentage: totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 100,
    },
  });
});
