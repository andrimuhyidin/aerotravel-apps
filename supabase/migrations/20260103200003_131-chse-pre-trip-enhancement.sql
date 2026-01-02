-- Migration: 131-chse-pre-trip-enhancement.sql
-- Description: Add CHSE-specific items to pre-trip assessments
-- Created: 2025-03-03
-- Standards: CHSE Protocol (Kemenkes)

-- ============================================
-- ENHANCE PRE-TRIP ASSESSMENTS TABLE
-- ============================================
-- Add CHSE-specific columns
ALTER TABLE pre_trip_assessments
ADD COLUMN IF NOT EXISTS hygiene_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sanitization_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS health_protocol_followed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chse_checklist JSONB DEFAULT '{}';

-- Add CHSE verification timestamp
ALTER TABLE pre_trip_assessments
ADD COLUMN IF NOT EXISTS chse_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS chse_verified_by UUID REFERENCES users(id);

-- ============================================
-- CHSE CHECKLIST TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chse_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Template Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Checklist Categories
  checklist_items JSONB NOT NULL DEFAULT '[]',
  -- Structure: [
  --   {
  --     "category": "clean",
  --     "items": [
  --       {"id": "c1", "text": "Deck sudah dibersihkan", "required": true},
  --       ...
  --     ]
  --   },
  --   {
  --     "category": "health",
  --     "items": [...]
  --   },
  --   ...
  -- ]
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================
-- CHSE DAILY LOGS TABLE
-- Track daily CHSE compliance
-- ============================================
CREATE TABLE IF NOT EXISTS chse_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Log Date
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Clean (C)
  clean_score INTEGER DEFAULT 0 CHECK (clean_score >= 0 AND clean_score <= 100),
  clean_items JSONB DEFAULT '{}',
  clean_notes TEXT,
  clean_photos TEXT[] DEFAULT '{}',
  
  -- Health (H)
  health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
  health_items JSONB DEFAULT '{}',
  health_notes TEXT,
  temperature_logs JSONB DEFAULT '[]', -- [{passenger: "name", temp: 36.5, time: "08:00"}]
  
  -- Safety (S)
  safety_score INTEGER DEFAULT 0 CHECK (safety_score >= 0 AND safety_score <= 100),
  safety_items JSONB DEFAULT '{}',
  safety_notes TEXT,
  
  -- Environment (E)
  environment_score INTEGER DEFAULT 0 CHECK (environment_score >= 0 AND environment_score <= 100),
  environment_items JSONB DEFAULT '{}',
  environment_notes TEXT,
  
  -- Overall Score
  overall_score INTEGER GENERATED ALWAYS AS (
    (clean_score + health_score + safety_score + environment_score) / 4
  ) STORED,
  
  -- Logged By
  logged_by UUID NOT NULL REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint per trip per day
  UNIQUE(trip_id, log_date)
);

-- ============================================
-- SANITIZATION RECORDS TABLE
-- Track sanitization activities
-- ============================================
CREATE TABLE IF NOT EXISTS sanitization_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Sanitization Details
  sanitization_type VARCHAR(50) NOT NULL, -- 'pre_trip', 'post_trip', 'emergency', 'routine'
  areas_sanitized TEXT[],
  products_used TEXT[],
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Documentation
  photo_before TEXT,
  photo_after TEXT,
  
  -- Performer
  performed_by UUID NOT NULL REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'verified'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_sanitization_type CHECK (sanitization_type IN ('pre_trip', 'post_trip', 'emergency', 'routine')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'verified'))
);

-- ============================================
-- CHSE CERTIFICATES TABLE
-- Track CHSE certifications
-- ============================================
CREATE TABLE IF NOT EXISTS chse_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Certificate Info
  certificate_number VARCHAR(100) UNIQUE,
  certificate_type VARCHAR(50) NOT NULL, -- 'chse', 'iso', 'halal', 'other'
  issuing_authority VARCHAR(255),
  
  -- Dates
  issued_date DATE NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  
  -- Documentation
  certificate_url TEXT,
  supporting_documents TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked', 'pending_renewal'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_certificate_type CHECK (certificate_type IN ('chse', 'iso', 'halal', 'other')),
  CONSTRAINT valid_cert_status CHECK (status IN ('active', 'expired', 'revoked', 'pending_renewal'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chse_checklist_templates_branch_id ON chse_checklist_templates(branch_id);
CREATE INDEX IF NOT EXISTS idx_chse_checklist_templates_active ON chse_checklist_templates(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_chse_daily_logs_branch_id ON chse_daily_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_chse_daily_logs_trip_id ON chse_daily_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_chse_daily_logs_log_date ON chse_daily_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_chse_daily_logs_overall_score ON chse_daily_logs(overall_score);

CREATE INDEX IF NOT EXISTS idx_sanitization_records_branch_id ON sanitization_records(branch_id);
CREATE INDEX IF NOT EXISTS idx_sanitization_records_trip_id ON sanitization_records(trip_id);
CREATE INDEX IF NOT EXISTS idx_sanitization_records_status ON sanitization_records(status);
CREATE INDEX IF NOT EXISTS idx_sanitization_records_performed_by ON sanitization_records(performed_by);

CREATE INDEX IF NOT EXISTS idx_chse_certificates_branch_id ON chse_certificates(branch_id);
CREATE INDEX IF NOT EXISTS idx_chse_certificates_valid_until ON chse_certificates(valid_until);
CREATE INDEX IF NOT EXISTS idx_chse_certificates_status ON chse_certificates(status);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE chse_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chse_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanitization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chse_certificates ENABLE ROW LEVEL SECURITY;

-- CHSE Checklist Templates: Admins manage, all view
CREATE POLICY "Anyone can view active CHSE templates"
  ON chse_checklist_templates
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage CHSE templates"
  ON chse_checklist_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- CHSE Daily Logs: Guides can create for their trips
CREATE POLICY "Guides can view own trip CHSE logs"
  ON chse_daily_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = chse_daily_logs.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "Guides can create CHSE logs for their trips"
  ON chse_daily_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = chse_daily_logs.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
    AND logged_by = auth.uid()
  );

CREATE POLICY "Admins can view all CHSE logs"
  ON chse_daily_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Sanitization Records: Similar to CHSE logs
CREATE POLICY "Guides can view own trip sanitization records"
  ON sanitization_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = sanitization_records.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "Guides can create sanitization records for their trips"
  ON sanitization_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = sanitization_records.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
    AND performed_by = auth.uid()
  );

CREATE POLICY "Admins can manage all sanitization records"
  ON sanitization_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- CHSE Certificates: Admins only
CREATE POLICY "Admins can manage CHSE certificates"
  ON chse_certificates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Anyone can view active CHSE certificates"
  ON chse_certificates
  FOR SELECT
  USING (status = 'active');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate CHSE compliance score
CREATE OR REPLACE FUNCTION calculate_chse_score(p_trip_id UUID)
RETURNS TABLE (
  clean_avg DECIMAL,
  health_avg DECIMAL,
  safety_avg DECIMAL,
  environment_avg DECIMAL,
  overall_avg DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(clean_score)::DECIMAL, 1) as clean_avg,
    ROUND(AVG(health_score)::DECIMAL, 1) as health_avg,
    ROUND(AVG(safety_score)::DECIMAL, 1) as safety_avg,
    ROUND(AVG(environment_score)::DECIMAL, 1) as environment_avg,
    ROUND(AVG(overall_score)::DECIMAL, 1) as overall_avg
  FROM chse_daily_logs
  WHERE trip_id = p_trip_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check certificate expiry
CREATE OR REPLACE FUNCTION check_certificate_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valid_until < CURRENT_DATE AND NEW.status = 'active' THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_certificate_expiry
  BEFORE UPDATE ON chse_certificates
  FOR EACH ROW
  EXECUTE FUNCTION check_certificate_expiry();

-- ============================================
-- INSERT DEFAULT CHSE TEMPLATE
-- ============================================
INSERT INTO chse_checklist_templates (
  id, 
  branch_id,
  name, 
  description, 
  version, 
  checklist_items, 
  is_active, 
  is_default
) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  branches.id,
  'Template CHSE Standar',
  'Template standar untuk protokol CHSE sesuai Kemenkes',
  '1.0',
  '[
    {
      "category": "clean",
      "label": "Kebersihan (Clean)",
      "items": [
        {"id": "c1", "text": "Deck dan area penumpang sudah dibersihkan", "required": true},
        {"id": "c2", "text": "Toilet dan wastafel bersih dan berfungsi", "required": true},
        {"id": "c3", "text": "Tempat sampah tersedia dan tertutup", "required": true},
        {"id": "c4", "text": "Dapur/pantry dalam kondisi bersih", "required": false}
      ]
    },
    {
      "category": "health",
      "label": "Kesehatan (Health)",
      "items": [
        {"id": "h1", "text": "Hand sanitizer tersedia di area umum", "required": true},
        {"id": "h2", "text": "P3K lengkap dan tidak kadaluarsa", "required": true},
        {"id": "h3", "text": "Suhu kru dicek sebelum keberangkatan", "required": false},
        {"id": "h4", "text": "Masker cadangan tersedia", "required": false}
      ]
    },
    {
      "category": "safety",
      "label": "Keselamatan (Safety)",
      "items": [
        {"id": "s1", "text": "Life jacket tersedia dan dalam kondisi baik", "required": true},
        {"id": "s2", "text": "Alat pemadam api tersedia", "required": true},
        {"id": "s3", "text": "Pelampung penolong tersedia", "required": true},
        {"id": "s4", "text": "Jalur evakuasi tidak terhalang", "required": true},
        {"id": "s5", "text": "Komunikasi darurat berfungsi", "required": true}
      ]
    },
    {
      "category": "environment",
      "label": "Lingkungan (Environment)",
      "items": [
        {"id": "e1", "text": "Pemilahan sampah tersedia", "required": true},
        {"id": "e2", "text": "Tidak membuang sampah ke laut", "required": true},
        {"id": "e3", "text": "Penggunaan bahan ramah lingkungan", "required": false},
        {"id": "e4", "text": "Efisiensi penggunaan BBM", "required": false}
      ]
    }
  ]'::JSONB,
  true,
  true
FROM branches
WHERE branches.id = (SELECT id FROM branches LIMIT 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE chse_checklist_templates IS 'Templates for CHSE compliance checklists (Kemenkes protocol)';
COMMENT ON TABLE chse_daily_logs IS 'Daily CHSE compliance logs with scores per category';
COMMENT ON TABLE sanitization_records IS 'Records of sanitization activities for CHSE compliance';
COMMENT ON TABLE chse_certificates IS 'CHSE and related certifications for the branch';
COMMENT ON COLUMN chse_daily_logs.overall_score IS 'Auto-calculated average of all CHSE category scores';

