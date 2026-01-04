-- Migration: 017-guide-status-availability.sql
-- Description: Guide status & availability (driver-style)

-- Enums
DO $$ BEGIN
  CREATE TYPE guide_current_status AS ENUM (
    'standby',
    'on_trip',
    'not_available'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE guide_availability_status AS ENUM (
    'available',
    'not_available'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Current status per guide (single row per guide)
CREATE TABLE IF NOT EXISTS guide_status (
  guide_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_status guide_current_status NOT NULL DEFAULT 'standby',
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Future availability windows per guide
CREATE TABLE IF NOT EXISTS guide_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  available_from TIMESTAMPTZ NOT NULL,
  available_until TIMESTAMPTZ NOT NULL,
  status guide_availability_status NOT NULL,
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_guide_availability_range CHECK (available_until >= available_from)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guide_availability_guide_id ON guide_availability(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_availability_period ON guide_availability(available_from, available_until);

-- RLS
ALTER TABLE guide_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_availability ENABLE ROW LEVEL SECURITY;

-- Guide can manage own status
CREATE POLICY "guide_status_own" ON guide_status
  FOR ALL
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());

-- Guide can manage own availability
CREATE POLICY "guide_availability_own" ON guide_availability
  FOR ALL
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());

-- Ops/admin can view all guide status & availability
CREATE POLICY "guide_status_ops" ON guide_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "guide_availability_ops" ON guide_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );
