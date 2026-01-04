-- Migration: 132-crisis-communication-plans.sql
-- Description: Crisis Communication Plans for ISO 31030 Compliance
-- Created: 2025-03-03
-- Standards: ISO 31030 Travel Risk Management

-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE crisis_type AS ENUM ('weather', 'medical', 'security', 'accident', 'natural_disaster', 'equipment_failure', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE escalation_level AS ENUM ('level_1', 'level_2', 'level_3', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CRISIS COMMUNICATION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crisis_communication_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Plan Info
  plan_name VARCHAR(255) NOT NULL,
  plan_code VARCHAR(50),
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Crisis Type
  crisis_type crisis_type NOT NULL,
  
  -- Escalation Matrix (JSONB for flexibility)
  escalation_matrix JSONB DEFAULT '[]',
  -- Structure: [
  --   {
  --     "level": "level_1",
  --     "trigger": "Minor incident, no injuries",
  --     "contacts": [{"role": "Guide Lead", "action": "Assess situation"}],
  --     "response_time_minutes": 15
  --   },
  --   {
  --     "level": "level_2",
  --     "trigger": "Moderate incident, minor injuries",
  --     "contacts": [{"role": "Operations Manager", "action": "Coordinate response"}],
  --     "response_time_minutes": 30
  --   },
  --   ...
  -- ]
  
  -- Communication Templates
  communication_templates JSONB DEFAULT '{}',
  -- Structure: {
  --   "initial_alert": "Template for first alert...",
  --   "status_update": "Template for updates...",
  --   "resolution": "Template for resolution...",
  --   "family_notification": "Template for family..."
  -- }
  
  -- Response Procedures
  response_procedures TEXT[],
  
  -- Emergency Contacts specific to this plan
  emergency_contacts JSONB DEFAULT '[]',
  -- Structure: [
  --   {"name": "SAR", "phone": "+62xxx", "role": "Search and Rescue"},
  --   {"name": "Coast Guard", "phone": "+62xxx", "role": "Maritime Emergency"},
  --   ...
  -- ]
  
  -- Required Resources
  required_resources JSONB DEFAULT '[]',
  -- Structure: [
  --   {"type": "equipment", "items": ["First Aid Kit", "Radio"]},
  --   {"type": "personnel", "items": ["Medic", "Navigator"]}
  -- ]
  
  -- Training Requirements
  training_requirements TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  next_review_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================
-- CRISIS EVENTS TABLE
-- Track actual crisis events
-- ============================================
CREATE TABLE IF NOT EXISTS crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES crisis_communication_plans(id),
  
  -- Event Info
  event_code VARCHAR(50) UNIQUE,
  crisis_type crisis_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Location
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Severity & Status
  current_level escalation_level NOT NULL DEFAULT 'level_1',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'contained', 'resolved', 'closed'
  
  -- Timeline
  occurred_at TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Impact
  people_affected INTEGER DEFAULT 0,
  injuries_count INTEGER DEFAULT 0,
  fatalities_count INTEGER DEFAULT 0,
  
  -- Communications Log
  communications_log JSONB DEFAULT '[]',
  -- Structure: [
  --   {"timestamp": "...", "type": "internal", "recipient": "Ops Manager", "message": "...", "sent_by": "..."},
  --   ...
  -- ]
  
  -- Resolution
  resolution_summary TEXT,
  lessons_learned TEXT,
  follow_up_actions TEXT[],
  
  -- Reported By
  reported_by UUID NOT NULL REFERENCES users(id),
  incident_commander UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_event_status CHECK (status IN ('active', 'contained', 'resolved', 'closed'))
);

-- ============================================
-- CRISIS EVENT UPDATES TABLE
-- Track all updates during a crisis
-- ============================================
CREATE TABLE IF NOT EXISTS crisis_event_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES crisis_events(id) ON DELETE CASCADE,
  
  -- Update Info
  update_type VARCHAR(50) NOT NULL, -- 'status_change', 'escalation', 'de_escalation', 'communication', 'action', 'resolution'
  previous_level escalation_level,
  new_level escalation_level,
  
  -- Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  actions_taken TEXT[],
  
  -- Attachments
  attachment_urls TEXT[],
  
  -- Updated By
  updated_by UUID NOT NULL REFERENCES users(id),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_update_type CHECK (update_type IN ('status_change', 'escalation', 'de_escalation', 'communication', 'action', 'resolution'))
);

-- ============================================
-- CRISIS DRILL RECORDS TABLE
-- Track crisis drills and exercises
-- ============================================
CREATE TABLE IF NOT EXISTS crisis_drill_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  plan_id UUID REFERENCES crisis_communication_plans(id),
  
  -- Drill Info
  drill_name VARCHAR(255) NOT NULL,
  drill_type VARCHAR(50) NOT NULL, -- 'tabletop', 'functional', 'full_scale'
  scenario_description TEXT,
  
  -- Timing
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Participants
  participants JSONB DEFAULT '[]',
  -- Structure: [
  --   {"user_id": "...", "role": "Incident Commander", "performance_score": 85}
  -- ]
  
  -- Results
  objectives_met JSONB DEFAULT '[]',
  gaps_identified TEXT[],
  recommendations TEXT[],
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_drill_type CHECK (drill_type IN ('tabletop', 'functional', 'full_scale')),
  CONSTRAINT valid_drill_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_crisis_plans_branch_id ON crisis_communication_plans(branch_id);
CREATE INDEX IF NOT EXISTS idx_crisis_plans_crisis_type ON crisis_communication_plans(crisis_type);
CREATE INDEX IF NOT EXISTS idx_crisis_plans_active ON crisis_communication_plans(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_crisis_events_branch_id ON crisis_events(branch_id);
CREATE INDEX IF NOT EXISTS idx_crisis_events_trip_id ON crisis_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_crisis_events_status ON crisis_events(status);
CREATE INDEX IF NOT EXISTS idx_crisis_events_occurred_at ON crisis_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_events_current_level ON crisis_events(current_level);

CREATE INDEX IF NOT EXISTS idx_crisis_event_updates_event_id ON crisis_event_updates(event_id);
CREATE INDEX IF NOT EXISTS idx_crisis_event_updates_created_at ON crisis_event_updates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crisis_drill_records_branch_id ON crisis_drill_records(branch_id);
CREATE INDEX IF NOT EXISTS idx_crisis_drill_records_scheduled_at ON crisis_drill_records(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crisis_drill_records_status ON crisis_drill_records(status);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE crisis_communication_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_drill_records ENABLE ROW LEVEL SECURITY;

-- Crisis Plans: Admins manage, guides view active
CREATE POLICY "Anyone can view active crisis plans"
  ON crisis_communication_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage crisis plans"
  ON crisis_communication_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Crisis Events: Admins and involved guides
CREATE POLICY "Admins can manage crisis events"
  ON crisis_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Guides can view and report crisis events"
  ON crisis_events
  FOR SELECT
  USING (
    reported_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = crisis_events.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "Guides can create crisis events"
  ON crisis_events
  FOR INSERT
  WITH CHECK (reported_by = auth.uid());

-- Crisis Event Updates: Similar to events
CREATE POLICY "Admins can manage crisis updates"
  ON crisis_event_updates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Involved users can view updates"
  ON crisis_event_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crisis_events
      WHERE crisis_events.id = crisis_event_updates.event_id
        AND (
          crisis_events.reported_by = auth.uid()
          OR crisis_events.incident_commander = auth.uid()
        )
    )
  );

-- Crisis Drills: Admins manage
CREATE POLICY "Admins can manage crisis drills"
  ON crisis_drill_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Participants can view their drills"
  ON crisis_drill_records
  FOR SELECT
  USING (
    participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate event code
CREATE OR REPLACE FUNCTION generate_crisis_event_code()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix VARCHAR(4);
  sequence_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(event_code FROM 8) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM crisis_events
  WHERE event_code LIKE 'CRI-' || year_prefix || '-%';
  
  NEW.event_code := 'CRI-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_crisis_event_code
  BEFORE INSERT ON crisis_events
  FOR EACH ROW
  WHEN (NEW.event_code IS NULL)
  EXECUTE FUNCTION generate_crisis_event_code();

-- Function to calculate response time
CREATE OR REPLACE FUNCTION calculate_crisis_response_time(p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_occurred TIMESTAMPTZ;
  v_detected TIMESTAMPTZ;
  v_response_minutes INTEGER;
BEGIN
  SELECT occurred_at, detected_at
  INTO v_occurred, v_detected
  FROM crisis_events
  WHERE id = p_event_id;
  
  v_response_minutes := EXTRACT(EPOCH FROM (v_detected - v_occurred)) / 60;
  RETURN v_response_minutes;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT DEFAULT CRISIS PLANS
-- ============================================
INSERT INTO crisis_communication_plans (
  id,
  branch_id,
  plan_name,
  plan_code,
  crisis_type,
  escalation_matrix,
  communication_templates,
  response_procedures,
  emergency_contacts,
  is_active
)
SELECT 
  gen_random_uuid(),
  branches.id,
  'Rencana Tanggap Cuaca Buruk',
  'CCP-WEATHER',
  'weather'::crisis_type,
  '[
    {
      "level": "level_1",
      "trigger": "Peringatan cuaca dari BMKG",
      "contacts": [{"role": "Guide Lead", "action": "Monitor kondisi dan siapkan shelter"}],
      "response_time_minutes": 30
    },
    {
      "level": "level_2", 
      "trigger": "Cuaca memburuk, gelombang tinggi",
      "contacts": [{"role": "Operations Manager", "action": "Pertimbangkan kembali ke pelabuhan"}],
      "response_time_minutes": 15
    },
    {
      "level": "level_3",
      "trigger": "Badai aktif, kondisi berbahaya",
      "contacts": [{"role": "Branch Manager", "action": "Evakuasi ke area aman"}],
      "response_time_minutes": 5
    },
    {
      "level": "critical",
      "trigger": "Keadaan darurat, nyawa terancam",
      "contacts": [{"role": "CEO/Owner", "action": "Koordinasi SAR dan keluarga"}],
      "response_time_minutes": 1
    }
  ]'::JSONB,
  '{
    "initial_alert": "PERINGATAN CUACA: [kondisi] di lokasi [lokasi]. Tim sedang memonitor situasi.",
    "status_update": "UPDATE: [status]. Semua penumpang dalam kondisi [kondisi]. Tindakan: [tindakan].",
    "family_notification": "Yth. Keluarga [nama], kami informasikan bahwa trip saat ini mengalami [kondisi]. Seluruh penumpang aman. Kami akan update setiap [waktu] menit."
  }'::JSONB,
  ARRAY[
    'Monitor prakiraan cuaca BMKG secara berkala',
    'Siapkan life jacket untuk seluruh penumpang',
    'Identifikasi shelter terdekat atau pelabuhan darurat',
    'Aktifkan komunikasi dengan base camp',
    'Dokumentasikan semua kejadian dan keputusan'
  ],
  '[
    {"name": "BMKG", "phone": "021-65860089", "role": "Weather Advisory"},
    {"name": "SAR/BASARNAS", "phone": "115", "role": "Search and Rescue"},
    {"name": "Syahbandar", "phone": "021-xxxxxxx", "role": "Port Authority"}
  ]'::JSONB,
  true
FROM branches
WHERE branches.id = (SELECT id FROM branches LIMIT 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE crisis_communication_plans IS 'Crisis communication plans for ISO 31030 TRM compliance';
COMMENT ON TABLE crisis_events IS 'Actual crisis events with escalation and communication tracking';
COMMENT ON TABLE crisis_event_updates IS 'Real-time updates during crisis events';
COMMENT ON TABLE crisis_drill_records IS 'Records of crisis response drills and exercises';
COMMENT ON COLUMN crisis_events.communications_log IS 'Log of all communications sent during the crisis';
COMMENT ON COLUMN crisis_communication_plans.escalation_matrix IS 'Escalation levels with triggers, contacts, and response times';

