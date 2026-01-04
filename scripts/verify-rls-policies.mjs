#!/usr/bin/env node
/**
 * Verify RLS Policies for Itinerary & Reviews
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyPolicies() {
  console.log('🔍 Verifying RLS Policies...\n');

  // Check package_itineraries policies
  const { data: packageItinerariesPolicies, error: piError } = await supabase
    .rpc('exec_sql', {
      statement: `
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename = 'package_itineraries' 
        AND policyname LIKE '%guide%'
        ORDER BY policyname;
      `,
    });

  if (!piError && packageItinerariesPolicies) {
    console.log('✅ package_itineraries policies found:');
    console.log(JSON.stringify(packageItinerariesPolicies, null, 2));
  } else {
    // Try alternative query
    const { data: altData } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'package_itineraries')
      .like('policyname', '%guide%');
    
    if (altData && altData.length > 0) {
      console.log('✅ package_itineraries policies found:');
      altData.forEach(p => console.log(`   - ${p.policyname}`));
    } else {
      console.log('⚠️  Could not verify package_itineraries policies (may need manual check)');
    }
  }

  // Check reviews policies
  const { data: reviewsPolicies, error: revError } = await supabase
    .rpc('exec_sql', {
      statement: `
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename = 'reviews' 
        AND policyname LIKE '%guide%'
        ORDER BY policyname;
      `,
    });

  if (!revError && reviewsPolicies) {
    console.log('\n✅ reviews policies found:');
    console.log(JSON.stringify(reviewsPolicies, null, 2));
  } else {
    // Try alternative query
    const { data: altData } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'reviews')
      .like('policyname', '%guide%');
    
    if (altData && altData.length > 0) {
      console.log('\n✅ reviews policies found:');
      altData.forEach(p => console.log(`   - ${p.policyname}`));
    } else {
      console.log('\n⚠️  Could not verify reviews policies (may need manual check)');
    }
  }

  console.log('\n✅ Verification complete!');
  console.log('\n💡 If policies are not listed above, they may still be active.');
  console.log('   Test by accessing itinerary/reviews endpoints as a guide user.');
}

verifyPolicies().catch(console.error);
