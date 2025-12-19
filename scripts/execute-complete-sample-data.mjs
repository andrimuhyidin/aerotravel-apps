#!/usr/bin/env node
/**
 * Execute Complete Sample Data Migration
 * Updates packages with itinerary JSONB and inserts ops_broadcasts data
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const projectRoot = join(__dirname, '..');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function executeMigration(sql, migrationName) {
  console.log(`\n📦 Executing: ${migrationName}`);
  
  try {
    // Try RPC exec_sql first (execute entire file as one statement)
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      statement: sql,
    });

    if (rpcError) {
      // If RPC doesn't exist, suggest manual execution
      if (rpcError.message?.includes('Could not find the function')) {
        console.log('   ⚠️  RPC exec_sql not available');
        console.log('   💡 Please run migration manually via Supabase Dashboard or psql');
        return { success: 0, skipped: 1, errors: 0 };
      }
      
      throw rpcError;
    }

    console.log('   ✅ Migration executed successfully!');
    return { success: 1, skipped: 0, errors: 0 };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message?.substring(0, 200)}`);
    console.log('   💡 This migration contains DO blocks that may need manual execution');
    return { success: 0, skipped: 0, errors: 1 };
  }
}

async function main() {
  console.log('🚀 Executing Complete Sample Data Migration\n');
  console.log(`📡 Supabase URL: ${supabaseUrl}\n`);

  const migrationFile = join(projectRoot, 'supabase/migrations/20251221000003_031-complete-sample-data.sql');
  const migrationName = migrationFile.split('/').pop();
  
  const sql = readFileSync(migrationFile, 'utf8');
  
  const result = await executeMigration(sql, migrationName);

  console.log('\n🎉 Migration execution completed!');
  console.log(`\n📊 Summary: ${result.success} executed, ${result.skipped} skipped, ${result.errors} errors`);
  
  if (result.errors > 0 || result.skipped > 0) {
    console.log('\n💡 Some statements may need to be run manually via Supabase Dashboard SQL Editor');
    console.log(`   Dashboard: ${supabaseUrl.replace('/rest/v1', '')}/project/${supabaseUrl.split('/').pop()}/sql/new`);
    console.log(`   File: ${migrationFile}`);
    console.log('\n   Or use psql:');
    console.log(`   psql "$DATABASE_URL" -f ${migrationFile}`);
  } else {
    console.log('\n✅ All statements executed successfully!');
    console.log('   Sample data is now complete:');
    console.log('   - ✅ Packages updated with itinerary JSONB');
    console.log('   - ✅ Ops broadcasts inserted');
    console.log('   - ✅ Reviews updated');
  }
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
});
