-- Migration: 115-inbox-parsing.sql
-- Description: Add AI parsing support to inbox messages
-- Created: 2025-12-26

BEGIN;

-- ============================================
-- ADD PARSING COLUMNS TO INBOX MESSAGES
-- ============================================

-- Add parsing status enum
DO $$ BEGIN
  CREATE TYPE inbox_parsing_status AS ENUM (
    'pending',
    'parsed',
    'failed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to partner_inbox_messages table
ALTER TABLE partner_inbox_messages
ADD COLUMN IF NOT EXISTS parsed_data JSONB,
ADD COLUMN IF NOT EXISTS parsing_status inbox_parsing_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS parsing_confidence INTEGER CHECK (parsing_confidence >= 0 AND parsing_confidence <= 100),
ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS draft_booking_id UUID REFERENCES bookings(id);

-- Note: Threading is handled via thread_id column in partner_inbox_messages
-- No separate partner_inbox_threads table exists

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_parsing_status ON partner_inbox_messages(parsing_status);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_draft_booking_id ON partner_inbox_messages(draft_booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_inbox_messages_parsed_at ON partner_inbox_messages(parsed_at);

-- Comments
COMMENT ON COLUMN partner_inbox_messages.parsed_data IS 'AI-parsed booking inquiry data (JSON)';
COMMENT ON COLUMN partner_inbox_messages.parsing_status IS 'Status of AI parsing';
COMMENT ON COLUMN partner_inbox_messages.parsing_confidence IS 'Confidence score (0-100) of parsing result';
COMMENT ON COLUMN partner_inbox_messages.draft_booking_id IS 'Link to draft booking created from parsed data';

COMMIT;

