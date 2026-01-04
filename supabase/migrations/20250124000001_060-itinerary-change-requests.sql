-- Migration: 060-itinerary-change-requests.sql
-- Description: Itinerary change requests untuk guide (butuh approval admin)
-- Created: 2025-01-24

-- ============================================
-- ITINERARY CHANGE REQUESTS
-- ============================================
DO $$ BEGIN
  CREATE TYPE itinerary_change_status AS ENUM (
    'pending',      -- Menunggu approval admin
    'approved',     -- Disetujui admin
    'rejected',     -- Ditolak admin
    'applied'       -- Sudah diaplikasikan ke itinerary
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS itinerary_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Request Info
  day_number INTEGER NOT NULL,
  activity_index INTEGER, -- Index activity yang diubah (null jika new activity)
  
  -- Original Data (untuk tracking)
  original_time TEXT,
  original_label TEXT,
  original_location TEXT,
  
  -- Requested Changes
  requested_time TEXT,
  requested_label TEXT NOT NULL,
  requested_location TEXT,
  
  -- Change Type
  change_type VARCHAR(20) NOT NULL, -- 'modify', 'add', 'remove', 'reorder'
  
  -- Reason/Notes
  reason TEXT, -- Alasan perubahan dari guide
  admin_notes TEXT, -- Catatan dari admin
  
  -- Status
  status itinerary_change_status NOT NULL DEFAULT 'pending',
  
  -- Approval
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Applied (ketika sudah diaplikasikan)
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES users(id),
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_change_type CHECK (change_type IN ('modify', 'add', 'remove', 'reorder'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_itinerary_change_requests_trip_id 
ON itinerary_change_requests(trip_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_change_requests_status 
ON itinerary_change_requests(status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_itinerary_change_requests_created_by 
ON itinerary_change_requests(created_by);

CREATE INDEX IF NOT EXISTS idx_itinerary_change_requests_branch_id 
ON itinerary_change_requests(branch_id);

-- RLS Policies
ALTER TABLE itinerary_change_requests ENABLE ROW LEVEL SECURITY;

-- Guides can view their own requests
CREATE POLICY "Guides can view their own change requests"
ON itinerary_change_requests
FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM trips t
    JOIN trip_crews tc ON tc.trip_id = t.id
    WHERE t.id = itinerary_change_requests.trip_id
    AND tc.guide_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM trips t
    JOIN trip_guides tg ON tg.trip_id = t.id
    WHERE t.id = itinerary_change_requests.trip_id
    AND tg.guide_id = auth.uid()
  )
);

-- Guides can create requests
CREATE POLICY "Guides can create change requests"
ON itinerary_change_requests
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = itinerary_change_requests.trip_id
    AND (
      EXISTS (
        SELECT 1 FROM trip_crews tc
        WHERE tc.trip_id = t.id AND tc.guide_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM trip_guides tg
        WHERE tg.trip_id = t.id AND tg.guide_id = auth.uid()
      )
    )
  )
);

-- Admins can view all requests
CREATE POLICY "Admins can view all change requests"
ON itinerary_change_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('super_admin', 'ops_admin')
  )
);

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update change requests"
ON itinerary_change_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('super_admin', 'ops_admin')
  )
);

-- Comments
COMMENT ON TABLE itinerary_change_requests IS 'Request perubahan itinerary dari guide yang perlu approval admin untuk tracking kesesuaian';
COMMENT ON COLUMN itinerary_change_requests.change_type IS 'Type perubahan: modify, add, remove, reorder';
COMMENT ON COLUMN itinerary_change_requests.status IS 'Status: pending (menunggu), approved (disetujui), rejected (ditolak), applied (sudah diaplikasikan)';
