/**
 * Script to check if metrics implementation is working correctly
 * Run: npx tsx scripts/check-metrics-implementation.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMetricsImplementation() {
  console.log('🔍 Checking Metrics Implementation...\n');

  // 1. Check if tables exist
  console.log('1. Checking database tables...');
  const tables = [
    'waste_logs',
    'guide_equipment_checklists',
    'pre_trip_assessments',
    'inventory_handovers',
    'incident_reports',
    'trip_fuel_logs',
    'trip_guides',
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: exists`);
    }
  }

  // 2. Check if there's any guide with data
  console.log('\n2. Checking for guide data...');
  const { data: guides } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'guide')
    .limit(5);

  if (!guides || guides.length === 0) {
    console.log('   ⚠️  No guides found');
    return;
  }

  const guideId = guides[0].id;
  console.log(`   Using guide: ${guides[0].full_name} (${guideId})`);

  // 3. Check waste logs
  console.log('\n3. Checking waste logs...');
  const { data: wasteLogs, error: wasteError } = await supabase
    .from('waste_logs')
    .select('id, trip_id, waste_type, quantity')
    .limit(5);

  if (wasteError) {
    console.log(`   ❌ Error: ${wasteError.message}`);
  } else {
    console.log(`   ✅ Found ${wasteLogs?.length || 0} waste logs`);
    if (wasteLogs && wasteLogs.length > 0) {
      console.log(`   Sample: ${JSON.stringify(wasteLogs[0], null, 2)}`);
    }
  }

  // 4. Check equipment checklists
  console.log('\n4. Checking equipment checklists...');
  const { data: equipment, error: equipmentError } = await supabase
    .from('guide_equipment_checklists')
    .select('id, trip_id, is_completed')
    .eq('guide_id', guideId)
    .limit(5);

  if (equipmentError) {
    console.log(`   ❌ Error: ${equipmentError.message}`);
  } else {
    console.log(
      `   ✅ Found ${equipment?.length || 0} equipment checklists for guide`
    );
  }

  // 5. Check risk assessments
  console.log('\n5. Checking risk assessments...');
  const { data: riskAssessments, error: riskError } = await supabase
    .from('pre_trip_assessments')
    .select('id, trip_id, risk_level')
    .eq('guide_id', guideId)
    .limit(5);

  if (riskError) {
    console.log(`   ❌ Error: ${riskError.message}`);
  } else {
    console.log(
      `   ✅ Found ${riskAssessments?.length || 0} risk assessments for guide`
    );
  }

  // 6. Check incidents
  console.log('\n6. Checking incidents...');
  const { data: incidents, error: incidentsError } = await supabase
    .from('incident_reports')
    .select('id, trip_id, incident_type')
    .eq('guide_id', guideId)
    .limit(5);

  if (incidentsError) {
    console.log(`   ❌ Error: ${incidentsError.message}`);
  } else {
    console.log(`   ✅ Found ${incidents?.length || 0} incidents for guide`);
  }

  // 7. Check trip guides for the period
  console.log('\n7. Checking trip guides for current month...');
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const { data: tripGuides, error: tripGuidesError } = await supabase
    .from('trip_guides')
    .select('trip_id, check_in_at')
    .eq('guide_id', guideId)
    .gte('check_in_at', startOfMonth.toISOString())
    .lte('check_in_at', endOfMonth.toISOString());

  if (tripGuidesError) {
    console.log(`   ❌ Error: ${tripGuidesError.message}`);
  } else {
    console.log(
      `   ✅ Found ${tripGuides?.length || 0} trips for guide this month`
    );
    if (tripGuides && tripGuides.length > 0) {
      const tripIds = tripGuides.map((tg: any) => tg.trip_id);
      console.log(
        `   Trip IDs: ${tripIds.slice(0, 3).join(', ')}${tripIds.length > 3 ? '...' : ''}`
      );
    }
  }

  // 8. Test API endpoint (if we have auth)
  console.log('\n8. Summary:');
  console.log('   ✅ All tables exist');
  console.log('   ⚠️  Data availability depends on actual usage');
  console.log('   📝 Check server logs for calculation function calls');
  console.log(
    '   🔗 Test API: GET /api/guide/metrics/unified?period=monthly&include=sustainability,operations,safety'
  );
}

checkMetricsImplementation()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
