-- Migration: 025-guide-emergency-medical.sql
-- Description: Emergency contacts & medical info for guides
-- Created: 2025-12-19

BEGIN;

-- ============================================
-- GUIDE EMERGENCY CONTACTS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contact Info
  name VARCHAR(200) NOT NULL,
  relationship VARCHAR(50), -- 'spouse', 'parent', 'sibling', 'friend', 'other'
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(200),
  
  -- Priority (1 = highest, for auto-notify on SOS)
  priority INTEGER DEFAULT 1,
  auto_notify BOOLEAN DEFAULT true, -- Auto-share location on SOS
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, phone)
);

-- ============================================
-- GUIDE MEDICAL INFO
-- ============================================
CREATE TABLE IF NOT EXISTS guide_medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Blood Type
  blood_type VARCHAR(5), -- 'A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'
  
  -- Allergies
  allergies TEXT[], -- Array of allergies
  
  -- Medical Conditions
  medical_conditions TEXT[], -- Array of conditions
  
  -- Medications
  current_medications TEXT[], -- Array of medications
  
  -- Emergency Medical Notes
  emergency_notes TEXT, -- Additional info for emergency responders
  
  -- Insurance
  insurance_provider VARCHAR(200),
  insurance_policy_number VARCHAR(100),
  
  -- Last Updated
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_emergency_contacts_guide_id ON guide_emergency_contacts(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_emergency_contacts_auto_notify ON guide_emergency_contacts(guide_id, auto_notify) WHERE auto_notify = true;
CREATE INDEX IF NOT EXISTS idx_guide_medical_info_guide_id ON guide_medical_info(guide_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_medical_info ENABLE ROW LEVEL SECURITY;

-- Guide can manage own emergency contacts
CREATE POLICY "guide_emergency_contacts_own" ON guide_emergency_contacts
  FOR ALL
  USING (guide_id = auth.uid());

-- Guide can manage own medical info
CREATE POLICY "guide_medical_info_own" ON guide_medical_info
  FOR ALL
  USING (guide_id = auth.uid());

-- Ops/Admin can view (for emergency response)
CREATE POLICY "guide_emergency_contacts_staff" ON guide_emergency_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "guide_medical_info_staff" ON guide_medical_info
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

COMMIT;

