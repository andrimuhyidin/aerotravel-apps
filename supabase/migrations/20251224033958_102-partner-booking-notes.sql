-- Migration: 102-partner-booking-notes.sql
-- Description: Create partner_booking_notes table for internal team communication
-- Created: 2025-12-24
-- Reference: Partner Portal Missing Features Implementation Plan

-- ============================================
-- PARTNER BOOKING NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_booking_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- who created note (team member)
  
  -- Note Content
  note_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- true for team notes (not visible to customer)
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_booking_notes_booking_id ON partner_booking_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_booking_notes_partner_id ON partner_booking_notes(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_booking_notes_user_id ON partner_booking_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_booking_notes_deleted_at ON partner_booking_notes(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_partner_booking_notes_updated_at
  BEFORE UPDATE ON partner_booking_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_booking_notes ENABLE ROW LEVEL SECURITY;

-- Partners can view notes for their bookings
CREATE POLICY "Partners can view own booking notes"
  ON partner_booking_notes FOR SELECT
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_booking_notes.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- Team members can create notes for their partner's bookings
CREATE POLICY "Team members can create booking notes"
  ON partner_booking_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_booking_notes.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = partner_booking_notes.booking_id
      AND b.mitra_id = partner_booking_notes.partner_id
    )
  );

-- Users can update/delete their own notes, owners can update/delete any team notes
CREATE POLICY "Users can manage own notes, owners can manage all"
  ON partner_booking_notes FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_booking_notes.partner_id
      AND pu.role = 'owner'
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all booking notes"
  ON partner_booking_notes FOR SELECT
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
COMMENT ON TABLE partner_booking_notes IS 'Internal team notes for bookings (not visible to customers)';
COMMENT ON COLUMN partner_booking_notes.is_internal IS 'If true, note is only visible to team members, not customers';
COMMENT ON COLUMN partner_booking_notes.user_id IS 'Team member who created the note';

