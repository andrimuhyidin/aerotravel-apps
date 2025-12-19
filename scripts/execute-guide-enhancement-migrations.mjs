/**
 * Execute Guide Enhancement System Migrations
 * Runs all migrations for the new guide enhancement features
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeMigration(filePath, fileName) {
  console.log(`\n📄 Executing: ${fileName}`);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    // Execute SQL using Supabase RPC or direct query
    // Note: Supabase JS client doesn't support raw SQL execution
    // We need to use the REST API or psql
    
    // Try using Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (response.ok) {
      console.log(`✅ ${fileName} executed successfully`);
      return true;
    } else {
      // Fallback: Try direct psql if available
      console.log(`⚠️  REST API failed, trying alternative method...`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error executing ${fileName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Guide Enhancement System Migrations...\n');

  const migrations = [
    {
      file: join(__dirname, '..', 'supabase', 'migrations', '20251220000005_033-guide-enhancement-system.sql'),
      name: '033-guide-enhancement-system.sql',
    },
    {
      file: join(__dirname, '..', 'supabase', 'migrations', '20251220000006_034-guide-enhancement-default-data.sql'),
      name: '034-guide-enhancement-default-data.sql',
    },
    {
      file: join(__dirname, '..', 'supabase', 'migrations', '20251220000007_035-guide-enhancement-menu-items.sql'),
      name: '035-guide-enhancement-menu-items.sql',
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    try {
      const sql = readFileSync(migration.file, 'utf-8');
      
      // Split SQL by semicolons and execute each statement
      // Remove comments and empty statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      console.log(`\n📄 Executing: ${migration.name}`);
      console.log(`   Found ${statements.length} SQL statements`);

      // Execute using Supabase PostgREST (limited - can't execute DDL)
      // For DDL (CREATE TABLE, etc.), we need to use psql or Supabase Dashboard
      console.log(`⚠️  Note: DDL statements (CREATE TABLE, etc.) need to be executed via psql or Supabase Dashboard`);
      console.log(`   Migration file: ${migration.file}`);
      
      // Check if we can use psql
      const { execSync } = await import('child_process');
      const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
      
      if (databaseUrl) {
        try {
          console.log(`   Attempting to execute via psql...`);
          execSync(`psql "${databaseUrl}" -f "${migration.file}"`, {
            stdio: 'inherit',
            encoding: 'utf-8',
          });
          console.log(`✅ ${migration.name} executed successfully via psql`);
          successCount++;
        } catch (psqlError) {
          console.error(`❌ psql execution failed:`, psqlError.message);
          console.log(`\n📋 Manual execution required:`);
          console.log(`   psql $DATABASE_URL -f "${migration.file}"`);
          failCount++;
        }
      } else {
        console.log(`\n📋 Manual execution required:`);
        console.log(`   Option 1: Via Supabase Dashboard SQL Editor`);
        console.log(`   Option 2: psql $DATABASE_URL -f "${migration.file}"`);
        console.log(`   Option 3: supabase migration up`);
        failCount++;
      }
    } catch (error) {
      console.error(`❌ Error reading ${migration.name}:`, error.message);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed/Manual: ${failCount}`);
  console.log(`${'='.repeat(60)}\n`);

  if (failCount > 0) {
    console.log('⚠️  Some migrations require manual execution.');
    console.log('   Please run them via Supabase Dashboard or psql.\n');
    process.exit(1);
  } else {
    console.log('✅ All migrations executed successfully!\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
