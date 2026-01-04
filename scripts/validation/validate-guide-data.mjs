#!/usr/bin/env node

/**
 * Validation Script: Guide Data Validation
 * 
 * Usage:
 *   pnpm validate:guide-data --all
 *   pnpm validate:guide-data --trips
 *   pnpm validate:guide-data --guides
 *   pnpm validate:guide-data --payments
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const validateAll = args.includes('--all') || args.length === 0;
const validateTrips = args.includes('--trips') || validateAll;
const validateGuides = args.includes('--guides') || validateAll;
const validatePayments = args.includes('--payments') || validateAll;
const validateContracts = args.includes('--contracts') || validateAll;
const outputJson = args.includes('--json');

const results = {
  status: 'ok',
  summary: {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    criticals: 0,
  },
  results: {},
  issues: [],
  timestamp: new Date().toISOString(),
};

async function validateTripsData() {
  console.log('\n🔍 Validating trips...');
  
  try {
    const { data, error } = await supabase.rpc('validate_all_trips_integrity');

    if (error) {
      console.error('❌ Error validating trips:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✅ No trips with issues found');
      results.summary.totalChecks += 1;
      results.summary.passed += 1;
      return;
    }

    for (const trip of data) {
      results.summary.totalChecks++;
      if (trip.issues_count > 0) {
        results.summary.failed++;
        results.summary.criticals += trip.critical_count || 0;
        results.summary.warnings += trip.warnings_count || 0;

        if (!outputJson) {
          console.log(`\n⚠️  Trip ${trip.trip_code} (${trip.trip_id})`);
          console.log(`   Issues: ${trip.issues_count} (${trip.critical_count} critical, ${trip.warnings_count} warnings)`);
        }

        const issuesArray = trip.issues || [];
        for (const issue of issuesArray) {
          results.issues.push({
            category: issue.category,
            severity: issue.severity,
            type: issue.issue_type || issue.type,
            description: issue.description,
            affectedRecord: {
              id: trip.trip_id,
              type: 'trip',
              details: { trip_code: trip.trip_code, ...issue.details },
            },
          });
        }
      } else {
        results.summary.passed++;
      }
    }

    if (!outputJson && data.length > 0) {
      console.log(`\n📊 Trips validation: ${data.length} trips with issues`);
    }
  } catch (error) {
    console.error('❌ Failed to validate trips:', error.message);
  }
}

async function validateGuidesData() {
  console.log('\n🔍 Validating guides...');

  try {
    const { data, error } = await supabase.rpc('validate_all_guides_integrity');

    if (error) {
      console.error('❌ Error validating guides:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✅ No guides with issues found');
      results.summary.totalChecks += 1;
      results.summary.passed += 1;
      return;
    }

    for (const guide of data) {
      results.summary.totalChecks++;
      if (guide.issues_count > 0) {
        results.summary.failed++;
        results.summary.criticals += guide.critical_count || 0;
        results.summary.warnings += guide.warnings_count || 0;

        if (!outputJson) {
          console.log(`\n⚠️  Guide ${guide.guide_name || guide.guide_id} (${guide.guide_id})`);
          console.log(`   Issues: ${guide.issues_count} (${guide.critical_count} critical, ${guide.warnings_count} warnings)`);
        }

        const issuesArray = guide.issues || [];
        for (const issue of issuesArray) {
          results.issues.push({
            category: issue.category,
            severity: issue.severity,
            type: issue.issue_type || issue.type,
            description: issue.description,
            affectedRecord: {
              id: guide.guide_id,
              type: 'guide',
              details: { guide_name: guide.guide_name, ...issue.details },
            },
          });
        }
      } else {
        results.summary.passed++;
      }
    }

    if (!outputJson && data.length > 0) {
      console.log(`\n📊 Guides validation: ${data.length} guides with issues`);
    }
  } catch (error) {
    console.error('❌ Failed to validate guides:', error.message);
  }
}

async function validatePaymentsData() {
  console.log('\n🔍 Validating payments...');

  try {
    // Get all wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('guide_wallets')
      .select('id, guide_id');

    if (walletsError) {
      console.error('❌ Error fetching wallets:', walletsError.message);
      return;
    }

    if (!wallets || wallets.length === 0) {
      console.log('✅ No wallets found');
      return;
    }

    let walletsWithIssues = 0;

    for (const wallet of wallets) {
      results.summary.totalChecks++;

      const { data: issues, error } = await supabase.rpc('validate_payment_integrity', {
        p_wallet_id: wallet.id,
      });

      if (error) {
        console.error(`❌ Error validating wallet ${wallet.id}:`, error.message);
        results.summary.failed++;
        continue;
      }

      if (issues && issues.length > 0) {
        walletsWithIssues++;
        results.summary.failed++;

        for (const issue of issues) {
          if (issue.severity === 'critical') {
            results.summary.criticals++;
          } else if (issue.severity === 'warning') {
            results.summary.warnings++;
          }

          results.issues.push({
            category: issue.category,
            severity: issue.severity,
            type: issue.issue_type,
            description: issue.description,
            affectedRecord: {
              id: wallet.id,
              type: 'wallet',
              details: { guide_id: wallet.guide_id, ...issue.details },
            },
          });
        }

        if (!outputJson) {
          console.log(`⚠️  Wallet ${wallet.id} (guide: ${wallet.guide_id}) has ${issues.length} issues`);
        }
      } else {
        results.summary.passed++;
      }
    }

    if (!outputJson) {
      if (walletsWithIssues > 0) {
        console.log(`\n📊 Payments validation: ${walletsWithIssues} wallets with issues`);
      } else {
        console.log('✅ All wallets validated successfully');
      }
    }
  } catch (error) {
    console.error('❌ Failed to validate payments:', error.message);
  }
}

async function validateContractsData() {
  console.log('\n🔍 Validating contracts...');

  try {
    // Check for orphaned contract trips
    const { data: orphanedTrips, error: tripsError } = await supabase
      .from('guide_contract_trips')
      .select('id, contract_id, trip_id')
      .not('trip_id', 'is', null);

    if (!tripsError && orphanedTrips && orphanedTrips.length > 0) {
      // Get valid trip IDs
      const { data: validTrips } = await supabase.from('trips').select('id');
      const validTripIds = new Set((validTrips || []).map((t) => t.id));

      const invalidTrips = orphanedTrips.filter(
        (ct) => !validTripIds.has(ct.trip_id),
      );

      if (invalidTrips.length > 0) {
        results.summary.totalChecks++;
        results.summary.failed++;
        results.summary.criticals += invalidTrips.length;

        for (const ct of invalidTrips) {
          results.issues.push({
            category: 'relationships',
            severity: 'critical',
            type: 'invalid_contract_trip',
            description: 'Contract trip references invalid trip',
            affectedRecord: {
              id: ct.id,
              type: 'contract_trip',
              details: { contract_id: ct.contract_id, trip_id: ct.trip_id },
            },
          });
        }

        if (!outputJson) {
          console.log(`⚠️  Found ${invalidTrips.length} orphaned contract trips`);
        }
      }
    }

    // Check for invalid contract payment references
    const { data: payments, error: paymentsError } = await supabase
      .from('guide_contract_payments')
      .select('id, contract_id, wallet_transaction_id')
      .not('wallet_transaction_id', 'is', null);

    if (!paymentsError && payments && payments.length > 0) {
      // Get valid transaction IDs
      const { data: validTransactions } = await supabase
        .from('guide_wallet_transactions')
        .select('id');
      const validTransactionIds = new Set(
        (validTransactions || []).map((t) => t.id),
      );

      const invalidPayments = payments.filter(
        (cp) => !validTransactionIds.has(cp.wallet_transaction_id),
      );

      if (invalidPayments.length > 0) {
        results.summary.totalChecks++;
        results.summary.failed++;
        results.summary.criticals += invalidPayments.length;

        for (const cp of invalidPayments) {
          results.issues.push({
            category: 'relationships',
            severity: 'critical',
            type: 'invalid_contract_payment',
            description: 'Contract payment references invalid wallet transaction',
            affectedRecord: {
              id: cp.id,
              type: 'contract_payment',
              details: {
                contract_id: cp.contract_id,
                wallet_transaction_id: cp.wallet_transaction_id,
              },
            },
          });
        }

        if (!outputJson) {
          console.log(`⚠️  Found ${invalidPayments.length} invalid contract payment references`);
        }
      }
    }

    if (!outputJson && results.summary.failed === 0) {
      console.log('✅ All contracts validated successfully');
    }
  } catch (error) {
    console.error('❌ Failed to validate contracts:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Guide Data Validation...\n');

  if (validateTrips) {
    await validateTripsData();
  }

  if (validateGuides) {
    await validateGuidesData();
  }

  if (validatePayments) {
    await validatePaymentsData();
  }

  if (validateContracts) {
    await validateContractsData();
  }

  // Update status
  if (results.summary.criticals > 0 || results.summary.failed > 0) {
    results.status = 'issues_found';
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Status: ${results.status === 'ok' ? '✅ OK' : '⚠️  ISSUES FOUND'}`);
  console.log(`Total Checks: ${results.summary.totalChecks}`);
  console.log(`Passed: ${results.summary.passed} ✅`);
  console.log(`Failed: ${results.summary.failed} ❌`);
  console.log(`Warnings: ${results.summary.warnings} ⚠️`);
  console.log(`Critical Issues: ${results.summary.criticals} 🚨`);
  console.log(`Total Issues: ${results.issues.length}`);
  console.log('='.repeat(60));

  if (outputJson) {
    console.log('\n' + JSON.stringify(results, null, 2));
  } else if (results.issues.length > 0) {
    console.log('\n🔍 Top Issues:');
    const criticalIssues = results.issues.filter((i) => i.severity === 'critical').slice(0, 10);
    const warningIssues = results.issues.filter((i) => i.severity === 'warning').slice(0, 5);

    if (criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      for (const issue of criticalIssues) {
        console.log(`   • [${issue.type}] ${issue.description}`);
        console.log(`     Record: ${issue.affectedRecord.type} ${issue.affectedRecord.id}`);
      }
    }

    if (warningIssues.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const issue of warningIssues) {
        console.log(`   • [${issue.type}] ${issue.description}`);
        console.log(`     Record: ${issue.affectedRecord.type} ${issue.affectedRecord.id}`);
      }
    }
  }

  // Exit with appropriate code
  process.exit(results.status === 'ok' ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

