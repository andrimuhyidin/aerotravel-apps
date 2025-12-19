-- Migration: 036-guide-feedback-id-card-license.sql
-- Description: Guide Feedback System, ID Card, and License Application
-- Date: 2025-01-20

BEGIN;

-- ============================================
-- GUIDE FEEDBACK SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS guide_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Feedback Type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'general',
    'app_improvement',
    'work_environment',
    'compensation',
    'training',
    'safety',
    'suggestion'
  )),
  
  -- Rating (Optional - for NPS/CSAT)
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Privacy
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Status & Follow-up
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'reviewed',
    'in_progress',
    'resolved',
    'closed'
  )),
  
  -- Admin Response
  admin_response TEXT,
  admin_id UUID REFERENCES users(id),
  responded_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_feedbacks_guide_id ON guide_feedbacks(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_feedbacks_branch_id ON guide_feedbacks(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_feedbacks_status ON guide_feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_guide_feedbacks_feedback_type ON guide_feedbacks(feedback_type);
CREATE INDEX IF NOT EXISTS idx_guide_feedbacks_created_at ON guide_feedbacks(created_at DESC);

-- Feedback Attachments
CREATE TABLE IF NOT EXISTS guide_feedback_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES guide_feedbacks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_attachments_feedback_id ON guide_feedback_attachments(feedback_id);

-- ============================================
-- GUIDE ID CARD SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS guide_id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Card Info
  card_number TEXT NOT NULL UNIQUE, -- Format: ATGL-YYYYMMDD-XXXX
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'expired',
    'revoked',
    'suspended'
  )),
  
  -- QR Code
  qr_code_url TEXT,
  qr_code_data TEXT NOT NULL,
  
  -- Verification Token (for public verification)
  verification_token TEXT NOT NULL UNIQUE,
  
  -- Metadata
  issued_by UUID REFERENCES users(id),
  revoked_by UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_id_cards_guide_id ON guide_id_cards(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_id_cards_card_number ON guide_id_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_guide_id_cards_verification_token ON guide_id_cards(verification_token);
CREATE INDEX IF NOT EXISTS idx_guide_id_cards_status ON guide_id_cards(status);
CREATE INDEX IF NOT EXISTS idx_guide_id_cards_expiry_date ON guide_id_cards(expiry_date);

-- ============================================
-- GUIDE LICENSE APPLICATION SYSTEM
-- ============================================

-- Application Status Enum
DO $$ BEGIN
  CREATE TYPE guide_license_status AS ENUM (
    'pending_review',
    'document_verified',
    'document_rejected',
    'ready_for_assessment',
    'assessment_in_progress',
    'assessment_passed',
    'assessment_failed',
    'training_in_progress',
    'training_completed',
    'pending_approval',
    'approved',
    'rejected',
    'license_issued',
    'active',
    'expired',
    'revoked',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Guide License Applications
CREATE TABLE IF NOT EXISTS guide_license_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Application Info
  application_number TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Current Status
  status guide_license_status NOT NULL DEFAULT 'pending_review',
  current_stage TEXT NOT NULL DEFAULT 'application',
  
  -- Application Data
  application_data JSONB NOT NULL,
  
  -- Documents
  documents JSONB,
  
  -- Assessment Results
  assessment_results JSONB,
  
  -- Training Progress
  training_progress JSONB,
  
  -- Review & Approval
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approval_decision TEXT,
  approval_notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Rejection Info
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- License Info (after issuance)
  license_id UUID REFERENCES guide_id_cards(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_license_applications_guide_id ON guide_license_applications(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_license_applications_status ON guide_license_applications(status);
CREATE INDEX IF NOT EXISTS idx_guide_license_applications_application_number ON guide_license_applications(application_number);
CREATE INDEX IF NOT EXISTS idx_guide_license_applications_branch_id ON guide_license_applications(branch_id);

-- Document Verification Log
CREATE TABLE IF NOT EXISTS guide_document_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES guide_license_applications(id) ON DELETE CASCADE,
  
  -- Document Info
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  
  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- OCR/Extracted Data
  extracted_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_verifications_application_id ON guide_document_verifications(application_id);
CREATE INDEX IF NOT EXISTS idx_document_verifications_status ON guide_document_verifications(verification_status);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Guide Feedbacks
ALTER TABLE guide_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can create feedbacks"
  ON guide_feedbacks FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

CREATE POLICY "Guides can view their own feedbacks"
  ON guide_feedbacks FOR SELECT
  TO authenticated
  USING (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

CREATE POLICY "Admins can view branch feedbacks"
  ON guide_feedbacks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
      AND (
        role = 'super_admin' OR
        branch_id = (SELECT branch_id FROM users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Admins can update feedbacks"
  ON guide_feedbacks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Feedback Attachments
ALTER TABLE guide_feedback_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view their feedback attachments"
  ON guide_feedback_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guide_feedbacks
      WHERE id = feedback_id AND guide_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all feedback attachments"
  ON guide_feedback_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Guide ID Cards
ALTER TABLE guide_id_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view their own ID card"
  ON guide_id_cards FOR SELECT
  TO authenticated
  USING (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

CREATE POLICY "Admins can view branch ID cards"
  ON guide_id_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
      AND (
        role = 'super_admin' OR
        branch_id = (SELECT branch_id FROM users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Admins can manage ID cards"
  ON guide_id_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Public can verify ID card via token (read-only, enforced at API level)
CREATE POLICY "Public can verify ID card"
  ON guide_id_cards FOR SELECT
  TO anon, authenticated
  USING (true); -- RLS will be enforced at API level with token verification

-- License Applications
ALTER TABLE guide_license_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view own application"
  ON guide_license_applications FOR SELECT
  TO authenticated
  USING (
    guide_id = auth.uid() AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

CREATE POLICY "Admins can view all applications"
  ON guide_license_applications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Document Verifications
ALTER TABLE guide_document_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view own document verifications"
  ON guide_document_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guide_license_applications
      WHERE id = application_id AND guide_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all document verifications"
  ON guide_document_verifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guide_feedbacks_updated_at
  BEFORE UPDATE ON guide_feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_id_cards_updated_at
  BEFORE UPDATE ON guide_id_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_license_applications_updated_at
  BEFORE UPDATE ON guide_license_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_document_verifications_updated_at
  BEFORE UPDATE ON guide_document_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
