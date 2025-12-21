#!/usr/bin/env node
/**
 * Execute new Guide Apps improvements migrations
 * - 054-sos-alerts-table.sql
 * - 055-auto-insurance-manifest.sql
 * 
 * Usage: node scripts/execute-new-improvements.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const migrations = [
  '20250124000001_054-sos-alerts-table.sql',
  '20250124000002_055-auto-insurance-manifest.sql',
];

async function executeViaPsql(sql) {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL not found. Cannot execute via psql.');
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log('   ✅ Executed via psql');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('   ⚠️  Object may already exist (safe to ignore)');
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function executeViaSupabase(sql) {
  // Try to execute via Supabase REST API
  // For DDL statements, we'll use the service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Split SQL into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    if (stmt.length < 10) continue;

    try {
      // Try RPC if available
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error && !error.message.includes('does not exist')) {
        // If RPC doesn't exist, we'll need to use direct connection
        throw error;
      }
    } catch (error) {
      // Fallback to direct connection
      throw new Error(`Supabase RPC not available, need direct connection`);
    }
  }
}

async function runMigration(filename) {
  console.log(`\n📦 Running migration: ${filename}`);
  
  const filePath = join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = readFileSync(filePath, 'utf8');
  
  try {
    // Try psql first (most reliable for DDL)
    if (DATABASE_URL) {
      await executeViaPsql(sql);
      console.log(`✅ ${filename} completed via psql`);
      return true;
    } else {
      // Fallback: provide instructions
      console.log(`\n⚠️  DATABASE_URL not found. Please run manually:`);
      console.log(`\n📋 File: ${filename}`);
      console.log(`\n💡 Run via Supabase Dashboard SQL Editor:`);
      console.log(`   https://supabase.com/dashboard/project/_/sql/new\n`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log(`\n💡 Please run manually via Supabase Dashboard SQL Editor`);
    console.log(`   File: ${filename}\n`);
    return false;
  }
}

async function setupCronJob() {
  console.log('\n📅 Setting up cron job for auto-insurance manifest...');
  
  if (!DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found. Please setup cron job manually:');
    console.log('\n1. Go to Supabase Dashboard > Database > Cron Jobs');
    console.log('2. Create new cron job:');
    console.log('   Name: auto_insurance_manifest');
    console.log('   Schedule: 0 23 * * *');
    console.log('   SQL: SELECT generate_daily_insurance_manifests();');
    return;
  }

  try {
    const client = new pg.Client({
      connectionString: DATABASE_URL,
    });

    await client.connect();

    // Check if cron extension is enabled
    const { rows: extCheck } = await client.query(`
      SELECT * FROM pg_extension WHERE extname = 'pg_cron';
    `);

    if (extCheck.length === 0) {
      console.log('⚠️  pg_cron extension not enabled. Enabling...');
      await client.query('CREATE EXTENSION IF NOT EXISTS pg_cron;');
    }

    // Check if cron job already exists
    const { rows: jobCheck } = await client.query(`
      SELECT * FROM cron.job WHERE jobname = 'auto_insurance_manifest';
    `);

    if (jobCheck.length > 0) {
      console.log('✅ Cron job already exists');
    } else {
      // Create cron job
      await client.query(`
        SELECT cron.schedule(
          'auto_insurance_manifest',
          '0 23 * * *',
          $$SELECT generate_daily_insurance_manifests();$$
        );
      `);
      console.log('✅ Cron job created successfully');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Failed to setup cron job:', error.message);
    console.log('\n💡 Please setup manually via Supabase Dashboard');
  }
}

async function main() {
  console.log('🚀 Executing Guide Apps improvements migrations...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL?.substring(0, 40)}...`);
  console.log(`📡 Database: ${DATABASE_URL ? 'Connected' : 'Not configured (will provide manual instructions)'}\n`);

  let successCount = 0;
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) successCount++;
  }

  // Setup cron job
  await setupCronJob();

  console.log(`\n✅ Processed ${successCount}/${migrations.length} migrations`);
  
  if (successCount < migrations.length) {
    console.log('\n💡 For remaining migrations, please run via:');
    console.log('   1. Supabase Dashboard → SQL Editor');
    console.log('   2. Or add DATABASE_URL to .env.local and rerun this script');
  }

  console.log('\n🎉 Setup completed!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});

