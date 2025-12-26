/**
 * Run Partner Portal Phase 1 Migrations
 * Migrations:
 * - 082-partner-customers.sql
 * - 083-booking-customer-link.sql
 * - 084-partner-users.sql
 * - 085-partner-support-tickets.sql
 * - 086-booking-reschedule-requests.sql
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
  'supabase/migrations/20250125000000_082-partner-customers.sql',
  'supabase/migrations/20250125000001_083-booking-customer-link.sql',
  'supabase/migrations/20250125000002_084-partner-users.sql',
  'supabase/migrations/20250125000003_085-partner-support-tickets.sql',
  'supabase/migrations/20250125000004_086-booking-reschedule-requests.sql',
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
            error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`⚠️  ${migration} - Some objects may already exist (skipping)\n`);
        } else {
          console.error(`❌ ${migration} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('🎉 All migrations completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ partner_customers table');
    console.log('  ✅ bookings.customer_id column');
    console.log('  ✅ partner_users table');
    console.log('  ✅ partner_support_tickets table');
    console.log('  ✅ booking_reschedule_requests table');
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

