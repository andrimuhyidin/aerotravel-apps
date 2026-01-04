/**
 * Direct Migration Executor
 * Executes SQL directly to Supabase using REST API
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read credentials from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 DIRECT MIGRATION EXECUTOR\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📦 Project:', SUPABASE_URL);
console.log('🔑 Service Key:', SERVICE_ROLE_KEY ? '✓ Found' : '✗ Missing');
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function executeSQL(sql, description) {
  console.log(`⚙️  Executing: ${description}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    const text = await response.text();
    
    if (response.ok || response.status === 200) {
      console.log(`   ✅ Success!\n`);
      return { success: true, data: text };
    } else {
      console.log(`   ⚠️  Response: ${response.status} - ${text}\n`);
      return { success: false, error: text, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('📄 Step 1: Loading migration files...\n');
  
  const migrationSQL = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/COMBINED_MIGRATION.sql'),
    'utf8'
  );
  
  const sampleDataSQL = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/SAMPLE_DATA_SEED.sql'),
    'utf8'
  );
  
  console.log(`   ✓ Main migration: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
  console.log(`   ✓ Sample data: ${(sampleDataSQL.length / 1024).toFixed(2)} KB\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📄 Step 2: Executing main migrations...\n');
  
  const result1 = await executeSQL(migrationSQL, 'COMBINED_MIGRATION.sql');
  
  if (!result1.success && result1.status !== 404) {
    console.log('⚠️  Note: RPC endpoint may not exist. Trying alternative method...\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📄 Step 3: Seeding sample data...\n');
  
  const result2 = await executeSQL(sampleDataSQL, 'SAMPLE_DATA_SEED.sql');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 EXECUTION SUMMARY\n');
  console.log(`   Main Migration: ${result1.success ? '✅ Success' : '⚠️  Check manually'}`);
  console.log(`   Sample Data: ${result2.success ? '✅ Success' : '⚠️  Check manually'}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!result1.success || !result2.success) {
    console.log('⚠️  ALTERNATIVE APPROACH REQUIRED\n');
    console.log('Since direct RPC execution failed, please use manual method:\n');
    console.log('1. Open: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new');
    console.log('2. Copy from: supabase/migrations/COMBINED_MIGRATION.sql');
    console.log('3. Paste and Run');
    console.log('4. Then repeat for: SAMPLE_DATA_SEED.sql\n');
  } else {
    console.log('🎉 All migrations executed successfully!\n');
  }
}

main().catch(console.error);

