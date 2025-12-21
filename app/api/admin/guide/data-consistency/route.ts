/**
 * API: Guide Data Consistency Check
 * GET /api/admin/guide/data-consistency - Check data consistency issues
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check admin role
  const isAuthorized = await hasRole([
    'super_admin',
    'ops_admin',
    'finance_manager',
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // 1. Check: Completed trips without payment
    let missingPaymentsQuery = client
      .from('trip_guides')
      .select('trip_id, guide_id, fee_amount, check_out_at, trip:trips(trip_code, branch_id)')
      .not('check_out_at', 'is', null)
      .gt('fee_amount', 0)
      .not(
        'trip_id',
        'in',
        client
          .from('guide_wallet_transactions')
          .select('reference_id')
          .eq('reference_type', 'trip')
          .eq('transaction_type', 'earning')
      );

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      // Filter by branch through trips
      const { data: branchTrips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId);

      const tripIds = branchTrips?.map((t: { id: string }) => t.id) || [];
      if (tripIds.length > 0) {
        missingPaymentsQuery = missingPaymentsQuery.in('trip_id', tripIds);
      } else {
        return NextResponse.json({
          status: 'ok',
          checks: {
            missingPayments: { count: 0, trips: [] },
            orphanPayments: { count: 0, transactions: [] },
            balanceMismatches: { count: 0, wallets: [] },
            dateInconsistencies: { count: 0, items: [] },
          },
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
          },
        });
      }
    }

    const { data: missingPayments, error: missingPaymentsError } = await missingPaymentsQuery;

    if (missingPaymentsError) {
      logger.error('Failed to check missing payments', missingPaymentsError);
    }

    // 2. Check: Payments without completed trip (orphan payments)
    // Get all trip earning transactions
    const { data: allTripTransactions, error: transactionsError } = await client
      .from('guide_wallet_transactions')
      .select('id, reference_id, created_at, wallet_id')
      .eq('reference_type', 'trip')
      .eq('transaction_type', 'earning');

    if (transactionsError) {
      logger.error('Failed to fetch transactions', transactionsError);
    }

    const tripIdsFromTransactions = (allTripTransactions || []).map(
      (t: { reference_id: string }) => t.reference_id,
    );

    let orphanPayments: Array<{
      transaction_id: string;
      trip_id: string;
      created_at: string;
    }> = [];

    if (tripIdsFromTransactions.length > 0) {
      // Check which trips don't have check_out_at
      const { data: tripsWithoutCheckout } = await client
        .from('trip_guides')
        .select('trip_id, check_out_at')
        .in('trip_id', tripIdsFromTransactions)
        .is('check_out_at', null);

      const tripsWithoutCheckoutIds = new Set(
        (tripsWithoutCheckout || []).map((t: { trip_id: string }) => t.trip_id),
      );

      orphanPayments = (allTripTransactions || [])
        .filter((t: { reference_id: string }) => tripsWithoutCheckoutIds.has(t.reference_id))
        .map((t: { id: string; reference_id: string; created_at: string }) => ({
          transaction_id: t.id,
          trip_id: t.reference_id,
          created_at: t.created_at,
        }));
    }

    // 3. Check: Balance mismatches
    const { data: balanceMismatches, error: balanceError } = await client.rpc(
      'check_wallet_balance_consistency',
    );

    if (balanceError) {
      logger.error('Failed to check balance consistency', balanceError);
    }

    // Filter balance mismatches by branch if needed
    let filteredBalanceMismatches = balanceMismatches || [];
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: branchGuides } = await client
        .from('users')
        .select('id')
        .eq('branch_id', branchContext.branchId)
        .eq('role', 'guide');

      const guideIds = new Set(branchGuides?.map((g: { id: string }) => g.id) || []);
      filteredBalanceMismatches = (balanceMismatches || []).filter(
        (bm: { guide_id: string }) => guideIds.has(bm.guide_id),
      );
    }

    // 4. Check: Date inconsistencies (transaction.created_at jauh berbeda dari check_out_at)
    // Find transactions where created_at differs significantly from check_out_at (> 24 hours)
    const { data: transactionsWithTrips, error: dateCheckError } = await client
      .from('guide_wallet_transactions')
      .select('id, reference_id, created_at, wallet:guide_wallets(guide_id)')
      .eq('reference_type', 'trip')
      .eq('transaction_type', 'earning');

    if (dateCheckError) {
      logger.error('Failed to fetch transactions for date check', dateCheckError);
    }

    const transactionTripIds = (transactionsWithTrips || []).map(
      (t: { reference_id: string }) => t.reference_id,
    );

    let dateInconsistencies: Array<{
      transaction_id: string;
      trip_id: string;
      diff_hours: number;
    }> = [];

    if (transactionTripIds.length > 0) {
      const { data: tripCheckouts } = await client
        .from('trip_guides')
        .select('trip_id, check_out_at')
        .in('trip_id', transactionTripIds)
        .not('check_out_at', 'is', null);

      const checkoutMap = new Map(
        (tripCheckouts || []).map((t: { trip_id: string; check_out_at: string }) => [
          t.trip_id,
          new Date(t.check_out_at).getTime(),
        ]),
      );

      dateInconsistencies = (transactionsWithTrips || [])
        .filter((t: { reference_id: string }) => checkoutMap.has(t.reference_id))
        .map((t: { id: string; reference_id: string; created_at: string }) => {
          const checkoutTime = checkoutMap.get(t.reference_id);
          if (checkoutTime === undefined || typeof checkoutTime !== 'number') return null;
          const transactionTime = new Date(t.created_at).getTime();
          const diffHours = Math.abs(transactionTime - checkoutTime) / (1000 * 60 * 60);

          return {
            transaction_id: t.id,
            trip_id: t.reference_id,
            diff_hours: Math.round(diffHours * 100) / 100,
          };
        })
        .filter((item: { diff_hours: number }) => item.diff_hours > 24); // More than 24 hours difference
    }

    // Format missing payments
    const missingPaymentsFormatted =
      missingPayments?.map((mp: { trip_id: string; guide_id: string; fee_amount: number }) => ({
        trip_id: mp.trip_id,
        guide_id: mp.guide_id,
        fee_amount: Number(mp.fee_amount || 0),
      })) || [];

    // Format balance mismatches
    const balanceMismatchesFormatted = (filteredBalanceMismatches || []).map(
      (bm: {
        wallet_id: string;
        guide_id: string;
        expected_balance: number;
        actual_balance: number;
        difference: number;
      }) => ({
        wallet_id: bm.wallet_id,
        guide_id: bm.guide_id,
        expected: Number(bm.expected_balance || 0),
        actual: Number(bm.actual_balance || 0),
        difference: Number(bm.difference || 0),
      }),
    );

    // Calculate summary
    const totalIssues =
      missingPaymentsFormatted.length +
      orphanPayments.length +
      balanceMismatchesFormatted.length +
      dateInconsistencies.length;

    const criticalIssues = missingPaymentsFormatted.length + balanceMismatchesFormatted.length;

    const status = totalIssues > 0 ? 'issues_found' : 'ok';

    return NextResponse.json({
      status,
      checks: {
        missingPayments: {
          count: missingPaymentsFormatted.length,
          trips: missingPaymentsFormatted,
        },
        orphanPayments: {
          count: orphanPayments.length,
          transactions: orphanPayments,
        },
        balanceMismatches: {
          count: balanceMismatchesFormatted.length,
          wallets: balanceMismatchesFormatted,
        },
        dateInconsistencies: {
          count: dateInconsistencies.length,
          items: dateInconsistencies,
        },
      },
      summary: {
        totalIssues,
        criticalIssues,
      },
    });
  } catch (error) {
    logger.error('Failed to check data consistency', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to check data consistency' }, { status: 500 });
  }
});

