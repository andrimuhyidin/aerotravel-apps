-- Migration: 085-partner-support-tickets.sql
-- Description: Create partner_support_tickets table for Support Ticket System
-- Created: 2025-01-25
-- Reference: Partner Portal Phase 1 Implementation Plan

-- ============================================
-- PARTNER SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- who created ticket
  
  -- Ticket Info
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50), -- booking_issue, pricing, product_info, technical, other
  
  -- Status & Priority
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted/in_review/resolved/closed
  priority VARCHAR(50) DEFAULT 'normal', -- low/normal/high/urgent
  
  -- Messages (JSONB array)
  messages JSONB DEFAULT '[]', -- [{user_id, message, created_at, is_internal}]
  
  -- SLA Tracking
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  response_sla_hours INTEGER DEFAULT 24, -- target response time
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_support_tickets_partner_id ON partner_support_tickets(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_support_tickets_status ON partner_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_partner_support_tickets_category ON partner_support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_partner_support_tickets_priority ON partner_support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_partner_support_tickets_created_at ON partner_support_tickets(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_partner_support_tickets_updated_at
  BEFORE UPDATE ON partner_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own tickets"
  ON partner_support_tickets FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create own tickets"
  ON partner_support_tickets FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update own tickets"
  ON partner_support_tickets FOR UPDATE
  USING (auth.uid() = partner_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all support tickets"
  ON partner_support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- Admins can update all tickets
CREATE POLICY "Admins can update all support tickets"
  ON partner_support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE partner_support_tickets IS 'Support ticket system for partner communication';
COMMENT ON COLUMN partner_support_tickets.category IS 'Ticket category: booking_issue, pricing, product_info, technical, other';
COMMENT ON COLUMN partner_support_tickets.status IS 'Ticket status: submitted/in_review/resolved/closed';
COMMENT ON COLUMN partner_support_tickets.priority IS 'Ticket priority: low/normal/high/urgent';
COMMENT ON COLUMN partner_support_tickets.messages IS 'JSONB array of messages: [{user_id, message, created_at, is_internal}]';
COMMENT ON COLUMN partner_support_tickets.response_sla_hours IS 'Target response time in hours (default 24)';

