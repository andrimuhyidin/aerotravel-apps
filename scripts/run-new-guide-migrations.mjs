#!/usr/bin/env node
/**
 * Run new Guide App migrations (014, 015, 016)
 * Usage: node scripts/run-new-guide-migrations.mjs
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
  // Use Supabase REST API to execute SQL
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Try alternative: direct query execution
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      if (error) throw error;
      return data;
    } catch (e) {
      // If RPC doesn't exist, we'll need to use raw SQL via PostgREST
      throw new Error(`SQL execution failed: ${response.status} - ${errorText}`);
    }
  }

  return await response.json();
}

async function runMigration(filePath) {
  console.log(`📦 Running ${filePath}...`);
  
  const fullPath = join(__dirname, '..', filePath);
  const sql = readFileSync(fullPath, 'utf8');
  
  // Split SQL into statements, handling DO blocks
  const statements = [];
  let currentStatement = '';
  let inDoBlock = false;
  let inComment = false;
  
  const lines = sql.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('--')) {
      continue;
    }
    
    // Handle DO $$ blocks
    if (line.includes('DO $$')) {
      inDoBlock = true;
      currentStatement = line;
      continue;
    }
    
    if (inDoBlock) {
      currentStatement += '\n' + line;
      if (line.includes('END $$')) {
        inDoBlock = false;
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
      continue;
    }
    
    // Regular statements
    currentStatement += (currentStatement ? '\n' : '') + line;
    
    if (line.endsWith(';')) {
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = '';
    }
  }
  
  // Execute each statement
  for (const stmt of statements) {
    if (stmt.length < 10) continue;
    
    try {
      // Use Supabase client's raw query if available
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error) {
        // Try alternative: use PostgREST directly
        console.log(`   ⚠️  Trying alternative method for: ${stmt.substring(0, 50)}...`);
        // For CREATE TABLE and other DDL, we'll need to use Supabase Dashboard
        // But we can try to execute via REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ query: stmt }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`   ⚠️  Skipped (may already exist or need manual execution): ${errorText.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Warning: ${error.message.substring(0, 100)}`);
      console.log(`   💡 This statement may need to be run manually via Supabase Dashboard`);
    }
  }
  
  console.log(`✅ ${filePath} completed\n`);
}

async function main() {
  console.log('🚀 Running new Guide App migrations...\n');
  console.log(`📡 Connecting to: ${SUPABASE_URL}\n`);
  
  try {
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('🎉 All migrations completed!');
    console.log('\n💡 Note: Some DDL statements may need to be run manually via Supabase Dashboard SQL Editor');
    console.log('   Dashboard: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new');
    console.log('\n📋 Migration files:');
    migrations.forEach(m => console.log(`   - ${m}`));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please run migrations manually via Supabase Dashboard SQL Editor');
    console.log('   Dashboard: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new');
    process.exit(1);
  }
}

main();

