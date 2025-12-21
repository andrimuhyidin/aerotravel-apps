#!/usr/bin/env node

/**
 * Validation Script: Validate Specific Guide
 * 
 * Usage:
 *   pnpm validate:guide <guide-id>
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
const guideId = process.argv[2];

if (!guideId) {
  console.error('❌ Guide ID is required');
  console.error('Usage: pnpm validate:guide <guide-id>');
  process.exit(1);
}

const outputJson = process.argv.includes('--json');

async function validateGuide(guideId) {
  console.log(`🔍 Validating guide: ${guideId}\n`);

  // Get guide info
  const { data: guide, error: guideError } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('id', guideId)
    .maybeSingle();

  if (guideError) {
    console.error(`❌ Error fetching guide: ${guideError.message}`);
    process.exit(1);
  }

  if (!guide) {
    console.error(`❌ Guide not found: ${guideId}`);
    process.exit(1);
  }

  if (guide.role !== 'guide') {
    console.error(`❌ User is not a guide (role: ${guide.role})`);
    process.exit(1);
  }

  console.log(`📋 Guide: ${guide.full_name || 'N/A'} (${guide.id})`);
  console.log('='.repeat(60));

  const results = {
    guideId: guide.id,
    guideName: guide.full_name,
    issues: [],
    summary: {
      totalIssues: 0,
      critical: 0,
      warnings: 0,
      info: 0,
    },
    timestamp: new Date().toISOString(),
  };

  // 1. Validate guide data integrity
  console.log('\n1️⃣ Validating guide data integrity...');
  const { data: guideIssues, error: guideIssuesError } = await supabase.rpc(
    'validate_guide_data_integrity',
    {
      p_guide_id: guideId,
    },
  );

  if (guideIssuesError) {
    console.error('❌ Error validating guide:', guideIssuesError.message);
  } else if (guideIssues && guideIssues.length > 0) {
    console.log(`   ⚠️  Found ${guideIssues.length} issues`);

    for (const issue of guideIssues) {
      results.issues.push({
        category: issue.category,
        severity: issue.severity,
        type: issue.issue_type,
        description: issue.description,
        affectedId: issue.affected_id,
        details: issue.details,
      });

      results.summary.totalIssues++;
      if (issue.severity === 'critical') {
        results.summary.critical++;
      } else if (issue.severity === 'warning') {
        results.summary.warnings++;
      } else {
        results.summary.info++;
      }

      if (!outputJson) {
        const icon = issue.severity === 'critical' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${issue.severity.toUpperCase()}] ${issue.issue_type}`);
        console.log(`      ${issue.description}`);
        if (issue.details) {
          console.log(`      Details:`, JSON.stringify(issue.details, null, 6));
        }
      }
    }
  } else {
    console.log('   ✅ No issues found');
  }

  // 2. Validate guide's wallet/payments
  console.log('\n2️⃣ Validating wallet and payments...');
  const { data: wallet } = await supabase
    .from('guide_wallets')
    .select('id, balance')
    .eq('guide_id', guideId)
    .single();

  if (!wallet) {
    console.log('   ⚠️  No wallet found (will be auto-created)');
    results.issues.push({
      category: 'data_quality',
      severity: 'warning',
      type: 'missing_wallet',
      description: 'Guide does not have wallet (will be auto-created)',
      affectedId: guideId,
      details: {},
    });
    results.summary.totalIssues++;
    results.summary.warnings++;
  } else {
    console.log(`   💰 Wallet balance: ${wallet.balance}`);

    const { data: paymentIssues, error: paymentIssuesError } = await supabase.rpc(
      'validate_payment_integrity',
      {
        p_wallet_id: wallet.id,
      },
    );

    if (paymentIssuesError) {
      console.error('   ❌ Error validating payments:', paymentIssuesError.message);
    } else if (paymentIssues && paymentIssues.length > 0) {
      console.log(`   ⚠️  Found ${paymentIssues.length} payment issues`);

      for (const issue of paymentIssues) {
        results.issues.push({
          category: issue.category,
          severity: issue.severity,
          type: issue.issue_type,
          description: issue.description,
          affectedId: issue.affected_id,
          details: issue.details,
        });

        results.summary.totalIssues++;
        if (issue.severity === 'critical') {
          results.summary.critical++;
        } else if (issue.severity === 'warning') {
          results.summary.warnings++;
        } else {
          results.summary.info++;
        }

        if (!outputJson) {
          const icon = issue.severity === 'critical' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`   ${icon} [${issue.severity.toUpperCase()}] ${issue.issue_type}`);
          console.log(`      ${issue.description}`);
          if (issue.details) {
            console.log(`      Details:`, JSON.stringify(issue.details, null, 6));
          }
        }
      }
    } else {
      console.log('   ✅ No payment issues found');
    }
  }

  // 3. Validate guide's trips
  console.log('\n3️⃣ Validating guide trips...');
  const { data: trips } = await supabase
    .from('trip_guides')
    .select('trip_id, trip:trips(trip_code, status, trip_date)')
    .eq('guide_id', guideId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (trips && trips.length > 0) {
    console.log(`   📋 Found ${trips.length} recent trip assignments`);

    let tripsWithIssues = 0;
    for (const tripGuide of trips) {
      const trip = tripGuide.trip;
      if (!trip) continue;

      const { data: tripIssues } = await supabase.rpc('validate_trip_data_integrity', {
        p_trip_id: tripGuide.trip_id,
      });

      if (tripIssues && tripIssues.length > 0) {
        tripsWithIssues++;

        // Only show issues related to this guide
        const guideRelatedIssues = tripIssues.filter(
          (issue) => {
            // Check if issue is related to this guide
            if (issue.details && issue.details.guide_id === guideId) return true;
            return false;
          },
        );

        if (guideRelatedIssues.length > 0) {
          console.log(`   ⚠️  Trip ${trip.trip_code} has ${guideRelatedIssues.length} guide-related issues`);

          for (const issue of guideRelatedIssues) {
            results.issues.push({
              category: issue.category,
              severity: issue.severity,
              type: issue.issue_type,
              description: issue.description,
              affectedId: issue.affected_id,
              details: { trip_code: trip.trip_code, ...issue.details },
            });

            results.summary.totalIssues++;
            if (issue.severity === 'critical') {
              results.summary.critical++;
            } else if (issue.severity === 'warning') {
              results.summary.warnings++;
            } else {
              results.summary.info++;
            }
          }
        }
      }
    }

    if (tripsWithIssues === 0) {
      console.log('   ✅ No issues found in recent trips');
    }
  } else {
    console.log('   ℹ️  No trips found');
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Guide: ${guide.full_name || 'N/A'}`);
  console.log(`Total Issues: ${results.summary.totalIssues}`);
  console.log(`Critical: ${results.summary.critical} 🚨`);
  console.log(`Warnings: ${results.summary.warnings} ⚠️`);
  console.log(`Info: ${results.summary.info} ℹ️`);
  console.log('='.repeat(60));

  if (outputJson) {
    console.log('\n' + JSON.stringify(results, null, 2));
  }

  // Exit with appropriate code
  process.exit(results.summary.critical > 0 ? 1 : 0);
}

validateGuide(guideId).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

