#!/usr/bin/env node
/**
 * Run Database Migrations
 * Executes migration files in order
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

// Get database connection from env
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL not found in .env.local');
  process.exit(1);
}

// Parse connection string
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
});

// Migration files to run (in order)
const migrations = [
  '20251226000001_113-partner-credit-limit-tracking.sql',
  '20251226000002_114-partner-reward-points.sql',
  '20251226000003_115-inbox-parsing.sql',
];

async function runMigration(filename) {
  const filePath = join(__dirname, '..', 'supabase', 'migrations', filename);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    console.log(`\n📄 Running: ${filename}`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✅ Success: ${filename}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error in ${filename}:`, error.message);
    if (error.code === '42P07' || error.message.includes('already exists')) {
      console.log(`⚠️  Warning: ${filename} - Some objects may already exist (skipping)`);
      return true; // Continue even if some objects exist
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');
  console.log(`📊 Database: ${databaseUrl.split('@')[1]?.split('/')[1] || 'connected'}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    try {
      const success = await runMigration(migration);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    } catch (error) {
      console.error(`\n❌ Failed to run ${migration}:`, error.message);
      errorCount++;
      // Continue with next migration
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Completed: ${successCount}/${migrations.length} migrations`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} migrations failed`);
  }
  console.log('='.repeat(50) + '\n');

  await pool.end();

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
