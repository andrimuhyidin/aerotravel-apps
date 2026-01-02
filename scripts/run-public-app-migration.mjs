#!/usr/bin/env node
/**
 * Run Public App Performance Migration
 * Executes the public app indexes migration
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
const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.SUPABASE_DB_URL ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? `postgresql://postgres.${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1]?.split('.')[0]}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1]?.split('.')[0]}.pooler.supabase.com:6543/postgres`
    : null);

if (!databaseUrl) {
  console.error('❌ DATABASE_URL, SUPABASE_DB_URL, or Supabase credentials not found in .env.local');
  console.error('Required: DATABASE_URL or (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

// Parse connection string
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase') || databaseUrl.includes('pooler') 
    ? { rejectUnauthorized: false } 
    : false,
});

async function runMigration() {
  const filePath = join(__dirname, '..', 'scripts', 'migrations', '20260102000010_public_app_indexes.sql');
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    console.log('\n📄 Running: 20260102000010_public_app_indexes.sql');
    console.log(`SQL length: ${sql.length} chars\n`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split SQL by semicolon but handle CREATE INDEX IF NOT EXISTS properly
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt || stmt.startsWith('--')) continue;
        
        try {
          await client.query(stmt + ';');
          console.log(`  ✅ Statement ${i + 1}/${statements.length}`);
        } catch (error) {
          // Ignore "already exists" errors for indexes
          if (error.code === '42P07' || error.message.includes('already exists')) {
            console.log(`  ⏭️  Statement ${i + 1}/${statements.length} - Already exists (skipping)`);
          } else {
            throw error;
          }
        }
      }
      
      await client.query('COMMIT');
      console.log(`\n✅ Success: Migration completed`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error in migration:`, error.message);
    if (error.code === '42P07' || error.message.includes('already exists')) {
      console.log(`⚠️  Warning: Some objects may already exist`);
      return true;
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Public App Performance Migration...\n');
  console.log(`📊 Database: ${databaseUrl.split('@')[1]?.split('/')[1] || 'connected'}\n`);

  try {
    const success = await runMigration();
    if (success) {
      console.log('\n' + '='.repeat(50));
      console.log('✅ Migration completed successfully!');
      console.log('='.repeat(50) + '\n');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);

