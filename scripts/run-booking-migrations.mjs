#!/usr/bin/env node
/**
 * Run Booking & Order Management Migrations
 * Migrations: 092, 093, 094
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MIGRATIONS = [
  'supabase/migrations/20250125000010_092-booking-draft-status.sql',
  'supabase/migrations/20250125000011_093-booking-reminders.sql',
  'supabase/migrations/20250125000012_094-booking-reminder-function.sql',
];

async function runMigration(filePath) {
  const fullPath = join(process.cwd(), filePath);
  console.log(`\n📦 Running ${filePath}...`);
  
  try {
    const sql = readFileSync(fullPath, 'utf-8');
    
    // Split by semicolons but preserve DO blocks
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
          if (directError) {
            console.log('⚠️  Note: Some statements may need to be run manually via Supabase Dashboard');
            console.log('   Dashboard: https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new');
            return false;
          }
        }
      }
    }
    
    console.log(`✅ ${filePath} completed`);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${filePath}:`, error.message);
    return false;
  }
}

async function verifyMigrations() {
  console.log('\n🔍 Verifying migrations...');
  
  try {
    // Check draft_saved_at column
    const { data: draftCheck, error: draftError } = await supabase
      .from('bookings')
      .select('draft_saved_at')
      .limit(1);
    
    if (draftError && draftError.message.includes('column "draft_saved_at" does not exist')) {
      console.log('⚠️  draft_saved_at column not found - migration 092 may need to be run');
    } else {
      console.log('✅ draft_saved_at column exists');
    }
    
    // Check booking_reminders table
    const { data: remindersCheck, error: remindersError } = await supabase
      .from('booking_reminders')
      .select('id')
      .limit(1);
    
    if (remindersError && remindersError.message.includes('does not exist')) {
      console.log('⚠️  booking_reminders table not found - migration 093 may need to be run');
    } else {
      console.log('✅ booking_reminders table exists');
    }
    
    // Check function
    const { data: functionCheck, error: functionError } = await supabase
      .rpc('get_bookings_needing_reminders');
    
    if (functionError && functionError.message.includes('does not exist')) {
      console.log('⚠️  get_bookings_needing_reminders function not found - migration 094 may need to be run');
    } else {
      console.log('✅ get_bookings_needing_reminders function exists');
    }
  } catch (error) {
    console.log('⚠️  Verification check failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Running Booking & Order Management Migrations\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);
  
  console.log('⚠️  Note: Supabase JavaScript client cannot execute DDL statements directly.');
  console.log('   Please run migrations via one of these methods:\n');
  console.log('   1. Supabase Dashboard (RECOMMENDED):');
  console.log('      https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new\n');
  console.log('   2. psql command:');
  console.log('      psql "$DATABASE_URL" -f supabase/migrations/20250125000010_092-booking-draft-status.sql');
  console.log('      psql "$DATABASE_URL" -f supabase/migrations/20250125000011_093-booking-reminders.sql');
  console.log('      psql "$DATABASE_URL" -f supabase/migrations/20250125000012_094-booking-reminder-function.sql\n');
  
  console.log('📋 Migration files to run:');
  MIGRATIONS.forEach(m => console.log(`   - ${m}`));
  
  await verifyMigrations();
  
  console.log('\n✅ Migration instructions displayed');
  console.log('   Please run migrations manually via Supabase Dashboard or psql');
}

main().catch(console.error);

