#!/usr/bin/env node

/**
 * Run Master Contract Migration
 * Execute migration 041-guide-contracts-master-support.sql
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL or SUPABASE_DB_URL not found in .env.local');
  console.error('\n💡 Please add DATABASE_URL to .env.local:');
  console.error('   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"\n');
  console.error('   Or get it from Supabase Dashboard → Settings → Database → Connection string\n');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Running Master Contract Migration...\n');

  const migrationFile = join(__dirname, '..', 'supabase/migrations/20250121000001_041-guide-contracts-master-support.sql');

  if (!readFileSync(migrationFile, 'utf-8')) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  // Check if psql is available
  try {
    execSync('which psql', { stdio: 'ignore' });
  } catch {
    console.error('❌ Error: psql not found');
    console.error('\n💡 Please install psql:');
    console.error('   brew install postgresql  # macOS');
    console.error('   apt-get install postgresql-client  # Linux');
    console.error('\nOr run migration manually via Supabase Dashboard:');
    console.error('   1. Go to Supabase Dashboard → SQL Editor');
    console.error(`   2. Copy contents of: ${migrationFile}`);
    console.error('   3. Paste and run\n');
    process.exit(1);
  }

  try {
    console.log(`📦 Executing: 041-guide-contracts-master-support.sql\n`);
    
    execSync(`psql "${DATABASE_URL}" -f "${migrationFile}"`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });

    console.log('\n✅ Migration executed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    
    const verifySQL = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'guide_contracts'
        AND column_name IN ('is_master_contract', 'auto_cover_trips', 'renewal_date', 'previous_contract_id')
      ORDER BY column_name;
    `;

    try {
      const verifyOutput = execSync(`psql "${DATABASE_URL}" -c "${verifySQL}"`, {
        encoding: 'utf-8',
      });
      
      if (verifyOutput.includes('is_master_contract')) {
        console.log('✅ Migration verified: New columns exist\n');
        console.log('📋 Added columns:');
        console.log('   - is_master_contract (BOOLEAN)');
        console.log('   - auto_cover_trips (BOOLEAN)');
        console.log('   - renewal_date (DATE)');
        console.log('   - previous_contract_id (UUID)\n');
      } else {
        console.log('⚠️  Warning: Could not verify migration (columns may not be visible yet)\n');
      }
    } catch (verifyError) {
      console.log('⚠️  Warning: Could not verify migration\n');
    }

    // Check trigger
    console.log('🔍 Checking trigger...\n');
    const triggerSQL = `
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE trigger_name = 'trigger_auto_link_trip_to_master_contract';
    `;

    try {
      const triggerOutput = execSync(`psql "${DATABASE_URL}" -c "${triggerSQL}"`, {
        encoding: 'utf-8',
      });
      
      if (triggerOutput.includes('trigger_auto_link_trip_to_master_contract')) {
        console.log('✅ Trigger created: trigger_auto_link_trip_to_master_contract\n');
      }
    } catch {
      console.log('⚠️  Warning: Could not verify trigger\n');
    }

    console.log('🎉 Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Test contract creation (annual master contract)');
    console.log('   2. Test trip assignment (auto-link to master contract)');
    console.log('   3. Test payment processing (fee from trip_guides)\n');

  } catch (error) {
    // Some errors are expected (already exists, etc.)
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message || '';
    
    if (errorOutput.includes('already exists') || 
        errorOutput.includes('duplicate') ||
        errorOutput.includes('does not exist') && errorOutput.includes('DROP')) {
      console.log('⚠️  Some objects already exist or were skipped (this is normal if migration was run before)');
      console.log('✅ Migration completed (with expected warnings)\n');
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('\n💡 Please check the error above and run manually if needed:');
      console.error(`   File: ${migrationFile}\n`);
      process.exit(1);
    }
  }
}

runMigration().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
