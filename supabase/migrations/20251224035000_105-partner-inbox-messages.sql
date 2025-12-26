-- Migration: 105-partner-inbox-messages.sql
-- Description: Create partner_inbox_messages table for communication with Aero team
-- Created: 2025-12-24
-- Reference: Partner Portal Missing Features Implementation Plan

-- ============================================
-- PARTNER INBOX MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Threading
  thread_id UUID, -- NULL for root message, same thread_id for replies
  parent_message_id UUID REFERENCES partner_inbox_messages(id) ON DELETE CASCADE,
  
  -- Message Content
  subject VARCHAR(500),
  message_text TEXT NOT NULL,
  
  -- Sender/Receiver
  sender_id UUID REFERENCES users(id), -- NULL for Aero team (system), partner user_id for partner messages
  sender_type VARCHAR(20) NOT NULL DEFAULT 'partner', -- 'partner' or 'aero_team'
  sender_name VARCHAR(255), -- Cached name for display
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Priority & Category
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  category VARCHAR(50), -- 'general', 'booking', 'payment', 'technical', 'billing', etc.
  
  -- Attachments (JSONB array of file URLs)
  attachments JSONB DEFAULT '[]',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_partner_id ON partner_inbox_messages(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_thread_id ON partner_inbox_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_parent_message_id ON partner_inbox_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_sender_id ON partner_inbox_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_is_read ON partner_inbox_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_created_at ON partner_inbox_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_category ON partner_inbox_messages(category);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_priority ON partner_inbox_messages(priority);

-- ============================================
-- FUNCTION: Auto-set thread_id for root messages
-- ============================================
CREATE OR REPLACE FUNCTION set_thread_id_for_root_message()
RETURNS TRIGGER AS $$
BEGIN
  -- If thread_id is NULL and parent_message_id is NULL, this is a root message
  -- Set thread_id to the message's own id
  IF NEW.thread_id IS NULL AND NEW.parent_message_id IS NULL THEN
    NEW.thread_id := NEW.id;
  END IF;
  
  -- If parent_message_id is set, inherit thread_id from parent
  IF NEW.parent_message_id IS NOT NULL THEN
    SELECT thread_id INTO NEW.thread_id
    FROM partner_inbox_messages
    WHERE id = NEW.parent_message_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_thread_id_for_root_message
  BEFORE INSERT ON partner_inbox_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_thread_id_for_root_message();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_inbox_messages ENABLE ROW LEVEL SECURITY;

-- Partners can view their own messages
CREATE POLICY "Partners can view own messages"
  ON partner_inbox_messages FOR SELECT
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_inbox_messages.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- Partners can insert messages to their own inbox
CREATE POLICY "Partners can insert own messages"
  ON partner_inbox_messages FOR INSERT
  WITH CHECK (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_inbox_messages.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- Partners can update their own messages (mark as read, etc.)
CREATE POLICY "Partners can update own messages"
  ON partner_inbox_messages FOR UPDATE
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_inbox_messages.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- Aero team (admins) can view all messages
CREATE POLICY "Aero team can view all messages"
  ON partner_inbox_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- Aero team can insert messages (replies)
CREATE POLICY "Aero team can insert messages"
  ON partner_inbox_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- Aero team can update messages
CREATE POLICY "Aero team can update messages"
  ON partner_inbox_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_partner_inbox_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_inbox_messages_updated_at
  BEFORE UPDATE ON partner_inbox_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_inbox_messages_updated_at();

-- ============================================
-- TRIGGER: Auto-set read_at when is_read changes to true
-- ============================================
CREATE OR REPLACE FUNCTION set_read_at_on_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false AND NEW.read_at IS NULL THEN
    NEW.read_at = NOW();
  END IF;
  IF NEW.is_read = false THEN
    NEW.read_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_read_at_on_read
  BEFORE UPDATE ON partner_inbox_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_read_at_on_read();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE partner_inbox_messages IS 'Messages between partners and Aero team with threading support';
COMMENT ON COLUMN partner_inbox_messages.thread_id IS 'Thread ID - same for all messages in a conversation thread';
COMMENT ON COLUMN partner_inbox_messages.parent_message_id IS 'Parent message ID for replies';
COMMENT ON COLUMN partner_inbox_messages.sender_type IS 'Type of sender: partner or aero_team';
COMMENT ON COLUMN partner_inbox_messages.sender_name IS 'Cached sender name for display';
COMMENT ON COLUMN partner_inbox_messages.priority IS 'Message priority: low, normal, high, urgent';
COMMENT ON COLUMN partner_inbox_messages.category IS 'Message category: general, booking, payment, technical, billing, etc.';
COMMENT ON COLUMN partner_inbox_messages.attachments IS 'JSONB array of attachment file URLs';

