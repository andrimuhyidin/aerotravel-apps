/**
 * Migration: Partner Notifications Table
 * Creates table for in-app notifications for partners
 */

-- Create partner_notifications table
CREATE TABLE IF NOT EXISTS partner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification content
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_id 
  ON partner_notifications(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_read 
  ON partner_notifications(partner_id, is_read);

CREATE INDEX IF NOT EXISTS idx_partner_notifications_created_at 
  ON partner_notifications(created_at DESC);

-- RLS Policies
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can only see their own notifications
CREATE POLICY "Partners can view own notifications"
  ON partner_notifications
  FOR SELECT
  USING (auth.uid() = partner_id);

-- Policy: Partners can update their own notifications (mark as read)
CREATE POLICY "Partners can update own notifications"
  ON partner_notifications
  FOR UPDATE
  USING (auth.uid() = partner_id);

-- Add comments
COMMENT ON TABLE partner_notifications IS 'In-app notifications for partners';
COMMENT ON COLUMN partner_notifications.type IS 'Notification type: booking_confirmed, booking_cancelled, payment_received, etc.';
COMMENT ON COLUMN partner_notifications.metadata IS 'Additional data for the notification (booking ID, amounts, etc.)';

