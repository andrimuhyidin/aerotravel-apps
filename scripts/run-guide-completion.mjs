import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { execSync } from 'child_process';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || '#AeroTVL2025';

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found');
  process.exit(1);
}

const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
  console.error('❌ Invalid SUPABASE_URL format');
  process.exit(1);
}

const projectRef = urlMatch[1];
const DATABASE_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;

async function run() {
  console.log('🚀 Starting Guide App Database Completion...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Run Migration
    console.log('📦 Applying Schema Migration...');
    await client.connect();
    
    const migrationPath = join(__dirname, 'migrations', '017-complete-guide-schema.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    // Split by statement to handle potential large files better, 
    // although client.query can handle multiple statements usually.
    // For DDL it's safer to run as one block or split carefully.
    // We'll run as one block since it's mostly CREATE TABLE IF NOT EXISTS
    await client.query(sql);
    console.log('✅ Schema migration applied successfully\n');
    
    await client.end();

    // 2. Run Seeder
    console.log('🌱 Running Data Seeder...');
    execSync('node scripts/seed-complete-guide-data.mjs', { stdio: 'inherit', cwd: join(__dirname, '..') });
    console.log('\n✅ Data seeding completed\n');

    console.log('🎉 Guide Module Database & Data is now COMPLETE!');
    console.log('   You can now test the Wallet, Rewards, and Certifications features.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();

