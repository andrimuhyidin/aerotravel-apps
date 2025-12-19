#!/usr/bin/env node
/**
 * Execute Itinerary & Reviews RLS Migration
 * Fixes root cause of itinerary 500 error and ratings/reviews errors
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

  // Remove BEGIN/COMMIT
  let cleanSQL = sql
    .replace(/^BEGIN;?\s*/i, '')
    .replace(/COMMIT;?\s*$/i, '')
    .trim();

  // Split into statements (handle DO blocks properly)
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
        // Try REST API with different parameter name
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ sql_query: statement }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (errorText.includes('already exists') || errorText.includes('duplicate') || errorText.includes('already enabled')) {
            skipCount++;
            if (i % 5 === 0) {
              process.stdout.write(`   Progress: ${i + 1}/${statements.length} (${skipCount} skipped)\r`);
            }
            continue;
          }
          if (errorText.includes('Could not find the function') || errorText.includes('function exec_sql')) {
            // exec_sql doesn't exist, we need to execute via Management API or psql
            throw new Error('exec_sql function not available. Using alternative method...');
          }
          // For other errors, log but continue
          console.log(`\n   ⚠️  Statement ${i + 1}: ${errorText.substring(0, 100)}`);
          errorCount++;
          continue;
        }
      }
      
      successCount++;
      if (i % 5 === 0) {
        process.stdout.write(`   Progress: ${i + 1}/${statements.length}\r`);
      }
    } catch (error) {
      if (error.message.includes('exec_sql function not available')) {
        // Try to execute via Supabase Management API
        console.log('\n   ⚠️  exec_sql not available, trying Management API...');
        
        // Use Supabase Management API (requires different endpoint)
        try {
          const mgmtResponse = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/v1/projects/${supabaseUrl.split('/').pop()}/database/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ query: statement }),
          });

          if (mgmtResponse.ok) {
            successCount++;
            continue;
          }
        } catch (mgmtError) {
          // Management API also failed
        }
        
        // Last resort: show instructions
        console.log('\n   ❌ Cannot execute via API. Please run manually via Supabase Dashboard SQL Editor.');
        console.log(`   File: ${migrationName}`);
        errorCount++;
        continue;
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
  console.log('🚀 Executing Itinerary & Reviews RLS Migration\n');
  console.log(`📡 Supabase URL: ${supabaseUrl}\n`);

  const migrationFile = join(projectRoot, 'supabase/migrations/20251221000002_030-guide-itinerary-reviews-rls.sql');
  const migrationName = migrationFile.split('/').pop();
  
  const sql = readFileSync(migrationFile, 'utf8');
  
  const result = await executeMigration(sql, migrationName);

  console.log('\n🎉 Migration execution completed!');
  console.log(`\n📊 Summary: ${result.success} executed, ${result.skipped} skipped, ${result.errors} errors`);
  
  if (result.errors > 0) {
    console.log('\n💡 Some statements may need to be run manually via Supabase Dashboard SQL Editor');
    console.log(`   Dashboard: ${supabaseUrl.replace('/rest/v1', '')}/project/${supabaseUrl.split('/').pop()}/sql/new`);
    console.log(`   File: ${migrationFile}`);
  } else {
    console.log('\n✅ All statements executed successfully!');
    console.log('   Itinerary and Reviews RLS policies are now active.');
  }
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n💡 Please run migration manually via Supabase Dashboard SQL Editor');
  const migrationFile = join(projectRoot, 'supabase/migrations/20251221000002_030-guide-itinerary-reviews-rls.sql');
  console.log(`   File: ${migrationFile}`);
  process.exit(1);
});
