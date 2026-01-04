/**
 * API: Guide Data Validation
 * GET /api/admin/guide/data-validation - Run comprehensive data validations
 * GET /api/admin/guide/data-validation/trips - Validate trips only
 * GET /api/admin/guide/data-validation/guides - Validate guides only
 * GET /api/admin/guide/data-validation/payments - Validate payments only
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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
  const { searchParams } = new URL(request.url);
  const pathParam = searchParams.get('path') || ''; // trips, guides, payments, contracts, or empty for all
  const path = pathParam.toLowerCase();

  try {
    const allIssues: Array<{
      category: string;
      severity: 'critical' | 'warning' | 'info';
      type: string;
      description: string;
      affectedRecords: Array<{ id: string; details: Record<string, unknown> }>;
    }> = [];

    let totalChecks = 0;
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    let criticals = 0;

    // 1. Validate Trips
    if (!path || path === 'trips') {
      try {
        const { data: tripResults, error: tripsError } = await client.rpc('validate_all_trips_integrity');

        if (tripsError) {
          logger.error('Failed to validate trips', tripsError);
        } else if (tripResults) {
          for (const trip of tripResults) {
            totalChecks++;
            if (trip.issues_count > 0) {
              failed++;
              criticals += trip.critical_count || 0;
              warnings += trip.warnings_count || 0;

              // Parse issues and group by type
              const issuesArray = trip.issues as Array<{
                category: string;
                severity: string;
                type: string;
                description: string;
                details: Record<string, unknown>;
              }>;

              for (const issue of issuesArray) {
                const existingIssue = allIssues.find(
                  (i) => i.category === issue.category && i.type === issue.type,
                );

                if (existingIssue) {
                  existingIssue.affectedRecords.push({
                    id: trip.trip_id,
                    details: { trip_code: trip.trip_code, ...issue.details },
                  });
                } else {
                  allIssues.push({
                    category: issue.category,
                    severity: issue.severity as 'critical' | 'warning' | 'info',
                    type: issue.type,
                    description: issue.description,
                    affectedRecords: [
                      {
                        id: trip.trip_id,
                        details: { trip_code: trip.trip_code, ...issue.details },
                      },
                    ],
                  });
                }
              }
            } else {
              passed++;
            }
          }
        }
      } catch (error) {
        logger.error('Error validating trips', error);
      }
    }

    // 2. Validate Guides
    if (!path || path === 'guides') {
      try {
        const { data: guideResults, error: guidesError } = await client.rpc('validate_all_guides_integrity');

        if (guidesError) {
          logger.error('Failed to validate guides', guidesError);
        } else if (guideResults) {
          for (const guide of guideResults) {
            totalChecks++;
            if (guide.issues_count > 0) {
              failed++;
              criticals += guide.critical_count || 0;
              warnings += guide.warnings_count || 0;

              // Parse issues and group by type
              const issuesArray = guide.issues as Array<{
                category: string;
                severity: string;
                type: string;
                description: string;
                details: Record<string, unknown>;
              }>;

              for (const issue of issuesArray) {
                const existingIssue = allIssues.find(
                  (i) => i.category === issue.category && i.type === issue.type,
                );

                if (existingIssue) {
                  existingIssue.affectedRecords.push({
                    id: guide.guide_id,
                    details: { guide_name: guide.guide_name, ...issue.details },
                  });
                } else {
                  allIssues.push({
                    category: issue.category,
                    severity: issue.severity as 'critical' | 'warning' | 'info',
                    type: issue.type,
                    description: issue.description,
                    affectedRecords: [
                      {
                        id: guide.guide_id,
                        details: { guide_name: guide.guide_name, ...issue.details },
                      },
                    ],
                  });
                }
              }
            } else {
              passed++;
            }
          }
        }
      } catch (error) {
        logger.error('Error validating guides', error);
      }
    }

    // 3. Validate Payments (all wallets)
    if (!path || path === 'payments') {
      try {
        // Get all wallets
        let walletsQuery = client.from('guide_wallets').select('id, guide_id');

        if (!branchContext.isSuperAdmin && branchContext.branchId) {
          // Filter by branch through users
          const { data: branchGuides } = await client
            .from('users')
            .select('id')
            .eq('branch_id', branchContext.branchId)
            .eq('role', 'guide');

          const guideIds = branchGuides?.map((g: { id: string }) => g.id) || [];
          if (guideIds.length > 0) {
            walletsQuery = walletsQuery.in('guide_id', guideIds);
          } else {
            // No guides in branch, skip
            walletsQuery = walletsQuery.eq('guide_id', '00000000-0000-0000-0000-000000000000'); // Empty result
          }
        }

        const { data: wallets, error: walletsError } = await walletsQuery;

        if (walletsError) {
          logger.error('Failed to fetch wallets', walletsError);
        } else if (wallets) {
          for (const wallet of wallets) {
            totalChecks++;
            const { data: paymentIssues, error: paymentError } = await client.rpc('validate_payment_integrity', {
              p_wallet_id: wallet.id,
            });

            if (paymentError) {
              logger.error('Failed to validate payment', paymentError, { walletId: wallet.id });
              failed++;
            } else if (paymentIssues && paymentIssues.length > 0) {
              failed++;
              for (const issue of paymentIssues) {
                if (issue.severity === 'critical') {
                  criticals++;
                } else if (issue.severity === 'warning') {
                  warnings++;
                }

                const existingIssue = allIssues.find(
                  (i) => i.category === issue.category && i.type === issue.issue_type,
                );

                if (existingIssue) {
                  existingIssue.affectedRecords.push({
                    id: wallet.id,
                    details: { guide_id: wallet.guide_id, ...issue.details },
                  });
                } else {
                  allIssues.push({
                    category: issue.category,
                    severity: issue.severity as 'critical' | 'warning' | 'info',
                    type: issue.issue_type,
                    description: issue.description,
                    affectedRecords: [
                      {
                        id: wallet.id,
                        details: { guide_id: wallet.guide_id, ...issue.details },
                      },
                    ],
                  });
                }
              }
            } else {
              passed++;
            }
          }
        }
      } catch (error) {
        logger.error('Error validating payments', error);
      }
    }

    // 4. Validate Contracts (if path = contracts or all)
    if (!path || path === 'contracts') {
      try {
        // Check for orphaned contract trips
        const { data: orphanedContractTrips, error: contractTripsError } = await client
          .from('guide_contract_trips')
          .select('id, contract_id, trip_id')
          .not('trip_id', 'is', null)
          .not(
            'trip_id',
            'in',
            client.from('trips').select('id'),
          );

        if (contractTripsError) {
          logger.error('Failed to check contract trips', contractTripsError);
        } else if (orphanedContractTrips && orphanedContractTrips.length > 0) {
          totalChecks++;
          failed++;
          criticals += orphanedContractTrips.length;

          allIssues.push({
            category: 'relationships',
            severity: 'critical',
            type: 'invalid_contract_trip',
            description: 'Contract trip references invalid trip',
            affectedRecords: orphanedContractTrips.map((ct: { id: string; contract_id: string; trip_id: string }) => ({
              id: ct.id,
              details: { contract_id: ct.contract_id, trip_id: ct.trip_id },
            })),
          });
        } else {
          passed++;
        }

        // Check for invalid contract payment references
        const { data: invalidPayments, error: paymentsError } = await client
          .from('guide_contract_payments')
          .select('id, contract_id, wallet_transaction_id')
          .not('wallet_transaction_id', 'is', null)
          .not(
            'wallet_transaction_id',
            'in',
            client.from('guide_wallet_transactions').select('id'),
          );

        if (paymentsError) {
          logger.error('Failed to check contract payments', paymentsError);
        } else if (invalidPayments && invalidPayments.length > 0) {
          totalChecks++;
          failed++;
          criticals += invalidPayments.length;

          allIssues.push({
            category: 'relationships',
            severity: 'critical',
            type: 'invalid_contract_payment',
            description: 'Contract payment references invalid wallet transaction',
            affectedRecords: invalidPayments.map((cp: { id: string; contract_id: string; wallet_transaction_id: string }) => ({
              id: cp.id,
              details: { contract_id: cp.contract_id, wallet_transaction_id: cp.wallet_transaction_id },
            })),
          });
        } else {
          passed++;
        }
      } catch (error) {
        logger.error('Error validating contracts', error);
      }
    }

    // Group results by category
    const results = {
      dataIntegrity: allIssues.filter((i) => i.category === 'data_integrity'),
      businessRules: allIssues.filter((i) => i.category === 'business_rules'),
      relationships: allIssues.filter((i) => i.category === 'relationships'),
      dataQuality: allIssues.filter((i) => i.category === 'data_quality'),
      businessLogic: allIssues.filter((i) => i.category === 'business_logic'),
    };

    const status = criticals > 0 || failed > 0 ? 'issues_found' : 'ok';

    return NextResponse.json({
      status,
      summary: {
        totalChecks,
        passed,
        failed,
        warnings,
        criticals,
      },
      results,
      issues: allIssues.sort((a, b) => {
        // Sort by severity: critical first, then warning, then info
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
    });
  } catch (error) {
    logger.error('Failed to run data validation', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to run data validation' }, { status: 500 });
  }
});

