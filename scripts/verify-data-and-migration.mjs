#!/usr/bin/env node
/**
 * Verify Data & Migration Status
 * Checks if:
 * 1. Migration has been applied (RLS policies exist)
 * 2. Data exists in database (package_itineraries, reviews, ops_broadcasts)
 * 3. Guide is assigned to trips
 * 4. Package has itinerary data
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyMigration() {
  console.log('🔍 Verifying Migration Status...\n');

  try {
    // Check if package_itineraries table exists
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        statement: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'package_itineraries';
        `,
      });

    if (tablesError) {
      // Try alternative method
      console.log('⚠️  Could not check table existence via RPC, trying direct query...');
    }

    // Check RLS policies for package_itineraries
    console.log('📋 Checking RLS Policies...');
    
    // Try to query pg_policies (may not be accessible via REST API)
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        statement: `
          SELECT policyname, tablename 
          FROM pg_policies 
          WHERE tablename IN ('package_itineraries', 'reviews')
          AND policyname LIKE '%guide%'
          ORDER BY tablename, policyname;
        `,
      });

    if (policiesError) {
      console.log('⚠️  Could not query pg_policies directly (may need manual check)');
      console.log('   Error:', policiesError.message);
    } else if (policies && policies.length > 0) {
      console.log('✅ RLS Policies found:');
      policies.forEach((p) => {
        console.log(`   - ${p.tablename}.${p.policyname}`);
      });
    } else {
      console.log('❌ No guide RLS policies found!');
      console.log('   ⚠️  Migration may not have been applied.');
      console.log('   💡 Run: node scripts/execute-itinerary-reviews-rls.mjs');
    }

    return { policiesFound: policies && policies.length > 0 };
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
    return { policiesFound: false };
  }
}

async function verifyData() {
  console.log('\n🔍 Verifying Data Availability...\n');

  // Get a sample guide user
  const { data: guideUser } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('role', 'guide')
    .limit(1)
    .single();

  if (!guideUser) {
    console.log('❌ No guide user found in database!');
    console.log('   💡 Need to create guide user first');
    return { hasData: false };
  }

  console.log(`✅ Found guide user: ${guideUser.full_name || guideUser.id}\n`);

  // Check trip assignments
  console.log('📋 Checking Trip Assignments...');
  const { data: tripAssignments, error: assignmentsError } = await supabase
    .from('trip_guides')
    .select(`
      trip_id,
      trip:trips!inner(
        id,
        trip_code,
        package_id,
        package:packages(id, name)
      )
    `)
    .eq('guide_id', guideUser.id)
    .limit(5);

  if (assignmentsError) {
    console.log('❌ Error fetching trip assignments:', assignmentsError.message);
  } else if (!tripAssignments || tripAssignments.length === 0) {
    console.log('❌ No trip assignments found for this guide!');
    console.log('   💡 Guide needs to be assigned to at least one trip');
    return { hasData: false };
  } else {
    console.log(`✅ Found ${tripAssignments.length} trip assignment(s):`);
    tripAssignments.forEach((ta) => {
      const trip = ta.trip;
      console.log(`   - Trip: ${trip?.trip_code || trip?.id}`);
      console.log(`     Package: ${trip?.package?.name || trip?.package_id || 'N/A'}`);
    });
  }

  // Check package_itineraries data
  console.log('\n📋 Checking Package Itineraries Data...');
  const tripWithPackage = tripAssignments?.find((ta) => ta.trip?.package_id);
  
  if (tripWithPackage?.trip?.package_id) {
    const packageId = tripWithPackage.trip.package_id;
    const { data: itineraries, error: itinerariesError } = await supabase
      .from('package_itineraries')
      .select('day_number, title, description')
      .eq('package_id', packageId)
      .limit(5);

    if (itinerariesError) {
      console.log('❌ Error fetching package_itineraries:', itinerariesError.message);
      console.log('   Error Code:', itinerariesError.code);
      console.log('   💡 This might be an RLS error - migration may not be applied');
    } else if (!itineraries || itineraries.length === 0) {
      console.log('⚠️  No package_itineraries data found for this package!');
      console.log(`   Package ID: ${packageId}`);
      console.log('   💡 Data may need to be seeded');
    } else {
      console.log(`✅ Found ${itineraries.length} itinerary day(s):`);
      itineraries.forEach((it) => {
        console.log(`   - Day ${it.day_number}: ${it.title || 'No title'}`);
      });
    }
  } else {
    console.log('⚠️  No trip with package_id found');
  }

  // Check reviews data
  console.log('\n📋 Checking Reviews Data...');
  const tripIds = tripAssignments?.map((ta) => ta.trip_id).filter(Boolean) || [];
  
  if (tripIds.length > 0) {
    // Get bookings for these trips
    const { data: tripBookings } = await supabase
      .from('trip_bookings')
      .select('booking_id')
      .in('trip_id', tripIds)
      .limit(10);

    if (tripBookings && tripBookings.length > 0) {
      const bookingIds = tripBookings.map((tb) => tb.booking_id);
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, booking_id, guide_rating, overall_rating, review_text')
        .in('booking_id', bookingIds)
        .not('guide_rating', 'is', null)
        .limit(5);

      if (reviewsError) {
        console.log('❌ Error fetching reviews:', reviewsError.message);
        console.log('   Error Code:', reviewsError.code);
        console.log('   💡 This might be an RLS error - migration may not be applied');
      } else if (!reviews || reviews.length === 0) {
        console.log('⚠️  No reviews found for bookings in these trips');
        console.log(`   Checked ${bookingIds.length} booking(s)`);
        console.log('   💡 Reviews may not exist yet (this is OK)');
      } else {
        console.log(`✅ Found ${reviews.length} review(s):`);
        reviews.forEach((r) => {
          console.log(`   - Rating: ${r.guide_rating || r.overall_rating}/5`);
          console.log(`     Review: ${(r.review_text || '').substring(0, 50)}...`);
        });
      }
    } else {
      console.log('⚠️  No bookings found for these trips');
      console.log('   💡 Reviews require bookings to exist first');
    }
  }

  // Check ops_broadcasts data
  console.log('\n📋 Checking Ops Broadcasts Data...');
  const { data: broadcasts, error: broadcastsError } = await supabase
    .from('ops_broadcasts')
    .select('id, title, message, is_active, branch_id')
    .eq('is_active', true)
    .limit(5);

  if (broadcastsError) {
    console.log('❌ Error fetching ops_broadcasts:', broadcastsError.message);
    console.log('   Error Code:', broadcastsError.code);
  } else if (!broadcasts || broadcasts.length === 0) {
    console.log('⚠️  No active broadcasts found');
    console.log('   💡 Broadcasts may not exist yet (this is OK)');
  } else {
    console.log(`✅ Found ${broadcasts.length} active broadcast(s):`);
    broadcasts.forEach((b) => {
      console.log(`   - ${b.title || 'No title'}`);
    });
  }

  return { hasData: true };
}

async function main() {
  console.log('🚀 Verifying Data & Migration Status\n');
  console.log(`📡 Supabase URL: ${supabaseUrl}\n`);

  const migrationStatus = await verifyMigration();
  const dataStatus = await verifyData();

  console.log('\n📊 Summary:');
  console.log(`   Migration Applied: ${migrationStatus.policiesFound ? '✅ Yes' : '❌ No'}`);
  console.log(`   Data Available: ${dataStatus.hasData ? '✅ Yes' : '⚠️  Partial/No'}`);

  if (!migrationStatus.policiesFound) {
    console.log('\n💡 ACTION REQUIRED:');
    console.log('   1. Run migration: node scripts/execute-itinerary-reviews-rls.mjs');
    console.log('   2. Or manually via Supabase Dashboard SQL Editor');
    console.log('   3. File: supabase/migrations/20251221000002_030-guide-itinerary-reviews-rls.sql');
  }

  if (!dataStatus.hasData) {
    console.log('\n💡 DATA SETUP REQUIRED:');
    console.log('   1. Ensure guide user is assigned to trips');
    console.log('   2. Ensure packages have package_itineraries data');
    console.log('   3. Check seed data scripts in supabase/seed/');
  }

  console.log('\n✅ Verification complete!');
}

main().catch((error) => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});
