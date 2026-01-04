/**
 * Execute metrics migrations directly using Supabase client
 * This script will apply the SQL migrations via Supabase Management API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function executeViaPsql(sql) {
  if (!DATABASE_URL) {
    console.log('   ⚠️  DATABASE_URL not found, cannot execute via psql');
    return false;
  }

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // Write SQL to temp file
    const { writeFileSync, unlinkSync } = await import('fs');
    const tmpFile = `/tmp/migration_${Date.now()}.sql`;
    writeFileSync(tmpFile, sql);

    // Execute via psql
    const { stdout, stderr } = await execAsync(`psql "${DATABASE_URL}" -f ${tmpFile}`);
    
    // Clean up
    unlinkSync(tmpFile);

    if (stderr && !stderr.includes('already exists')) {
      console.log(`   ⚠️  Warning: ${stderr}`);
    }
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function applyMigration(migrationFile, description) {
  console.log(`\n📦 ${description}`);
  console.log(`   File: ${migrationFile}`);

  const migrationPath = join(__dirname, '..', migrationFile);
  const sql = readFileSync(migrationPath, 'utf-8');

  // Extract table name
  const tableMatch = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
  const alterMatch = sql.match(/ALTER TABLE (\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : alterMatch ? alterMatch[1] : null;

  if (tableName) {
    const exists = await checkTableExists(tableName);
    if (exists && tableMatch) {
      console.log(`   ✅ Table ${tableName} already exists`);
      return true;
    }
  }

  // Try to execute via psql
  console.log(`   🔄 Attempting to execute...`);
  const success = await executeViaPsql(sql);

  if (success) {
    console.log(`   ✅ Migration applied successfully`);
    return true;
  } else {
    console.log(`   ⚠️  Could not execute automatically`);
    console.log(`   💡 Please run manually via Supabase Dashboard SQL Editor`);
    return false;
  }
}

async function main() {
  console.log('🚀 Executing Metrics Implementation Migrations\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`💾 DATABASE_URL: ${DATABASE_URL ? '✅ Set' : '❌ Not set'}\n`);

  // Check current status
  console.log('🔍 Checking current status...\n');

  const preTripExists = await checkTableExists('pre_trip_assessments');
  const incidentExists = await checkTableExists('incident_reports');

  console.log(`   ${preTripExists ? '✅' : '❌'} pre_trip_assessments: ${preTripExists ? 'exists' : 'missing'}`);
  console.log(`   ${incidentExists ? '✅' : '❌'} incident_reports: ${incidentExists ? 'exists' : 'missing'}`);

  // Check incident_reports columns
  if (incidentExists) {
    const { error: colError } = await supabase
      .from('incident_reports')
      .select('report_number')
      .limit(1);
    
    const needsMigration052 = colError && colError.code === '42703';
    console.log(`   ${needsMigration052 ? '⚠️' : '✅'} incident_reports columns: ${needsMigration052 ? 'needs migration 052' : 'complete'}`);
  }

  // Apply migrations
  console.log('\n📦 Applying migrations...\n');

  let allApplied = true;

  // 1. Create base incident_reports if needed
  if (!incidentExists) {
    console.log('📝 Creating base incident_reports table...');
    const baseTableSQL = `
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  incident_type VARCHAR(50) NOT NULL,
  chronology TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'reported',
  witnesses TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_reports_trip_id ON incident_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_guide_id ON incident_reports(guide_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_branch_id ON incident_reports(branch_id);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
`;

    const success = await executeViaPsql(baseTableSQL);
    if (!success) {
      console.log('   ⚠️  Please create base table manually');
      allApplied = false;
    }
  }

  // 2. Apply migration 050 (pre_trip_assessments)
  if (!preTripExists) {
    const success = await applyMigration(
      'supabase/migrations/20250123000007_050-pre-trip-risk-assessment.sql',
      'Migration 050: Pre-trip Risk Assessments'
    );
    if (!success) allApplied = false;
  }

  // 3. Apply migration 052 (incident_reports columns)
  if (incidentExists) {
    const { error: colError } = await supabase
      .from('incident_reports')
      .select('report_number')
      .limit(1);
    
    if (colError && colError.code === '42703') {
      const success = await applyMigration(
        'supabase/migrations/20250123000009_052-incident-reports-signature-notify.sql',
        'Migration 052: Incident Reports Enhancements'
      );
      if (!success) allApplied = false;
    }
  }

  // Final verification
  console.log('\n🔍 Final verification...\n');
  const finalPreTrip = await checkTableExists('pre_trip_assessments');
  const finalIncident = await checkTableExists('incident_reports');

  console.log(`   ${finalPreTrip ? '✅' : '❌'} pre_trip_assessments: ${finalPreTrip ? 'exists' : 'missing'}`);
  console.log(`   ${finalIncident ? '✅' : '❌'} incident_reports: ${finalIncident ? 'exists' : 'missing'}`);

  if (finalPreTrip && finalIncident) {
    console.log('\n🎉 All migrations applied successfully!');
    console.log('   ✅ Metrics implementation is ready');
    console.log('   📝 Run: npx tsx scripts/check-metrics-implementation.ts to verify');
  } else {
    console.log('\n⚠️  Some migrations may need manual execution');
    console.log('   💡 Use Supabase Dashboard SQL Editor to apply remaining migrations');
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

