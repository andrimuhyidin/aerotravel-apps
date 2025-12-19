-- Migration: 053-passenger-consent.sql
-- Description: Safety Briefing & Passenger Consent System
-- Created: 2025-01-23

-- ============================================
-- SAFETY BRIEFINGS
-- ============================================
CREATE TABLE IF NOT EXISTS safety_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Briefing Data (reuse existing briefing_points from trips table or store separately)
  briefing_points JSONB, -- Array of {section, points[], priority}
  briefing_read_at TIMESTAMPTZ, -- When guide finished reading
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PASSENGER CONSENTS
-- ============================================
CREATE TABLE IF NOT EXISTS passenger_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES booking_passengers(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Consent Data
  consent_given BOOLEAN DEFAULT false,
  consent_method VARCHAR(20), -- 'signature', 'fingerprint', 'verbal' (for offline)
  
  -- Signature
  signature_data TEXT, -- base64 signature image or typed text
  signature_method VARCHAR(20), -- 'draw', 'upload', 'typed'
  signature_timestamp TIMESTAMPTZ,
  
  -- Briefing Acknowledgment
  briefing_acknowledged BOOLEAN DEFAULT false,
  acknowledged_points JSONB, -- Which briefing points were acknowledged
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_consent_method CHECK (consent_method IS NULL OR consent_method IN ('signature', 'fingerprint', 'verbal')),
  CONSTRAINT valid_signature_method CHECK (signature_method IS NULL OR signature_method IN ('draw', 'upload', 'typed')),
  UNIQUE(trip_id, passenger_id) -- One consent per passenger per trip
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_safety_briefings_trip_id ON safety_briefings(trip_id);
CREATE INDEX IF NOT EXISTS idx_safety_briefings_guide_id ON safety_briefings(guide_id);
CREATE INDEX IF NOT EXISTS idx_passenger_consents_trip_id ON passenger_consents(trip_id);
CREATE INDEX IF NOT EXISTS idx_passenger_consents_passenger_id ON passenger_consents(passenger_id);
CREATE INDEX IF NOT EXISTS idx_passenger_consents_guide_id ON passenger_consents(guide_id);
CREATE INDEX IF NOT EXISTS idx_passenger_consents_consent_given ON passenger_consents(consent_given);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE safety_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_consents ENABLE ROW LEVEL SECURITY;

-- Guides can manage their own briefings
CREATE POLICY "Guides can manage own briefings"
  ON safety_briefings
  FOR ALL
  USING (auth.uid() = guide_id)
  WITH CHECK (auth.uid() = guide_id);

-- Guides can manage consents for their trips
CREATE POLICY "Guides can manage trip consents"
  ON passenger_consents
  FOR ALL
  USING (
    auth.uid() = guide_id
    AND EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = passenger_consents.trip_id
      AND (
        EXISTS (
          SELECT 1 FROM trip_guides
          WHERE trip_guides.trip_id = trips.id
          AND trip_guides.guide_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM trip_crews
          WHERE trip_crews.trip_id = trips.id
          AND trip_crews.guide_id = auth.uid()
        )
      )
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all briefings"
  ON safety_briefings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = safety_briefings.branch_id
      )
    )
  );

CREATE POLICY "Admins can view all consents"
  ON passenger_consents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = passenger_consents.branch_id
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if all passengers have consented
CREATE OR REPLACE FUNCTION all_passengers_consented(trip_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_passengers INTEGER;
  consented_count INTEGER;
BEGIN
  -- Get total passengers for trip
  SELECT COUNT(*)
  INTO total_passengers
  FROM booking_passengers bp
  JOIN bookings b ON b.id = bp.booking_id
  WHERE b.trip_id = trip_uuid;
  
  -- Get consented passengers
  SELECT COUNT(*)
  INTO consented_count
  FROM passenger_consents
  WHERE trip_id = trip_uuid
    AND consent_given = true;
  
  RETURN total_passengers > 0 AND consented_count = total_passengers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_safety_briefings_updated_at
  BEFORE UPDATE ON safety_briefings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passenger_consents_updated_at
  BEFORE UPDATE ON passenger_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE safety_briefings IS 'Track safety briefing completion per trip';
COMMENT ON TABLE passenger_consents IS 'Passenger consent records with digital signatures';
COMMENT ON COLUMN passenger_consents.consent_given IS 'Whether passenger has given consent';
COMMENT ON COLUMN passenger_consents.signature_data IS 'Digital signature (base64 image or typed text)';
COMMENT ON FUNCTION all_passengers_consented IS 'Check if all passengers for a trip have given consent';
