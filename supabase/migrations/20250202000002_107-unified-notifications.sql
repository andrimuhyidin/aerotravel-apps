/**
 * Migration: Unified Notifications System
 * Description: Create unified_notifications and notification_preferences tables untuk cross-app notification system
 * Created: 2025-02-02
 * Reference: Cross-App Data Integration Implementation Plan
 */

-- ============================================
-- UNIFIED NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS unified_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app VARCHAR(20) NOT NULL CHECK (app IN ('customer', 'partner', 'guide', 'admin', 'corporate')),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app VARCHAR(20) NOT NULL CHECK (app IN ('customer', 'partner', 'guide', 'admin', 'corporate')),
  notification_type VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  channels JSONB DEFAULT '["in_app"]'::jsonb, -- Array of 'in_app' | 'email' | 'push' | 'sms'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app, notification_type)
);

-- ============================================
-- INDEXES
-- ============================================

-- Unified notifications indexes
CREATE INDEX IF NOT EXISTS idx_unified_notifications_user_id 
  ON unified_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_unified_notifications_user_app 
  ON unified_notifications(user_id, app);

CREATE INDEX IF NOT EXISTS idx_unified_notifications_user_read 
  ON unified_notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_unified_notifications_user_app_read 
  ON unified_notifications(user_id, app, read);

CREATE INDEX IF NOT EXISTS idx_unified_notifications_created_at 
  ON unified_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unified_notifications_type 
  ON unified_notifications(type);

-- Notification preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
  ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_app 
  ON notification_preferences(user_id, app);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_enabled 
  ON notification_preferences(user_id, app, enabled) WHERE enabled = true;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE unified_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON unified_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON unified_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications (via service role)
-- Note: This will be handled by service role key, not RLS

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE unified_notifications;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE unified_notifications IS 'Unified notification system untuk semua apps (customer, partner, guide, admin, corporate)';
COMMENT ON COLUMN unified_notifications.app IS 'Target app: customer, partner, guide, admin, corporate';
COMMENT ON COLUMN unified_notifications.type IS 'Notification type: booking.created, payment.received, trip.assigned, etc.';
COMMENT ON COLUMN unified_notifications.metadata IS 'Additional data untuk notification (booking ID, amounts, etc.)';

COMMENT ON TABLE notification_preferences IS 'User preferences untuk notification types dan delivery channels';
COMMENT ON COLUMN notification_preferences.channels IS 'Array of delivery channels: in_app, email, push, sms';

