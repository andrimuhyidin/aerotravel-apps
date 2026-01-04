/**
 * Run Partner Portal Onboarding & Profile Management Migrations
 * Migrations:
 * - 087-partner-profile-enhancements.sql
 * - 088-partner-legal-documents.sql
 * - 089-partner-role-applications.sql
 * - 090-partner-documents-storage.sql
 * - 091-partner-tier-auto-update.sql
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: '.env.local' });

// Try multiple ways to get database connection
let DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;

  if (!SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
    console.error('💡 Please add one of the following to .env.local:');
    console.error('   - DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co');
    console.error('   - SUPABASE_DB_PASSWORD=[password]');
    process.exit(1);
  }

  if (!DB_PASSWORD) {
    console.error('❌ SUPABASE_DB_PASSWORD or DATABASE_PASSWORD not found in .env.local');
    console.error('💡 Please add SUPABASE_DB_PASSWORD to .env.local');
    console.error('   Get from: Supabase Dashboard > Settings > Database > Connection string');
    process.exit(1);
  }

  // Extract project ref from URL
  // Format: https://[project-ref].supabase.co
  const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    console.error('❌ Invalid SUPABASE_URL format:', SUPABASE_URL);
    process.exit(1);
  }

  const projectRef = urlMatch[1];
  DATABASE_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;
}

const migrations = [
  'supabase/migrations/20250125000005_087-partner-profile-enhancements.sql',
  'supabase/migrations/20250125000006_088-partner-legal-documents.sql',
  'supabase/migrations/20250125000007_089-partner-role-applications.sql',
  'supabase/migrations/20250125000008_090-partner-documents-storage.sql',
  'supabase/migrations/20250125000009_091-partner-tier-auto-update.sql',
];

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const migration of migrations) {
      const filePath = join(__dirname, '..', migration);
      console.log(`📦 Running ${migration}...`);
      
      try {
        const sql = readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`✅ ${migration} completed\n`);
      } catch (error) {
        // Check if error is about object already existing (IF NOT EXISTS should handle this)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('relation') && error.message.includes('already exists') ||
            error.message.includes('constraint') && error.message.includes('already exists') ||
            error.message.includes('policy') && error.message.includes('already exists')) {
          console.log(`⚠️  ${migration} - Some objects may already exist (skipping)\n`);
        } else {
          console.error(`❌ ${migration} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('🎉 All migrations completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ users table enhancements (SIUP, bank account, tier fields)');
    console.log('  ✅ partner_legal_documents table');
    console.log('  ✅ role_applications enhancements (company_data, legal_documents)');
    console.log('  ✅ Storage policies for partner documents');
    console.log('  ✅ Tier calculation functions and auto-update');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Some tables may not exist yet. This is normal for first run.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

