/**
 * Run Partner Portal Migrations
 * Execute new migration files against Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env vars
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
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

async function runMigration(fileName) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Skipping ${fileName} - file not found`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log(`\n📦 Running: ${fileName}`);
  console.log(`   SQL length: ${sql.length} chars`);

  try {
    // Use rpc to execute raw SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql function doesn't exist, try direct REST API
      if (error.message.includes('function') || error.code === 'PGRST202') {
        console.log('   Trying alternative method...');
        // Split SQL into statements and execute one by one
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          const res = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
            method: 'POST',
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({}),
          });
        }
        console.log(`   ⚠️ Alternative method - manual review needed`);
        return 'manual';
      }

      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Success`);
    return true;
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Partner Portal Migration Runner');
  console.log('===================================');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Migrations to run: ${migrationFiles.length}`);

  const results = {
    success: [],
    failed: [],
    skipped: [],
    manual: [],
  };

  for (const file of migrationFiles) {
    const result = await runMigration(file);
    if (result === true) {
      results.success.push(file);
    } else if (result === 'manual') {
      results.manual.push(file);
    } else if (result === false) {
      results.failed.push(file);
    } else {
      results.skipped.push(file);
    }
  }

  console.log('\n===================================');
  console.log('📊 Migration Summary');
  console.log('===================================');
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`⚠️ Manual review: ${results.manual.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⏭️ Skipped: ${results.skipped.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed migrations:');
    results.failed.forEach((f) => console.log(`  - ${f}`));
  }

  if (results.manual.length > 0) {
    console.log('\n⚠️ These migrations need to be run manually via Supabase Dashboard:');
    results.manual.forEach((f) => console.log(`  - ${f}`));
    console.log('\nGo to: https://supabase.com/dashboard/project/[project-id]/sql/new');
  }
}

main().catch(console.error);

