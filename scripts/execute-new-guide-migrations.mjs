#!/usr/bin/env node
/**
 * Execute new Guide App migrations (014, 015, 016) via Supabase
 * Uses exec_sql RPC function or REST API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const migrations = [
  join(projectRoot, 'scripts/migrations/014-guide-equipment-checklist.sql'),
  join(projectRoot, 'scripts/migrations/015-guide-trip-activity-log.sql'),
  join(projectRoot, 'scripts/migrations/016-guide-performance-goals.sql'),
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function executeMigration(sql, migrationName, supabase, supabaseUrl, serviceRoleKey) {
  console.log(`\n📦 Executing: ${migrationName}`);

  // Remove BEGIN/COMMIT
  let cleanSQL = sql
    .replace(/^BEGIN;?\s*/i, '')
    .replace(/COMMIT;?\s*$/i, '')
    .trim();

  // Split into statements (handle DO blocks)
  const statements = [];
  let currentStatement = '';
  let inDoBlock = false;
  let doBlockDepth = 0;

  const lines = cleanSQL.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('--')) {
      if (inDoBlock) currentStatement += '\n' + line;
      continue;
    }

    if (trimmed.includes('DO $$')) {
      inDoBlock = true;
      doBlockDepth = 1;
      currentStatement = line;
      continue;
    }

    if (inDoBlock) {
      currentStatement += '\n' + line;
      if (trimmed.includes('$$')) {
        doBlockDepth += (trimmed.match(/\$\$/g) || []).length;
        if (doBlockDepth >= 2) {
          inDoBlock = false;
          doBlockDepth = 0;
          statements.push(currentStatement);
          currentStatement = '';
        }
      }
      continue;
    }

    if (trimmed.endsWith(';')) {
      currentStatement += (currentStatement ? '\n' : '') + line;
      if (currentStatement.length > 10) {
        statements.push(currentStatement);
      }
      currentStatement = '';
    } else {
      currentStatement += (currentStatement ? '\n' : '') + line;
    }
  }

  if (currentStatement && currentStatement.length > 10) {
    statements.push(currentStatement);
  }

  console.log(`   Found ${statements.length} statements`);

  // Execute each statement
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length < 10) continue;

    try {
      // Try exec_sql RPC function first
      const { error } = await supabase.rpc('exec_sql', { statement });
      
      if (error) {
        // Try REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ statement }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (errorText.includes('already exists') || errorText.includes('duplicate')) {
            skipCount++;
            if (i % 10 === 0) {
              process.stdout.write(`   Progress: ${i + 1}/${statements.length} (${skipCount} skipped)\r`);
            }
            continue;
          }
          if (errorText.includes('Could not find the function')) {
            throw new Error('exec_sql function not available. Please create it first via Supabase Dashboard.');
          }
          throw new Error(errorText.substring(0, 100));
        }
      }
      
      successCount++;
      if (i % 5 === 0) {
        process.stdout.write(`   Progress: ${i + 1}/${statements.length}\r`);
      }
    } catch (error) {
      if (error.message.includes('Could not find the function')) {
        throw error;
      }
      // Continue with warnings for expected errors
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        errorCount++;
        console.log(`\n   ⚠️  Statement ${i + 1}: ${error.message.substring(0, 80)}...`);
      } else {
        skipCount++;
      }
    }
  }

  console.log(`\n   ✅ Executed ${successCount}/${statements.length} statements (${skipCount} skipped, ${errorCount} errors)`);
  return { success: successCount, skipped: skipCount, errors: errorCount };
}

async function main() {
  console.log('🚀 New Guide App Migrations Execution\n');
  console.log(`📡 Supabase URL: ${supabaseUrl}\n`);

  // Check if exec_sql function exists
  const { error: testError } = await supabase.rpc('exec_sql', { 
    statement: 'SELECT 1;' 
  });

  if (testError && testError.message.includes('Could not find the function')) {
    console.log('⚠️  exec_sql function not found');
    console.log('📝 Creating exec_sql function first...\n');
    
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION exec_sql(statement TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE statement;
END;
$$;
    `.trim();

    // Try to create via REST API (this won't work, but we'll show the SQL)
    console.log('💡 Please create exec_sql function manually via Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new\n');
    console.log(createFunctionSQL);
    console.log('\n   After creating the function, run this script again.\n');
    process.exit(1);
  }

  console.log('✅ exec_sql function available\n');

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const migrationPath of migrations) {
    const migrationName = migrationPath.split('/').pop();
    const sql = readFileSync(migrationPath, 'utf8');
    
    const result = await executeMigration(sql, migrationName, supabase, supabaseUrl, serviceRoleKey);
    totalSuccess += result.success;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }

  console.log('\n🎉 All migrations completed!');
  console.log(`\n📊 Summary: ${totalSuccess} executed, ${totalSkipped} skipped, ${totalErrors} errors`);
  
  if (totalErrors > 0) {
    console.log('\n💡 Some statements may need to be run manually via Supabase Dashboard');
    console.log('   Dashboard: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new');
  }
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n💡 Please run migrations manually via Supabase Dashboard SQL Editor');
  console.log('   Dashboard: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new');
  console.log('   Files: scripts/migrations/014-016-combined.sql');
  process.exit(1);
});

