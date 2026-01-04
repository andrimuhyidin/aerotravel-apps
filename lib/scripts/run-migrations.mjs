#!/usr/bin/env node
/**
 * Simple Migration Executor using fetch API
 * Run: node lib/scripts/run-migrations.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local
const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Migration Executor\n');
console.log('📦 URL:', SUPABASE_URL);
console.log('🔑 Key:', SERVICE_ROLE_KEY ? '✓ Found' : '✗ Missing');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials in .env.local');
  process.exit(1);
}

const migrations = [
  'supabase/migrations/20250225000013_121-package-reviews-system.sql',
  'supabase/migrations/20250225000014_122-analytics-ab-testing-feedback.sql',
];

async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function runMigrations() {
  for (const migrationPath of migrations) {
    console.log(`📄 Reading: ${migrationPath}`);
    
    try {
      const sql = readFileSync(resolve(process.cwd(), migrationPath), 'utf8');
      console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB`);
      console.log(`⚙️  Executing...`);
      
      await executeSQL(sql);
      
      console.log(`✅ Success!\n`);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`);
      
      console.log('💡 Manual Execution Instructions:');
      console.log(`   1. Open: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
      console.log(`   2. Copy-paste content from: ${migrationPath}`);
      console.log(`   3. Click "Run"\n`);
      
      return false;
    }
  }
  
  return true;
}

runMigrations().then(success => {
  if (success) {
    console.log('🎉 All migrations executed successfully!\n');
  } else {
    console.log('⚠️  Please complete migrations manually.\n');
    process.exit(1);
  }
});

