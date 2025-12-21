#!/usr/bin/env node

/**
 * Apply Validation Migrations
 * Applies the 3 new validation-related migration files
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  console.error('   Please ensure DATABASE_URL is set in your .env.local file');
  process.exit(1);
}

const migrations = [
  '20250130000001_073-comprehensive-data-validation-functions.sql',
  '20250130000002_074-validation-monitoring-cron.sql',
  '20250130000003_075-data-fix-functions.sql',
];

async function applyMigration(client, filename) {
  const filePath = join(__dirname, '../supabase/migrations', filename);
  
  console.log(`\n📄 Applying: ${filename}...`);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    console.log('   ⏳ Executing migration...');
    await client.query(sql);
    console.log('   ✅ Migration executed successfully!');
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error applying migration:`, error.message);
    // Don't fail completely, continue with next migration
    return false;
  }
}

async function verifyFunctions(client) {
  console.log('\n🔍 Verifying functions...');
  
  const functions = [
    'validate_trip_data_integrity',
    'validate_guide_data_integrity',
    'validate_payment_integrity',
    'validate_all_trips_integrity',
    'validate_all_guides_integrity',
    'run_daily_validation_check',
    'get_validation_summary',
    'fix_orphaned_trip_guides',
    'fix_missing_wallets',
    'fix_balance_mismatches',
    'fix_date_inconsistencies',
    'fix_negative_balances',
    'check_missing_payments_count',
  ];

  const { rows } = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_name = ANY($1::text[])
    ORDER BY routine_name;
  `, [functions]);

  const existingFunctions = rows.map((r) => r.routine_name);
  const missingFunctions = functions.filter((f) => !existingFunctions.includes(f));

  if (existingFunctions.length > 0) {
    console.log('   ✅ Functions found:');
    existingFunctions.forEach((f) => console.log(`      - ${f}`));
  }

  if (missingFunctions.length > 0) {
    console.log('   ⚠️  Missing functions:');
    missingFunctions.forEach((f) => console.log(`      - ${f}`));
  }

  return missingFunctions.length === 0;
}

async function verifyTables(client) {
  console.log('\n🔍 Verifying tables...');
  
  const { rows } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'validation_logs'
    ORDER BY table_name;
  `);

  if (rows.length > 0) {
    console.log('   ✅ Table found: validation_logs');
    return true;
  } else {
    console.log('   ⚠️  Table not found: validation_logs');
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Validation Migrations\n');
  console.log(`📡 Database: ${DATABASE_URL.substring(0, 30)}...\n`);

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    for (const migration of migrations) {
      const success = await applyMigration(client, migration);
      if (success) successCount++;
    }

    console.log(`\n📊 Applied ${successCount}/${migrations.length} migrations\n`);

    // Verify
    const functionsOk = await verifyFunctions(client);
    const tablesOk = await verifyTables(client);

    if (functionsOk && tablesOk) {
      console.log('\n✅ All migrations applied and verified successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Test validation: pnpm validate:guide-data --all');
      console.log('   2. Test API: GET /api/admin/guide/data-validation');
    } else {
      console.log('\n⚠️  Some verifications failed. Please check the output above.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
