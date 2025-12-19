#!/usr/bin/env node
/**
 * Execute Guide Contracts Migrations
 * Run migrations directly to Supabase using psql
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  console.error('Please add DATABASE_URL to .env.local');
  process.exit(1);
}

async function runMigrationWithPsql(filePath) {
  try {
    console.log(`📦 Executing: ${filePath.split('/').pop()}`);
    execSync(`psql "${DATABASE_URL}" -f "${filePath}"`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    console.log('✅ Migration executed successfully\n');
    return true;
  } catch (error) {
    // Some errors are expected (already exists, etc.)
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
    if (errorOutput.includes('already exists') || errorOutput.includes('duplicate')) {
      console.log('⚠️  Some objects already exist (this is normal if migration was run before)');
      return true;
    }
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function fixRLSPolicies() {
  console.log('\n🔧 Fixing RLS policies (removing invalid "admin" role)...\n');

  const fixSQL = `
    -- Fix guide_contracts_admin policy
    DROP POLICY IF EXISTS "guide_contracts_admin" ON guide_contracts;
    CREATE POLICY "guide_contracts_admin" ON guide_contracts
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('super_admin', 'ops_admin', 'finance_manager')
        )
      );

    -- Fix guide_contract_trips_admin policy
    DROP POLICY IF EXISTS "guide_contract_trips_admin" ON guide_contract_trips;
    CREATE POLICY "guide_contract_trips_admin" ON guide_contract_trips
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('super_admin', 'ops_admin', 'finance_manager')
        )
      );

    -- Fix guide_contract_payments_admin policy
    DROP POLICY IF EXISTS "guide_contract_payments_admin" ON guide_contract_payments;
    CREATE POLICY "guide_contract_payments_admin" ON guide_contract_payments
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('super_admin', 'ops_admin', 'finance_manager')
        )
      );
  `;

  try {
    execSync(`psql "${DATABASE_URL}" -c "${fixSQL.replace(/\n/g, ' ').replace(/\s+/g, ' ')}"`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    console.log('✅ RLS policies fixed\n');
    return true;
  } catch (error) {
    console.warn('⚠️  RLS fix failed (policies may already be correct):', error.message);
    return false;
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');

  const verifySQL = `
    SELECT 
      table_name,
      CASE WHEN table_name IN ('guide_contracts', 'guide_contract_trips', 'guide_contract_payments') THEN '✅' ELSE '❌' END as status
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('guide_contracts', 'guide_contract_trips', 'guide_contract_payments')
    ORDER BY table_name;
  `;

  try {
    execSync(`psql "${DATABASE_URL}" -c "${verifySQL}"`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    return true;
  } catch (error) {
    console.warn('⚠️  Verification query failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Executing Guide Contracts Migrations...\n');

  const migrationFiles = [
    join(__dirname, '..', 'supabase', 'migrations', '20250121000000_040-guide-contracts.sql'),
    join(__dirname, '..', 'supabase', 'migrations', '20250121000001_041-contract-auto-expire-cron.sql'),
    join(__dirname, '..', 'supabase', 'migrations', '20250122000000_042-guide-contract-sanctions-resign.sql'),
  ];

  let successCount = 0;

  for (const file of migrationFiles) {
    const success = await runMigrationWithPsql(file);
    if (success) {
      successCount++;
    }
  }

  // Fix RLS policies
  await fixRLSPolicies();

  // Verify
  await verifySetup();

  if (successCount === migrationFiles.length) {
    console.log('✅ All migrations executed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('  1. Create storage policies (if not done)');
    console.log('  2. Test creating a contract');
  } else {
    console.log(`\n⚠️  ${successCount}/${migrationFiles.length} migrations executed`);
  }
}

main().catch((error) => {
  console.error('❌ Execution failed:', error);
  process.exit(1);
});
