-- Migration: 030-guide-trip-confirmation.sql
-- Description: Trip assignment confirmation system dengan deadline dan auto-reassignment
-- Created: 2025-12-20

-- ============================================
-- ENUM: Assignment Status
-- ============================================
DO $$ BEGIN
  CREATE TYPE trip_assignment_status AS ENUM (
    'pending_confirmation',  -- Menunggu konfirmasi guide
    'confirmed',             -- Guide sudah konfirmasi bisa
    'rejected',              -- Guide menolak
    'expired',               -- Deadline lewat, belum confirm
    'auto_reassigned'        -- Sudah di-reassign ke guide lain
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ADD COLUMNS TO TRIP_GUIDES
-- ============================================
ALTER TABLE trip_guides
  ADD COLUMN IF NOT EXISTS assignment_status trip_assignment_status DEFAULT 'pending_confirmation',
  ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS auto_reassigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reassigned_from_guide_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS assignment_method VARCHAR(20) DEFAULT 'manual'; -- 'manual', 'auto', 'reassigned'

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trip_guides_assignment_status 
  ON trip_guides(assignment_status);

CREATE INDEX IF NOT EXISTS idx_trip_guides_confirmation_deadline 
  ON trip_guides(confirmation_deadline) 
  WHERE assignment_status = 'pending_confirmation';

CREATE INDEX IF NOT EXISTS idx_trip_guides_reassigned_from 
  ON trip_guides(reassigned_from_guide_id) 
  WHERE reassigned_from_guide_id IS NOT NULL;

-- ============================================
-- FUNCTION: Calculate Confirmation Deadline
-- ============================================
CREATE OR REPLACE FUNCTION calculate_confirmation_deadline(p_trip_date DATE)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_h_minus_one DATE;
  v_deadline TIMESTAMPTZ;
  v_minimum_deadline TIMESTAMPTZ;
BEGIN
  -- H-1 = trip_date - 1 hari
  v_h_minus_one := p_trip_date - INTERVAL '1 day';
  
  -- Deadline = H-1 jam 22:00 WIB
  v_deadline := (v_h_minus_one::text || ' 22:00:00+07')::TIMESTAMPTZ;
  
  -- Minimum deadline: hari ini jam 22:00 (jika trip_date < 2 hari dari sekarang)
  v_minimum_deadline := (CURRENT_DATE::text || ' 22:00:00+07')::TIMESTAMPTZ;
  
  -- Jika deadline terlalu dekat (< 2 jam dari sekarang), set minimum
  IF v_deadline < NOW() + INTERVAL '2 hours' THEN
    RETURN v_minimum_deadline;
  END IF;
  
  RETURN v_deadline;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Auto-reassign Expired Assignments
-- ============================================
CREATE OR REPLACE FUNCTION auto_reassign_expired_assignments()
RETURNS TABLE(
  reassigned_count INTEGER,
  trip_ids UUID[]
) AS $$
DECLARE
  v_expired_record RECORD;
  v_trip_record RECORD;
  v_reassigned_count INTEGER := 0;
  v_trip_ids UUID[] := ARRAY[]::UUID[];
  v_max_reassignments INTEGER := 3;
BEGIN
  -- Find expired assignments (deadline passed, still pending_confirmation)
  FOR v_expired_record IN
    SELECT 
      tg.id,
      tg.trip_id,
      tg.guide_id,
      tg.reassigned_from_guide_id,
      t.trip_date,
      t.trip_code
    FROM trip_guides tg
    JOIN trips t ON t.id = tg.trip_id
    WHERE tg.assignment_status = 'pending_confirmation'
      AND tg.confirmation_deadline < NOW()
      AND t.status IN ('scheduled', 'confirmed')
    ORDER BY tg.confirmation_deadline ASC
    LIMIT 50 -- Process max 50 at a time
  LOOP
    -- Check how many times this trip has been reassigned
    SELECT COUNT(*) INTO v_reassigned_count
    FROM trip_guides
    WHERE trip_id = v_expired_record.trip_id
      AND assignment_status = 'auto_reassigned';
    
    -- Skip if already reassigned 3 times
    IF v_reassigned_count >= v_max_reassignments THEN
      -- Mark as expired and flag for manual assignment
      UPDATE trip_guides
      SET assignment_status = 'expired',
          auto_reassigned_at = NOW()
      WHERE id = v_expired_record.id;
      
      CONTINUE;
    END IF;
    
    -- Mark current assignment as auto_reassigned
    UPDATE trip_guides
    SET assignment_status = 'auto_reassigned',
        auto_reassigned_at = NOW()
    WHERE id = v_expired_record.id;
    
    -- Get trip info for finding next guide
    SELECT * INTO v_trip_record
    FROM trips
    WHERE id = v_expired_record.trip_id;
    
    -- Note: Actual reassignment logic will be handled by application code
    -- This function just marks expired assignments
    
    v_trip_ids := array_append(v_trip_ids, v_expired_record.trip_id);
  END LOOP;
  
  RETURN QUERY SELECT 
    array_length(v_trip_ids, 1)::INTEGER as reassigned_count,
    v_trip_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-set assigned_at on insert
-- ============================================
CREATE OR REPLACE FUNCTION set_trip_guide_assigned_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_at IS NULL THEN
    NEW.assigned_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_trip_guide_assigned_at ON trip_guides;
CREATE TRIGGER trigger_set_trip_guide_assigned_at
  BEFORE INSERT ON trip_guides
  FOR EACH ROW
  EXECUTE FUNCTION set_trip_guide_assigned_at();

-- ============================================
-- UPDATE EXISTING RECORDS
-- ============================================
-- Set existing assignments as confirmed (backward compatibility)
UPDATE trip_guides
SET assignment_status = 'confirmed',
    confirmed_at = assigned_at,
    confirmation_deadline = calculate_confirmation_deadline(
      (SELECT trip_date FROM trips WHERE id = trip_guides.trip_id)
    )
WHERE assignment_status IS NULL
  AND trip_id IN (SELECT id FROM trips WHERE trip_date >= CURRENT_DATE);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN trip_guides.assignment_status IS 'Status konfirmasi assignment: pending_confirmation, confirmed, rejected, expired, auto_reassigned';
COMMENT ON COLUMN trip_guides.confirmation_deadline IS 'Deadline konfirmasi: H-1 jam 22:00 WIB';
COMMENT ON COLUMN trip_guides.reassigned_from_guide_id IS 'Guide ID yang sebelumnya reject/expired (untuk tracking)';
