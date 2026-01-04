-- Migration: 079-chat-attachments.sql
-- Description: Add file attachment support to trip chat messages
-- Created: 2025-01-28

-- ============================================
-- ADD ATTACHMENT COLUMN TO TRIP CHAT MESSAGES
-- ============================================
ALTER TABLE trip_chat_messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50), -- 'image', 'pdf', 'document'
ADD COLUMN IF NOT EXISTS attachment_filename VARCHAR(255);

-- Add index for attachment queries (optional, for filtering messages with attachments)
CREATE INDEX IF NOT EXISTS idx_trip_chat_messages_has_attachment 
ON trip_chat_messages(trip_id, created_at DESC) 
WHERE attachment_url IS NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN trip_chat_messages.attachment_url IS 'URL to file attachment (stored in Supabase Storage)';
COMMENT ON COLUMN trip_chat_messages.attachment_type IS 'Type of attachment: image, pdf, document';
COMMENT ON COLUMN trip_chat_messages.attachment_filename IS 'Original filename of attachment';

