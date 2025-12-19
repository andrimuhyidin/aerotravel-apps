#!/usr/bin/env node

/**
 * Seed Guide Contracts Sample Data
 * Creates sample contracts for testing
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedContracts() {
  console.log('🌱 Seeding guide contracts sample data...\n');

  try {
    // Read SQL file
    const sqlPath = join(__dirname, '../supabase/seed/guide-contracts-sample.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      statement: sql,
    });

    if (error) {
      // Try direct execution via REST API
      console.log('⚠️  RPC method not available, trying alternative...\n');
      
      // Check if tables exist first
      const { data: contracts, error: checkError } = await supabase
        .from('guide_contracts')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === 'PGRST116') {
        console.error('❌ Table guide_contracts does not exist!');
        console.error('   Please run migration first:');
        console.error('   supabase/migrations/20250121000000_040-guide-contracts.sql\n');
        process.exit(1);
      }

      console.log('📋 Please run the SQL manually via Supabase Dashboard:\n');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy contents of: supabase/seed/guide-contracts-sample.sql');
      console.log('   3. Paste and run\n');
      
      return;
    }

    console.log('✅ Sample contracts created successfully!\n');
    console.log('📋 Created contracts:');
    console.log('   - Contract 1: Pending Signature (Per Trip)');
    console.log('   - Contract 2: Active (Monthly)');
    console.log('   - Contract 3: Pending Company (Project)\n');

    // Verify contracts
    const { data: contracts, error: verifyError } = await supabase
      .from('guide_contracts')
      .select('id, contract_number, status, contract_type')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!verifyError && contracts && contracts.length > 0) {
      console.log('✅ Verification: Contracts found in database\n');
      contracts.forEach((c) => {
        console.log(`   - ${c.contract_number} (${c.status}, ${c.contract_type})`);
      });
    }

  } catch (error) {
    console.error('❌ Error seeding contracts:', error.message);
    console.error('\n📋 Please run the SQL manually via Supabase Dashboard:\n');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of: supabase/seed/guide-contracts-sample.sql');
    console.log('   3. Paste and run\n');
    process.exit(1);
  }
}

seedContracts().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
