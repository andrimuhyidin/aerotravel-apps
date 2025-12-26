/**
 * Migration: App Events Table
 * Description: Create app_events table untuk event bus audit trail
 * Created: 2025-02-02
 * Reference: Cross-App Data Integration Implementation Plan
 */

-- ============================================
-- APP EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS app_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  app VARCHAR(20) NOT NULL CHECK (app IN ('customer', 'partner', 'guide', 'admin', 'corporate')),
  user_id UUID REFERENCES users(id),
  data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_app_events_type ON app_events(type);
CREATE INDEX IF NOT EXISTS idx_app_events_app ON app_events(app);
CREATE INDEX IF NOT EXISTS idx_app_events_user_id ON app_events(user_id);
CREATE INDEX IF NOT EXISTS idx_app_events_created_at ON app_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_type_app ON app_events(type, app);
CREATE INDEX IF NOT EXISTS idx_app_events_user_created ON app_events(user_id, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all events
CREATE POLICY "Admins can view all events"
  ON app_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- Policy: System can insert events (via service role)
-- Note: This will be handled by service role key, not RLS

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE app_events IS 'Event bus audit trail untuk cross-app communication';
COMMENT ON COLUMN app_events.type IS 'Event type: booking.created, payment.received, trip.assigned, etc.';
COMMENT ON COLUMN app_events.app IS 'Source app: customer, partner, guide, admin, corporate';
COMMENT ON COLUMN app_events.data IS 'Event payload data (JSONB)';
COMMENT ON COLUMN app_events.metadata IS 'Additional metadata (IP address, user agent, correlation ID, etc.)';

