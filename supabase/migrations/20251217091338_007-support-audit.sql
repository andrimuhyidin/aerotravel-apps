-- Migration: 007-support-audit.sql
-- Description: Support tickets, audit logs, and AI documents
-- Created: 2025-12-17

-- Enable pgvector for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TICKETS (Complaint & Ticketing from PRD 4.7)
-- ============================================
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM (
    'open',
    'in_progress',
    'escalated',
    'resolved',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM (
    'facility_issue',      -- Fasilitas rusak
    'food_issue',          -- Makanan basi
    'guide_complaint',     -- Guide tidak ramah
    'safety_issue',        -- Masalah keselamatan
    'payment_issue',       -- Masalah pembayaran
    'refund_request',      -- Permintaan refund
    'general_inquiry',     -- Pertanyaan umum
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Ticket Info
  ticket_code VARCHAR(20) NOT NULL UNIQUE, -- TKT-20251217-001
  
  -- Category & Priority
  category ticket_category NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  
  -- Subject & Description
  subject VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  
  -- Related Entities
  booking_id UUID REFERENCES bookings(id),
  trip_id UUID REFERENCES trips(id),
  
  -- Reporter
  reported_by UUID REFERENCES users(id),
  reporter_name VARCHAR(200),
  reporter_email VARCHAR(200),
  reporter_phone VARCHAR(20),
  
  -- Status
  status ticket_status NOT NULL DEFAULT 'open',
  
  -- SLA (from PRD 4.7 - 30 minutes)
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Escalation
  escalated_to UUID REFERENCES users(id),
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT NOT NULL DEFAULT '',
  
  -- Satisfaction
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_feedback TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TICKET COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Comment
  comment TEXT NOT NULL,
  
  -- Attachments
  attachment_urls TEXT[],
  
  -- Internal note (not visible to customer)
  is_internal BOOLEAN DEFAULT false,
  
  -- Author
  author_id UUID REFERENCES users(id),
  author_name VARCHAR(200),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS (from PRD 3.2 - Super Admin)
-- ============================================
DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'login',
    'logout',
    'export',
    'unmask',     -- Unmasking sensitive data
    'approve',
    'reject'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(200),
  user_role user_role,
  
  -- Action
  action audit_action NOT NULL,
  
  -- Target
  entity_type VARCHAR(100) NOT NULL, -- 'booking', 'payment', etc
  entity_id UUID,
  
  -- Details
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOS ALERTS (Panic Button from PRD 6.1)
-- ============================================
DO $$ BEGIN
  CREATE TYPE sos_status AS ENUM (
    'active',
    'acknowledged',
    'responding',
    'resolved',
    'false_alarm'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Trip & Guide
  trip_id UUID REFERENCES trips(id),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name TEXT, -- Reverse geocoded
  
  -- Status
  status sos_status NOT NULL DEFAULT 'active',
  
  -- Response
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI DOCUMENTS (RAG Knowledge Base)
-- ============================================
DO $$ BEGIN
  CREATE TYPE ai_document_type AS ENUM (
    'sop',           -- Standard Operating Procedure
    'faq',           -- Frequently Asked Questions
    'policy',        -- Kebijakan perusahaan
    'product_info',  -- Informasi produk
    'training'       -- Materi training
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id), -- NULL = global
  
  -- Document Info
  title VARCHAR(300) NOT NULL,
  document_type ai_document_type NOT NULL,
  content TEXT NOT NULL,
  
  -- Embedding (pgvector)
  embedding vector(1536), -- OpenAI ada-002 dimension
  
  -- Metadata
  metadata JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) UNIQUE,
  
  -- Reviewer
  reviewer_id UUID REFERENCES users(id),
  reviewer_name VARCHAR(200) NOT NULL,
  
  -- Rating
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  guide_rating INTEGER CHECK (guide_rating >= 1 AND guide_rating <= 5),
  facility_rating INTEGER CHECK (facility_rating >= 1 AND facility_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Review
  review_text TEXT,
  
  -- Photos (Social Proof from PRD 5.3)
  photo_unlocked BOOLEAN DEFAULT false, -- Unlock after review
  
  -- Moderation
  is_published BOOLEAN DEFAULT true,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOYALTY POINTS (AeroPoints from PRD 5.3)
-- ============================================
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Balance
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE points_transaction_type AS ENUM (
    'earn_booking',    -- Dapat dari booking
    'earn_referral',   -- Dapat dari referral
    'earn_review',     -- Dapat dari review
    'redeem',          -- Tukar jadi diskon
    'expire',          -- Kadaluarsa
    'adjustment'       -- Adjustment manual
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_id UUID NOT NULL REFERENCES loyalty_points(id),
  
  -- Transaction
  transaction_type points_transaction_type NOT NULL,
  points INTEGER NOT NULL, -- Positive for earn, negative for spend
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Reference
  booking_id UUID REFERENCES bookings(id),
  referral_code VARCHAR(50),
  
  -- Notes
  description TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REFERRAL CODES (from PRD 5.3)
-- ============================================
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Code
  code VARCHAR(20) NOT NULL UNIQUE, -- AERO-BUDI
  
  -- Stats
  total_referrals INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_commission INTEGER DEFAULT 0, -- Points earned
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tickets_branch_id ON tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_branch_id ON sos_alerts(branch_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_guide_id ON sos_alerts(guide_id);
CREATE INDEX IF NOT EXISTS idx_ai_documents_type ON ai_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_loyalty_id ON loyalty_transactions(loyalty_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_documents_updated_at
  BEFORE UPDATE ON ai_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Log Audit
-- ============================================
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action audit_action,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_description TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user RECORD;
  v_log_id UUID;
BEGIN
  -- Get user info
  SELECT email, role INTO v_user
  FROM users u
  JOIN auth.users au ON u.id = au.id
  WHERE u.id = p_user_id;
  
  INSERT INTO audit_logs (
    user_id, user_email, user_role,
    action, entity_type, entity_id,
    description, old_values, new_values
  ) VALUES (
    p_user_id, v_user.email, v_user.role,
    p_action, p_entity_type, p_entity_id,
    p_description, p_old_values, p_new_values
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
