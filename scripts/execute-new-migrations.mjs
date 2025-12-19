#!/usr/bin/env node
/**
 * Execute new Guide App migrations (014, 015, 016) via Supabase
 * Uses service role key to execute SQL directly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const migrations = [
  'scripts/migrations/014-guide-equipment-checklist.sql',
  'scripts/migrations/015-guide-trip-activity-log.sql',
  'scripts/migrations/016-guide-performance-goals.sql',
];

async function executeSQL(sql) {
  // Use Supabase REST API with service role key
  // We'll use the PostgREST endpoint with raw SQL execution
  try {
    // Try using Supabase's exec function if it exists
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (!error) return data;
  } catch (e) {
    // Function doesn't exist, try direct REST API
  }

  // Alternative: Use REST API directly
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (response.ok) {
    return await response.json();
  }

  // If that doesn't work, we need to use psql or Supabase Dashboard
  throw new Error('Direct SQL execution not available. Please use Supabase Dashboard or psql.');
}

async function runMigration(filePath) {
  console.log(`📦 Running ${filePath}...`);
  
  const fullPath = join(__dirname, '..', filePath);
  let sql = readFileSync(fullPath, 'utf8');
  
  // Remove comments and clean up
  sql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--') || line.trim().startsWith('-- Migration:'))
    .join('\n');
  
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
    .map(s => s + ';');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const stmt of statements) {
    if (stmt.length < 10) continue;
    
    try {
      // For CREATE TABLE, CREATE INDEX, ALTER TABLE, CREATE POLICY
      // We need to execute via Supabase Dashboard or psql
      // But let's try to use the REST API with proper formatting
      
      const stmtClean = stmt.replace(/;$/, '').trim();
      if (!stmtClean) continue;
      
      // Try to execute via Supabase Management API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ query: stmtClean }),
      });
      
      if (response.ok) {
        successCount++;
        console.log(`   ✅ Executed: ${stmtClean.substring(0, 60)}...`);
      } else {
        const errorText = await response.text();
        // Check if it's a "already exists" error (which is OK)
        if (errorText.includes('already exists') || errorText.includes('duplicate')) {
          skipCount++;
          console.log(`   ⏭️  Skipped (already exists): ${stmtClean.substring(0, 50)}...`);
        } else {
          errorCount++;
          console.log(`   ⚠️  Error: ${errorText.substring(0, 100)}`);
        }
      }
    } catch (error) {
      errorCount++;
      console.log(`   ⚠️  Error: ${error.message.substring(0, 100)}`);
    }
  }
  
  console.log(`   📊 Summary: ${successCount} executed, ${skipCount} skipped, ${errorCount} errors\n`);
  
  if (errorCount > 0 && successCount === 0) {
    console.log(`   💡 This migration may need to be run manually via Supabase Dashboard`);
  }
}

async function main() {
  console.log('🚀 Executing new Guide App migrations...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);
  
  try {
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('🎉 Migration execution completed!');
    console.log('\n💡 Note: If some statements failed, please run them manually via Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new');
    console.log('\n📋 Or use the combined file: scripts/migrations/014-016-combined.sql');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please run migrations manually via Supabase Dashboard SQL Editor');
    console.log('   Dashboard: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new');
    console.log('   File: scripts/migrations/014-016-combined.sql');
    process.exit(1);
  }
}

main();

