/**
 * Migration: Cross-App Audit Trail
 * Description: Create audit_logs table untuk cross-app audit trail
 * Created: 2025-02-02
 * Reference: Cross-App Data Integration Implementation Plan
 */

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================

-- Check if audit_logs exists and has different structure
DO $$
BEGIN
  -- Add app column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'app'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN app VARCHAR(20) CHECK (app IN ('customer', 'partner', 'guide', 'admin', 'corporate'));
  END IF;

  -- Add changes column if it doesn't exist (use old_values and new_values if available)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'changes'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN changes JSONB DEFAULT '{}';
  END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

-- Create indexes (skip if already exists)
CREATE INDEX IF NOT EXISTS idx_audit_logs_app ON audit_logs(app) WHERE app IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
-- action index already exists, skip
-- entity index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_audit_logs_entity'
  ) THEN
    CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
  END IF;
END $$;
-- created_at index already exists, skip
CREATE INDEX IF NOT EXISTS idx_audit_logs_app_user ON audit_logs(app, user_id) WHERE app IS NOT NULL AND user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_full ON audit_logs(entity_type, entity_id, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all audit logs (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' AND policyname = 'Admins can view all audit logs'
  ) THEN
    CREATE POLICY "Admins can view all audit logs"
      ON audit_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('super_admin', 'ops_admin')
          AND users.is_active = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' AND policyname = 'Users can view own audit logs'
  ) THEN
    CREATE POLICY "Users can view own audit logs"
      ON audit_logs
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: System can insert audit logs (via service role)
-- Note: This will be handled by service role key, not RLS

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE audit_logs IS 'Cross-app audit trail untuk tracking all data changes and user actions';
COMMENT ON COLUMN audit_logs.app IS 'Source app: customer, partner, guide, admin, corporate';
COMMENT ON COLUMN audit_logs.action IS 'Action type: create, update, delete, view, export, login, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Entity type: booking, package, trip, user, etc.';
COMMENT ON COLUMN audit_logs.changes IS 'Before/after changes (JSONB)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string for the request';

