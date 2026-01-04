-- Migration: 103-partner-activity-logs.sql
-- Description: Create partner_activity_logs table and triggers for audit trail
-- Created: 2025-12-24
-- Reference: Partner Portal Missing Features Implementation Plan

-- ============================================
-- PARTNER ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- who performed action
  
  -- Action Details
  action_type VARCHAR(50) NOT NULL, -- booking_created, invoice_generated, customer_created, settings_changed, etc.
  entity_type VARCHAR(50) NOT NULL, -- booking, invoice, customer, package, settings, etc.
  entity_id UUID, -- ID of the affected entity
  
  -- Details (JSONB for flexible data)
  details JSONB DEFAULT '{}',
  
  -- Request Metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_partner_id ON partner_activity_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_user_id ON partner_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_action_type ON partner_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_entity_type ON partner_activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_entity_id ON partner_activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_created_at ON partner_activity_logs(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_activity_logs ENABLE ROW LEVEL SECURITY;

-- Partners can view their own activity logs
CREATE POLICY "Partners can view own activity logs"
  ON partner_activity_logs FOR SELECT
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_activity_logs.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- System can insert activity logs (via triggers or API)
CREATE POLICY "System can insert activity logs"
  ON partner_activity_logs FOR INSERT
  WITH CHECK (true); -- Will be filtered by application logic

-- Admins can view all
CREATE POLICY "Admins can view all activity logs"
  ON partner_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- ============================================
-- TRIGGER FUNCTION: Log Booking Activities
-- ============================================
CREATE OR REPLACE FUNCTION log_booking_activity()
RETURNS TRIGGER AS $$
DECLARE
  partner_id_val UUID;
BEGIN
  -- Get partner_id from booking
  partner_id_val := NEW.mitra_id;
  
  -- Log booking creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO partner_activity_logs (
      partner_id,
      user_id,
      action_type,
      entity_type,
      entity_id,
      details
    ) VALUES (
      partner_id_val,
      auth.uid(),
      'booking_created',
      'booking',
      NEW.id,
      jsonb_build_object(
        'booking_code', NEW.booking_code,
        'customer_name', NEW.customer_name,
        'total_amount', NEW.total_amount,
        'status', NEW.status
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log booking update
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO partner_activity_logs (
      partner_id,
      user_id,
      action_type,
      entity_type,
      entity_id,
      details
    ) VALUES (
      partner_id_val,
      auth.uid(),
      'booking_updated',
      'booking',
      NEW.id,
      jsonb_build_object(
        'booking_code', NEW.booking_code,
        'status_changed', OLD.status != NEW.status,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for bookings
DROP TRIGGER IF EXISTS trigger_log_booking_activity ON bookings;
CREATE TRIGGER trigger_log_booking_activity
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.mitra_id IS NOT NULL)
  EXECUTE FUNCTION log_booking_activity();

-- ============================================
-- TRIGGER FUNCTION: Log Invoice Generation
-- ============================================
-- Note: Invoice generation is typically done via API, so we'll log it there
-- This is a placeholder for future trigger-based logging if needed

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE partner_activity_logs IS 'Audit trail of user actions in partner portal';
COMMENT ON COLUMN partner_activity_logs.action_type IS 'Type of action: booking_created, invoice_generated, customer_created, settings_changed, etc.';
COMMENT ON COLUMN partner_activity_logs.entity_type IS 'Type of entity affected: booking, invoice, customer, package, settings, etc.';
COMMENT ON COLUMN partner_activity_logs.details IS 'JSONB object with additional action details';

