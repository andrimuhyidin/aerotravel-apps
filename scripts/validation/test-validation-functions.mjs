#!/usr/bin/env node

/**
 * Test Validation Functions
 * Tests all validation functions to ensure they work without errors
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
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Testing Validation Functions\n');

  // Get a sample trip_id
  const { data: sampleTrip } = await supabase
    .from('trips')
    .select('id')
    .limit(1)
    .single();

  // Get a sample guide_id
  const { data: sampleGuide } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'guide')
    .limit(1)
    .single();

  // Get a sample wallet_id
  const { data: sampleWallet } = await supabase
    .from('guide_wallets')
    .select('id')
    .limit(1)
    .single();

  // Test 1: validate_trip_data_integrity
  if (sampleTrip?.id) {
    test('validate_trip_data_integrity', async () => {
      const { data, error } = await supabase.rpc('validate_trip_data_integrity', {
        p_trip_id: sampleTrip.id,
      });
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Expected array result');
      return `✅ Returned ${data.length} issues`;
    });
  }

  // Test 2: validate_guide_data_integrity
  if (sampleGuide?.id) {
    test('validate_guide_data_integrity', async () => {
      const { data, error } = await supabase.rpc('validate_guide_data_integrity', {
        p_guide_id: sampleGuide.id,
      });
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Expected array result');
      return `✅ Returned ${data.length} issues`;
    });
  }

  // Test 3: validate_payment_integrity
  if (sampleWallet?.id) {
    test('validate_payment_integrity', async () => {
      const { data, error } = await supabase.rpc('validate_payment_integrity', {
        p_wallet_id: sampleWallet.id,
      });
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Expected array result');
      return `✅ Returned ${data.length} issues`;
    });
  }

  // Test 4: validate_all_trips_integrity
  test('validate_all_trips_integrity', async () => {
    const { data, error } = await supabase.rpc('validate_all_trips_integrity');
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('Expected array result');
    return `✅ Returned ${data.length} trips with issues`;
  });

  // Test 5: validate_all_guides_integrity
  test('validate_all_guides_integrity', async () => {
    const { data, error } = await supabase.rpc('validate_all_guides_integrity');
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('Expected array result');
    return `✅ Returned ${data.length} guides with issues`;
  });

  // Test 6: run_daily_validation_check
  test('run_daily_validation_check', async () => {
    const { data: logId, error } = await supabase.rpc('run_daily_validation_check');
    if (error) throw error;
    if (!logId) throw new Error('Expected log ID');
    
    // Verify log exists
    const { data: log, error: logError } = await supabase
      .from('validation_logs')
      .select('*')
      .eq('id', logId)
      .single();
    
    if (logError || !log) throw new Error('Log not found');
    return `✅ Created log ${logId}, status: ${log.status}`;
  });

  // Test 7: get_validation_summary
  test('get_validation_summary', async () => {
    const { data, error } = await supabase.rpc('get_validation_summary', {
      p_hours: 24,
    });
    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) throw new Error('Expected array result');
    return `✅ Returned summary`;
  });

  // Test 8: check_missing_payments_count
  test('check_missing_payments_count', async () => {
    const { data, error } = await supabase.rpc('check_missing_payments_count');
    if (error) throw error;
    if (typeof data !== 'number') throw new Error('Expected number result');
    return `✅ Found ${data} missing payments`;
  });

  // Run all tests
  for (const { name, fn } of tests) {
    try {
      console.log(`🔍 Testing ${name}...`);
      const result = await fn();
      console.log(`   ${result}\n`);
      passed++;
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failed++;
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

