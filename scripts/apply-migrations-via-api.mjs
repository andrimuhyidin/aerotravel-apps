/**
 * Apply migrations directly via Supabase Management API
 * Uses Supabase REST API to execute SQL
 */

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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Base incident_reports table SQL
const CREATE_INCIDENT_REPORTS_BASE = `
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

CREATE POLICY IF NOT EXISTS "Guides can view own incidents"
  ON incident_reports FOR SELECT
  USING (auth.uid() = guide_id);

CREATE POLICY IF NOT EXISTS "Guides can create incidents"
  ON incident_reports FOR INSERT
  WITH CHECK (auth.uid() = guide_id);
`;

async function executeSQLViaManagementAPI(sql) {
  // Supabase Management API endpoint for SQL execution
  // Note: This requires Management API access which may not be available
  // We'll use a workaround via PostgREST or direct psql

  if (DATABASE_URL) {
    // Use psql if available
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Execute SQL directly via psql
      const { stdout, stderr } = await execAsync(
        `psql "${DATABASE_URL}" -c "${sql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );

      if (stderr && !stderr.includes('already exists') && !stderr.includes('NOTICE')) {
        console.log(`   ⚠️  Warning: ${stderr.substring(0, 200)}`);
      }
      return true;
    } catch (error) {
      // Try executing file instead
      const { writeFileSync, unlinkSync } = await import('fs');
      const tmpFile = `/tmp/migration_${Date.now()}.sql`;
      writeFileSync(tmpFile, sql);

      try {
        const { stdout, stderr } = await execAsync(`psql "${DATABASE_URL}" -f ${tmpFile}`, {
          maxBuffer: 10 * 1024 * 1024,
        });
        unlinkSync(tmpFile);

        if (stderr && !stderr.includes('already exists') && !stderr.includes('NOTICE')) {
          console.log(`   ⚠️  Warning: ${stderr.substring(0, 200)}`);
        }
        return true;
      } catch (fileError) {
        unlinkSync(tmpFile);
        console.log(`   ❌ Error: ${fileError.message.substring(0, 200)}`);
        return false;
      }
    }
  }

  return false;
}

async function main() {
  console.log('🚀 Applying Metrics Migrations via Direct SQL Execution\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`💾 DATABASE_URL: ${DATABASE_URL ? '✅ Set' : '❌ Not set'}\n`);

  if (!DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in .env.local');
    console.log('   Cannot execute migrations directly');
    console.log('   💡 Please run migrations via Supabase Dashboard SQL Editor');
    return;
  }

  // 1. Create base incident_reports table
  console.log('📦 Step 1: Creating base incident_reports table...');
  const success1 = await executeSQLViaManagementAPI(CREATE_INCIDENT_REPORTS_BASE);
  if (success1) {
    console.log('   ✅ Base incident_reports table created');
  } else {
    console.log('   ⚠️  May already exist or need manual execution');
  }

  // 2. Apply migration 052 (add columns to incident_reports)
  console.log('\n📦 Step 2: Applying migration 052 (incident_reports columns)...');
  const migration052Path = join(__dirname, '..', 'supabase/migrations/20250123000009_052-incident-reports-signature-notify.sql');
  const migration052SQL = readFileSync(migration052Path, 'utf-8');
  const success2 = await executeSQLViaManagementAPI(migration052SQL);
  if (success2) {
    console.log('   ✅ Migration 052 applied');
  } else {
    console.log('   ⚠️  May need manual execution');
  }

  // 3. Apply migration 050 (pre_trip_assessments)
  console.log('\n📦 Step 3: Applying migration 050 (pre_trip_assessments)...');
  const migration050Path = join(__dirname, '..', 'supabase/migrations/20250123000007_050-pre-trip-risk-assessment.sql');
  const migration050SQL = readFileSync(migration050Path, 'utf-8');
  const success3 = await executeSQLViaManagementAPI(migration050SQL);
  if (success3) {
    console.log('   ✅ Migration 050 applied');
  } else {
    console.log('   ⚠️  May need manual execution');
  }

  // Verify
  console.log('\n🔍 Verifying...\n');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const preTripExists = !(await supabase.from('pre_trip_assessments').select('id').limit(1)).error;
  const incidentExists = !(await supabase.from('incident_reports').select('id').limit(1)).error;

  console.log(`   ${preTripExists ? '✅' : '❌'} pre_trip_assessments: ${preTripExists ? 'exists' : 'missing'}`);
  console.log(`   ${incidentExists ? '✅' : '❌'} incident_reports: ${incidentExists ? 'exists' : 'missing'}`);

  if (preTripExists && incidentExists) {
    // Check columns
    const { error: colError } = await supabase
      .from('incident_reports')
      .select('report_number')
      .limit(1);

    if (!colError) {
      console.log('   ✅ incident_reports has required columns');
      console.log('\n🎉 All migrations applied successfully!');
      console.log('   ✅ Metrics implementation is ready');
    } else {
      console.log('   ⚠️  incident_reports missing some columns (migration 052)');
    }
  } else {
    console.log('\n⚠️  Some tables still missing');
    console.log('   💡 Please check errors above and run manually if needed');
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

