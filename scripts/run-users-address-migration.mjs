#!/usr/bin/env node

/**
 * Script to run users address migration
 * Adds address column to users table
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database connection from environment
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL or SUPABASE_DB_URL not found in .env.local');
  console.error('\n💡 Please add DATABASE_URL to .env.local:');
  console.error('   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"\n');
  console.error('   Or get it from Supabase Dashboard → Settings → Database → Connection string\n');
  process.exit(1);
}

const migrationFile = join(__dirname, '..', 'supabase', 'migrations', '20250122000001_042-users-add-address.sql');

console.log('🔄 Running users address migration...\n');
console.log(`📄 Migration file: ${migrationFile}\n`);

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
  console.log('⏳ Executing migration...\n');
  
  // Execute migration using psql with -f flag (file input)
  execSync(`psql "${dbUrl}" -f "${migrationFile}"`, {
    stdio: 'inherit',
    encoding: 'utf-8',
  });

  console.log('\n✅ Migration executed successfully!\n');

  // Verify migration
  console.log('🔍 Verifying migration...\n');
  const verifySql = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address';
  `;

  try {
    const verifyResult = execSync(`psql "${dbUrl}" -c "${verifySql}"`, {
      encoding: 'utf-8',
    });

    if (verifyResult.includes('address')) {
      console.log('✅ Address column exists in users table');
      console.log(verifyResult);
      console.log('\n🎉 Migration completed successfully!\n');
    } else {
      console.log('⚠️  Warning: Could not verify migration (column may not be visible yet)\n');
    }
  } catch (verifyError) {
    console.log('⚠️  Warning: Could not verify migration\n');
  }

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
