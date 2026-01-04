-- Migration: 018-trip-management-schema.sql
-- Description: Add missing tables and columns for Trip Management features
-- Created: 2025-12-22

-- ============================================
-- 1. PACKAGE ITINERARIES
-- ============================================

CREATE TABLE IF NOT EXISTS package_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id),
  
  -- Day Info
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Activities
  activities JSONB DEFAULT '[]'::jsonb, -- Array of {time, activity, location}
  
  -- Meals
  meals TEXT[], -- ['breakfast', 'lunch', 'dinner']
  
  -- Accommodation
  accommodation TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(package_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_package_itineraries_package_id ON package_itineraries(package_id);


-- ============================================
-- 2. TRIP MANIFEST (Passenger Manifest)
-- ============================================

CREATE TABLE IF NOT EXISTS trip_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  
  -- Passenger Info
  passenger_name TEXT NOT NULL,
  passenger_email TEXT,
  passenger_phone TEXT,
  passenger_id_number TEXT, -- KTP/Passport
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Health Info
  health_notes TEXT,
  allergies TEXT[],
  
  -- Status
  check_in_status TEXT DEFAULT 'pending', -- 'pending', 'checked_in', 'no_show'
  checked_in_at TIMESTAMPTZ,
  
  -- Seat/Room Assignment (optional)
  seat_number TEXT,
  room_number TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_manifest_trip_id ON trip_manifest(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_manifest_status ON trip_manifest(check_in_status);


-- ============================================
-- 3. PASSENGER CONSENTS
-- ============================================

CREATE TABLE IF NOT EXISTS passenger_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  manifest_id UUID REFERENCES trip_manifest(id),
  
  -- Passenger Info (denormalized for quick access)
  passenger_name TEXT NOT NULL,
  passenger_id TEXT, -- KTP/Passport number
  
  -- Consent Details
  consent_type TEXT NOT NULL, -- 'liability', 'photo_usage', 'data_privacy', 'health_declaration'
  consent_text TEXT NOT NULL,
  
  -- Agreement
  agreed BOOLEAN DEFAULT false,
  agreed_at TIMESTAMPTZ,
  signature_data TEXT, -- Base64 image or signature string
  
  -- IP & Device Info
  ip_address TEXT,
  user_agent TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passenger_consents_trip_id ON passenger_consents(trip_id);
CREATE INDEX IF NOT EXISTS idx_passenger_consents_manifest_id ON passenger_consents(manifest_id);


-- ============================================
-- 4. TRIP TASKS (Checklist untuk Guide)
-- ============================================

CREATE TABLE IF NOT EXISTS trip_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  guide_id UUID REFERENCES users(id),
  
  -- Task Info
  task_type TEXT NOT NULL, -- 'pre_trip', 'during_trip', 'post_trip'
  category TEXT, -- 'safety', 'logistics', 'documentation', 'communication'
  title TEXT NOT NULL,
  description TEXT,
  
  -- Priority
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Timeline
  due_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  
  -- Notes
  notes TEXT,
  attachments TEXT[], -- URLs to files
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_tasks_trip_id ON trip_tasks(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_tasks_guide_id ON trip_tasks(guide_id);
CREATE INDEX IF NOT EXISTS idx_trip_tasks_status ON trip_tasks(status);
CREATE INDEX IF NOT EXISTS idx_trip_tasks_type ON trip_tasks(task_type);


-- ============================================
-- 5. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add missing columns to trip_guides
DO $$ 
BEGIN
  -- Add branch_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='trip_guides' AND column_name='branch_id') THEN
    ALTER TABLE trip_guides ADD COLUMN branch_id UUID REFERENCES branches(id);
    
    -- Update existing records to inherit from trips.branch_id
    UPDATE trip_guides tg
    SET branch_id = t.branch_id
    FROM trips t
    WHERE tg.trip_id = t.id AND tg.branch_id IS NULL;
  END IF;
  
  -- Add trip_date if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='trip_guides' AND column_name='trip_date') THEN
    ALTER TABLE trip_guides ADD COLUMN trip_date DATE;
    
    -- Update existing records to inherit from trips.trip_date
    UPDATE trip_guides tg
    SET trip_date = t.trip_date
    FROM trips t
    WHERE tg.trip_id = t.id AND tg.trip_date IS NULL;
  END IF;
END $$;

-- Add missing columns to packages
DO $$ 
BEGIN
  -- Add trip_type if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='packages' AND column_name='trip_type') THEN
    ALTER TABLE packages ADD COLUMN trip_type TEXT DEFAULT 'tour'; -- 'tour', 'diving', 'trekking', 'water_sport'
  END IF;
  
  -- Add duration if not exists  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='packages' AND column_name='duration') THEN
    ALTER TABLE packages ADD COLUMN duration INTEGER DEFAULT 1; -- in days
    
    -- Try to infer from package_name or set default
    UPDATE packages SET duration = 3 WHERE name ILIKE '%3 hari%' OR name ILIKE '%3d%';
    UPDATE packages SET duration = 4 WHERE name ILIKE '%4 hari%' OR name ILIKE '%4d%';
    UPDATE packages SET duration = 5 WHERE name ILIKE '%5 hari%' OR name ILIKE '%5d%';
    UPDATE packages SET duration = 2 WHERE name ILIKE '%2 hari%' OR name ILIKE '%2d%';
  END IF;
END $$;


-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_package_itineraries_updated_at ON package_itineraries;
CREATE TRIGGER update_package_itineraries_updated_at BEFORE UPDATE ON package_itineraries 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_manifest_updated_at ON trip_manifest;
CREATE TRIGGER update_trip_manifest_updated_at BEFORE UPDATE ON trip_manifest 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_passenger_consents_updated_at ON passenger_consents;
CREATE TRIGGER update_passenger_consents_updated_at BEFORE UPDATE ON passenger_consents 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_tasks_updated_at ON trip_tasks;
CREATE TRIGGER update_trip_tasks_updated_at BEFORE UPDATE ON trip_tasks 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

