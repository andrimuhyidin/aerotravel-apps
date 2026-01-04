-- Migration: 056-logistics-handover.sql
-- Description: Logistics Handover (Serah-Terima Barang) workflow
-- Created: 2025-01-23

-- ============================================
-- INVENTORY HANDOVERS
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Handover Type
  handover_type VARCHAR(20) NOT NULL, -- 'outbound' (warehouse → guide), 'inbound' (guide → warehouse)
  
  -- Parties
  from_user_id UUID REFERENCES users(id), -- Warehouse staff (outbound) or Guide (inbound)
  to_user_id UUID NOT NULL REFERENCES users(id), -- Guide (outbound) or Warehouse staff (inbound)
  
  -- Items (JSONB array)
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {item_id, name, quantity, unit, condition, photo_url}
  
  -- Verification
  verified_by_both BOOLEAN DEFAULT false,
  from_signature_data TEXT, -- Signature from sender
  from_signature_method VARCHAR(20),
  from_signature_timestamp TIMESTAMPTZ,
  to_signature_data TEXT, -- Signature from receiver
  to_signature_method VARCHAR(20),
  to_signature_timestamp TIMESTAMPTZ,
  
  -- Photos
  handover_photos TEXT[], -- Array of photo URLs
  
  -- GPS Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_captured_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'disputed', 'cancelled'
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_handover_type CHECK (handover_type IN ('outbound', 'inbound')),
  CONSTRAINT valid_handover_status CHECK (status IN ('pending', 'completed', 'disputed', 'cancelled')),
  CONSTRAINT valid_signature_method CHECK (
    from_signature_method IS NULL OR from_signature_method IN ('draw', 'upload', 'typed')
  ),
  CONSTRAINT valid_to_signature_method CHECK (
    to_signature_method IS NULL OR to_signature_method IN ('draw', 'upload', 'typed')
  )
);

-- ============================================
-- INVENTORY AUDIT (Variance Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handover_id UUID REFERENCES inventory_handovers(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Item Info
  item_name VARCHAR(200) NOT NULL,
  expected_quantity DECIMAL(10, 2) NOT NULL,
  actual_quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  
  -- Variance
  variance_amount DECIMAL(10, 2) NOT NULL, -- actual - expected
  variance_percentage DECIMAL(5, 2) NOT NULL, -- (variance / expected) * 100
  
  -- Flags
  is_variance_significant BOOLEAN DEFAULT false, -- > 10% variance
  requires_investigation BOOLEAN DEFAULT false,
  
  -- Resolution
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_unit CHECK (unit IN ('piece', 'liter', 'kilogram', 'meter', 'box', 'bottle', 'other'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_handovers_trip_id ON inventory_handovers(trip_id);
CREATE INDEX IF NOT EXISTS idx_inventory_handovers_branch_id ON inventory_handovers(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_handovers_type ON inventory_handovers(handover_type);
CREATE INDEX IF NOT EXISTS idx_inventory_handovers_status ON inventory_handovers(status);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_handover_id ON inventory_audit(handover_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_trip_id ON inventory_audit(trip_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_significant ON inventory_audit(is_variance_significant) WHERE is_variance_significant = true;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE inventory_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audit ENABLE ROW LEVEL SECURITY;

-- Guides can view handovers for their trips
CREATE POLICY "Guides can view trip handovers"
  ON inventory_handovers
  FOR SELECT
  USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
    OR EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = inventory_handovers.trip_id
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

-- Guides can create handovers for their trips
CREATE POLICY "Guides can create handovers"
  ON inventory_handovers
  FOR INSERT
  WITH CHECK (
    auth.uid() = to_user_id OR auth.uid() = from_user_id
  );

-- Guides can update handovers they're involved in
CREATE POLICY "Guides can update own handovers"
  ON inventory_handovers
  FOR UPDATE
  USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

-- Admins can view all
CREATE POLICY "Admins can view all handovers"
  ON inventory_handovers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = inventory_handovers.branch_id
      )
    )
  );

-- Admins can view audit
CREATE POLICY "Admins can view audit"
  ON inventory_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = inventory_audit.branch_id
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate variance and flag significant ones
CREATE OR REPLACE FUNCTION calculate_inventory_variance(
  expected DECIMAL,
  actual DECIMAL
)
RETURNS TABLE (
  variance_amount DECIMAL,
  variance_percentage DECIMAL,
  is_significant BOOLEAN
) AS $$
DECLARE
  variance DECIMAL;
  percentage DECIMAL;
  significant BOOLEAN;
BEGIN
  variance := actual - expected;
  percentage := CASE 
    WHEN expected = 0 THEN 0
    ELSE (variance / expected) * 100
  END;
  significant := ABS(percentage) > 10.0; -- > 10% variance is significant
  
  RETURN QUERY SELECT variance, percentage, significant;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_inventory_handovers_updated_at
  BEFORE UPDATE ON inventory_handovers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create audit records for significant variances
CREATE OR REPLACE FUNCTION auto_audit_variance()
RETURNS TRIGGER AS $$
DECLARE
  item_data JSONB;
  expected DECIMAL;
  actual DECIMAL;
  variance_result RECORD;
BEGIN
  -- Only audit on inbound handover completion
  IF NEW.handover_type = 'inbound' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Loop through items and check for variance
    FOR item_data IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      expected := (item_data->>'expected_quantity')::DECIMAL;
      actual := (item_data->>'quantity')::DECIMAL;
      
      -- Calculate variance
      SELECT * INTO variance_result
      FROM calculate_inventory_variance(expected, actual);
      
      -- Create audit record if significant variance
      IF variance_result.is_significant THEN
        INSERT INTO inventory_audit (
          handover_id,
          trip_id,
          branch_id,
          item_name,
          expected_quantity,
          actual_quantity,
          unit,
          variance_amount,
          variance_percentage,
          is_variance_significant,
          requires_investigation
        ) VALUES (
          NEW.id,
          NEW.trip_id,
          NEW.branch_id,
          item_data->>'name',
          expected,
          actual,
          COALESCE(item_data->>'unit', 'piece'),
          variance_result.variance_amount,
          variance_result.variance_percentage,
          true,
          true
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_audit_variance_trigger
  AFTER UPDATE ON inventory_handovers
  FOR EACH ROW
  EXECUTE FUNCTION auto_audit_variance();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE inventory_handovers IS 'Logistics handover records (warehouse ↔ guide)';
COMMENT ON TABLE inventory_audit IS 'Inventory variance audit (auto-created for >10% variance)';
COMMENT ON COLUMN inventory_handovers.handover_type IS 'Type: outbound (warehouse → guide), inbound (guide → warehouse)';
COMMENT ON COLUMN inventory_handovers.items IS 'JSONB array: [{item_id, name, quantity, unit, condition, photo_url, expected_quantity?}]';
COMMENT ON FUNCTION calculate_inventory_variance IS 'Calculate variance and flag if >10%';
