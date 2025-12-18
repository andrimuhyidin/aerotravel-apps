/**
 * API: Payroll Gatekeeper
 * POST /api/admin/payroll/gatekeeper
 *
 * Body (optional): { periodStart: string, periodEnd: string }
 * If not provided, defaults to current month.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    periodStart?: string;
    periodEnd?: string;
  };

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const periodStart = body.periodStart ?? defaultStart;
  const periodEnd = body.periodEnd ?? defaultEnd;

  // Ambil semua salary_payments pada periode tsb
  const { data: payments, error: payError } = await supabase
    .from('salary_payments')
    .select('id, guide_id, branch_id, period_start, period_end, status, all_docs_uploaded')
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd);

  if (payError) {
    logger.error('Failed to load salary_payments for gatekeeper', payError);
    return NextResponse.json({ error: 'Failed to load salary payments' }, { status: 500 });
  }

  let updated = 0;

  for (const pay of payments ?? []) {
    const guideId = pay.guide_id as string;

    // Ambil semua trip untuk guide di periode ini
    const { data: trips, error: tripsError } = await supabase
      .from('trip_guides')
      .select(
        `
        trip_id,
        trip:trips(
          id,
          trip_code,
          trip_date,
          documentation_url
        )
      `
      )
      .eq('guide_id', guideId)
      .gte('trip.trip_date', periodStart)
      .lte('trip.trip_date', periodEnd);

    if (tripsError) {
      logger.error('Failed to load trips for gatekeeper', tripsError, {
        salaryPaymentId: pay.id,
      });
      continue;
    }

    if (!trips || trips.length === 0) {
      continue;
    }

    let allDocsOk = true;
    let allManifestOk = true;

    for (const row of trips) {
      const trip = row.trip as { id: string; documentation_url: string | null } | null;
      if (!trip) continue;

      // 1) Dokumentasi: harus ada documentation_url
      if (!trip.documentation_url) {
        allDocsOk = false;
        break;
      }

      // 2) Manifest: semua penumpang boarded+returned
      // Hitung total penumpang dari booking_passengers via trip_bookings
      const { data: bookingIdsData, error: bookingIdsError } = await supabase
        .from('trip_bookings')
        .select('booking_id')
        .eq('trip_id', trip.id);

      if (bookingIdsError) {
        logger.error('Failed to load trip_bookings for gatekeeper', bookingIdsError, {
          tripId: trip.id,
        });
        allManifestOk = false;
        break;
      }

      const bookingIds = (bookingIdsData ?? []).map((b) => b.booking_id) as string[];

      let totalPax = 0;

      if (bookingIds.length > 0) {
        const { count: paxCount, error: paxError } = await supabase
          .from('booking_passengers')
          .select('id', { count: 'exact', head: true })
          .in('booking_id', bookingIds);

        if (paxError) {
          logger.error('Failed to count passengers for gatekeeper', paxError, {
            tripId: trip.id,
          });
          allManifestOk = false;
          break;
        }

        totalPax = paxCount ?? 0;
      }

      // Hitung manifest_checks yang sudah returned
      const { count: returnedCount, error: manifestError } = await supabase
        .from('manifest_checks')
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', trip.id)
        .not('returned_at', 'is', null);

      if (manifestError) {
        logger.error('Failed to count manifest checks for gatekeeper', manifestError, {
          tripId: trip.id,
        });
        allManifestOk = false;
        break;
      }

      if (totalPax > 0 && (returnedCount ?? 0) < totalPax) {
        allManifestOk = false;
        break;
      }
    }

    const shouldBeReady = allDocsOk && allManifestOk;

    if (shouldBeReady) {
      const { error: updateError } = await supabase
        .from('salary_payments')
        .update({
          all_docs_uploaded: true,
          status: pay.status === 'pending' || pay.status === 'documentation_required' ? 'ready' : pay.status,
        })
        .eq('id', pay.id);

      if (!updateError) {
        updated += 1;
      } else {
        logger.error('Failed to update salary_payment gatekeeper flags', updateError, {
          salaryPaymentId: pay.id,
        });
      }
    }
  }

  return NextResponse.json({ success: true, updated, periodStart, periodEnd });
});
