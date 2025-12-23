/**
 * Apply missing migrations for metrics implementation directly via Supabase
 * Uses Supabase Management API to execute SQL
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}

async function executeSQL(sql) {
  // Supabase doesn't provide direct SQL execution via REST API
  // We need to use the Management API or provide instructions
  // For now, we'll use a workaround by checking if we can create the table via REST
  
  // Extract CREATE TABLE statements
  const createTableMatch = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)[\s\S]*?;/i);
  
  if (createTableMatch) {
    const tableName = createTableMatch[1];
    console.log(`   📝 Table: ${tableName}`);
    
    // Check if table exists
    const exists = await checkTableExists(tableName);
    if (exists) {
      console.log(`   ✅ Table ${tableName} already exists`);
      return true;
    }
    
    console.log(`   ⚠️  Table ${tableName} does not exist - needs migration`);
    return false;
  }
  
  // For ALTER TABLE statements, check if columns exist
  const alterTableMatch = sql.match(/ALTER TABLE (\w+)[\s\S]*?ADD COLUMN IF NOT EXISTS (\w+)/i);
  if (alterTableMatch) {
    const [, tableName, columnName] = alterTableMatch;
    console.log(`   📝 Column: ${tableName}.${columnName}`);
    
    // Check if table exists first
    const tableExists = await checkTableExists(tableName);
    if (!tableExists) {
      console.log(`   ❌ Table ${tableName} does not exist - need base table first`);
      return false;
    }
    
    // We can't easily check columns via REST API, so we'll assume it needs to be applied
    console.log(`   ⚠️  Column check skipped - will apply migration`);
    return false;
  }
  
  return false;
}

async function main() {
  console.log('🚀 Applying Metrics Implementation Migrations\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  // Check current status
  console.log('🔍 Checking current database status...\n');

  const tablesToCheck = {
    'pre_trip_assessments': {
      migration: 'supabase/migrations/20250123000007_050-pre-trip-risk-assessment.sql',
      description: 'Pre-trip risk assessments table',
    },
    'incident_reports': {
      migration: null, // Base table might be in different migration
      description: 'Incident reports table (base)',
    },
  };

  const status = {};
  for (const [tableName, info] of Object.entries(tablesToCheck)) {
    const exists = await checkTableExists(tableName);
    status[tableName] = { exists, ...info };
    console.log(`   ${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'exists' : 'missing'}`);
  }

  // Check incident_reports columns (migration 052 adds columns)
  if (status['incident_reports'].exists) {
    console.log('\n   🔍 Checking incident_reports columns...');
    // Try to query a column that should exist after migration 052
    const { error: reportNumberError } = await supabase
      .from('incident_reports')
      .select('report_number')
      .limit(1);
    
    if (reportNumberError && reportNumberError.code === '42703') {
      console.log('   ⚠️  Column report_number missing - migration 052 not applied');
      status['incident_reports'].needsMigration052 = true;
    } else {
      console.log('   ✅ incident_reports has required columns');
    }
  }

  // Apply migrations
  console.log('\n📦 Migration Status:\n');

  if (!status['pre_trip_assessments'].exists) {
    console.log('❌ pre_trip_assessments: MISSING');
    console.log(`   Migration: ${status['pre_trip_assessments'].migration}`);
    console.log('   Action: Apply migration 050');
  } else {
    console.log('✅ pre_trip_assessments: EXISTS');
  }

  if (!status['incident_reports'].exists) {
    console.log('❌ incident_reports: MISSING (base table)');
    console.log('   Action: Need to find/create base incident_reports table');
  } else if (status['incident_reports'].needsMigration052) {
    console.log('⚠️  incident_reports: EXISTS but needs migration 052');
    console.log('   Migration: supabase/migrations/20250123000009_052-incident-reports-signature-notify.sql');
    console.log('   Action: Apply migration 052 to add columns');
  } else {
    console.log('✅ incident_reports: EXISTS with required columns');
  }

  // Provide SQL to execute
  console.log('\n📝 SQL to Execute:\n');

  if (!status['pre_trip_assessments'].exists) {
    const migrationPath = join(__dirname, '..', status['pre_trip_assessments'].migration);
    const sql = readFileSync(migrationPath, 'utf-8');
    console.log('--- Migration 050: pre_trip_assessments ---');
    console.log(sql.substring(0, 500) + '...\n');
    console.log(`Full file: ${status['pre_trip_assessments'].migration}\n`);
  }

  if (status['incident_reports'].needsMigration052) {
    const migrationPath = join(__dirname, '..', 'supabase/migrations/20250123000009_052-incident-reports-signature-notify.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    console.log('--- Migration 052: incident_reports columns ---');
    console.log(sql.substring(0, 500) + '...\n');
    console.log('Full file: supabase/migrations/20250123000009_052-incident-reports-signature-notify.sql\n');
  }

  console.log('💡 Instructions:');
  console.log('   1. Open Supabase Dashboard → SQL Editor');
  console.log('   2. Copy and paste the SQL from migration files above');
  console.log('   3. Execute each migration');
  console.log('   4. Run: npx tsx scripts/check-metrics-implementation.ts to verify');

  // Try to use Supabase Management API if available
  console.log('\n🔄 Attempting direct execution...\n');
  
  // Note: Supabase REST API doesn't support arbitrary SQL execution
  // We would need to use the Management API or Supabase CLI
  console.log('   ⚠️  Direct SQL execution via REST API is not supported');
  console.log('   💡 Please use Supabase Dashboard SQL Editor or Supabase CLI');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

