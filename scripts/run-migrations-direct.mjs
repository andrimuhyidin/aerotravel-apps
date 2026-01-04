/**
 * Run Partner Portal Migrations using Supabase SQL directly
 * Uses postgres connection via @supabase/postgres-js
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env vars
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const databaseUrl = env.DATABASE_URL || env.POSTGRES_URL || env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error('❌ No DATABASE_URL found in .env.local');
  console.error('Available keys:', Object.keys(env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('SUPABASE')));
  
  // Construct from Supabase URL
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    console.log(`\nProject ref detected: ${projectRef}`);
    console.log('\nYou can add DATABASE_URL to .env.local:');
    console.log(`DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`);
  }
  process.exit(1);
}

console.log('🔌 Connecting to database...');

const sql = postgres(databaseUrl, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  // Disable implicit transactions
  onnotice: (notice) => {
    if (notice.severity !== 'NOTICE') {
      console.log(`   [${notice.severity}] ${notice.message}`);
    }
  },
});

// Migration files to run (in order)
const migrationFiles = [
  '20260102000002_referral-tracking.sql',
  '20260102000003_partner-broadcasts.sql',
  '20260102000004_price-alerts.sql',
  '20260102000005_gift-vouchers.sql',
  '20260102000006_partner-branches.sql',
  '20260102000007_partner-contracts.sql',
  '20260102000008_custom-reports.sql',
  '20260102000009_competitor-prices.sql',
];

async function runMigration(fileName, sqlConnection) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Skipping ${fileName} - file not found`);
    return 'skipped';
  }

  const sqlContent = fs.readFileSync(filePath, 'utf-8');

  console.log(`\n📦 Running: ${fileName}`);
  console.log(`   SQL length: ${sqlContent.length} chars`);

  // Create a fresh connection for each migration to avoid transaction issues
  const freshSql = postgres(databaseUrl, {
    ssl: 'require',
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  });

  try {
    await freshSql.unsafe(sqlContent);
    console.log(`   ✅ Success`);
    await freshSql.end();
    return 'success';
  } catch (err) {
    await freshSql.end();
    // Check if it's just "already exists" error
    if (err.message.includes('already exists') || 
        err.message.includes('duplicate') ||
        err.code === '42P07') {
      console.log(`   ⏭️ Already exists (skipping)`);
      return 'exists';
    }
    console.log(`   ❌ Error: ${err.message}`);
    return 'failed';
  }
}

async function main() {
  console.log('🚀 Partner Portal Migration Runner (Direct)');
  console.log('============================================');

  const results = {
    success: [],
    exists: [],
    failed: [],
    skipped: [],
  };

  try {
    // Test connection
    const testResult = await sql`SELECT NOW() as time`;
    console.log(`✅ Connected at ${testResult[0].time}`);
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
    process.exit(1);
  }

  for (const file of migrationFiles) {
    const result = await runMigration(file);
    results[result]?.push(file);
  }

  console.log('\n============================================');
  console.log('📊 Migration Summary');
  console.log('============================================');
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`⏭️ Already exists: ${results.exists.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️ Skipped: ${results.skipped.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed migrations:');
    results.failed.forEach((f) => console.log(`  - ${f}`));
  }

  await sql.end();
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

