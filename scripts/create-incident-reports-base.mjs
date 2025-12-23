/**
 * Create base incident_reports table if it doesn't exist
 * This is needed before migration 052 can add columns
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CREATE_INCIDENT_REPORTS_TABLE = `
-- Base incident_reports table
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Incident Details
  incident_type VARCHAR(50) NOT NULL, -- 'medical', 'accident', 'weather', 'security', 'other'
  chronology TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'reported', -- 'reported', 'investigating', 'resolved', 'closed'
  
  -- Witnesses & People Involved
  witnesses TEXT,
  
  -- Media
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Reporting
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  reported_by UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incident_reports_trip_id ON incident_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_guide_id ON incident_reports(guide_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_branch_id ON incident_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_incident_type ON incident_reports(incident_type);

-- RLS
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Guides can view their own incidents
CREATE POLICY IF NOT EXISTS "Guides can view own incidents"
  ON incident_reports
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can create incidents for their trips
CREATE POLICY IF NOT EXISTS "Guides can create incidents"
  ON incident_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() = guide_id
    AND EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = incident_reports.trip_id
      AND (
        EXISTS (
          SELECT 1 FROM trip_guides
          WHERE trip_guides.trip_id = trips.id
          AND trip_guides.guide_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM trip_crews
          WHERE trip_crews.trip_id = trips.id
          AND trip_crews.guide_id = auth.uid()
        )
      )
    )
  );

-- Admins can view all incidents in their branch
CREATE POLICY IF NOT EXISTS "Admins can view branch incidents"
  ON incident_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = incident_reports.branch_id
      )
    )
  );
`;

async function main() {
  console.log('🚀 Creating base incident_reports table\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  // Check if table exists
  const { error: checkError } = await supabase
    .from('incident_reports')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('✅ incident_reports table already exists!');
    console.log('   No action needed.\n');
    return;
  }

  if (checkError.code === '42P01') {
    console.log('❌ incident_reports table does not exist');
    console.log('📝 Creating base table...\n');
    console.log('💡 SQL to execute:\n');
    console.log(CREATE_INCIDENT_REPORTS_TABLE);
    console.log('\n⚠️  Please execute this SQL via Supabase Dashboard SQL Editor');
    console.log('   Or use Supabase CLI: supabase db push');
  } else {
    console.log(`⚠️  Error checking table: ${checkError.message}`);
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

