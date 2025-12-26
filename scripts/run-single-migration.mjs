#!/usr/bin/env node
/**
 * Run Single Migration File
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL not found');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
});

const filename = process.argv[2];

if (!filename) {
  console.error('Usage: node scripts/run-single-migration.mjs <filename>');
  process.exit(1);
}

async function runMigration() {
  const filePath = join(__dirname, '..', 'supabase', 'migrations', filename);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    console.log(`📄 Running: ${filename}\n`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✅ Success: ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

runMigration()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    pool.end();
    process.exit(1);
  });

