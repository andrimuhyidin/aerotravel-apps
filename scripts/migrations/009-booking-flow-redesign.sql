/**
 * Migration: Booking Flow Redesign
 * 
 * Creates tables for:
 * - booking_drafts (auto-save functionality)
 * - booking_analytics (conversion tracking)
 * - customer_booking_history (auto-fill feature)
 * 
 * Updates:
 * - bookings table (add tracking columns)
 * - packages table (add urgency data)
 */

-- =====================================================
-- 1. CREATE: booking_drafts table
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  trip_date DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  adult_pax INTEGER,
  child_pax INTEGER DEFAULT 0,
  infant_pax INTEGER DEFAULT 0,
  special_requests TEXT,
  form_data JSONB, -- Complete form state for recovery
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_booking_drafts_partner ON booking_drafts(partner_id);
CREATE INDEX idx_booking_drafts_expires ON booking_drafts(expires_at);
CREATE INDEX idx_booking_drafts_package ON booking_drafts(package_id);

-- RLS Policies
ALTER TABLE booking_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own drafts"
  ON booking_drafts FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can create own drafts"
  ON booking_drafts FOR INSERT
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can update own drafts"
  ON booking_drafts FOR UPDATE
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can delete own drafts"
  ON booking_drafts FOR DELETE
  USING (partner_id = auth.uid());

-- =====================================================
-- 2. CREATE: booking_analytics table
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  draft_id UUID REFERENCES booking_drafts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'started', 'step_completed', 'abandoned', 'completed'
  step_name TEXT, -- 'package_selection', 'customer_details', 'review'
  time_spent_seconds INTEGER,
  metadata JSONB, -- device info, errors, user agent, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_booking_analytics_partner ON booking_analytics(partner_id);
CREATE INDEX idx_booking_analytics_event ON booking_analytics(event_type);
CREATE INDEX idx_booking_analytics_created ON booking_analytics(created_at DESC);
CREATE INDEX idx_booking_analytics_booking ON booking_analytics(booking_id);

-- RLS Policies
ALTER TABLE booking_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own analytics"
  ON booking_analytics FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can create own analytics"
  ON booking_analytics FOR INSERT
  WITH CHECK (partner_id = auth.uid());

-- =====================================================
-- 3. CREATE: customer_booking_history table
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_booking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  booking_count INTEGER DEFAULT 1,
  last_booking_date DATE,
  avg_pax_count DECIMAL(5,2),
  preferred_package_types TEXT[], -- ['beach', 'mountain', 'cultural']
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, customer_phone)
);

-- Indexes for fast customer search
CREATE INDEX idx_customer_history_partner_phone ON customer_booking_history(partner_id, customer_phone);
CREATE INDEX idx_customer_history_phone ON customer_booking_history(customer_phone);
CREATE INDEX idx_customer_history_partner ON customer_booking_history(partner_id);

-- RLS Policies
ALTER TABLE customer_booking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own customer history"
  ON customer_booking_history FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can manage own customer history"
  ON customer_booking_history FOR ALL
  USING (partner_id = auth.uid());

-- =====================================================
-- 4. ALTER: bookings table (add tracking columns)
-- =====================================================
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS conversion_source TEXT, -- 'fast_booking', 'package_detail', 'draft_resume'
  ADD COLUMN IF NOT EXISTS time_to_complete_seconds INTEGER, -- time from start to submit
  ADD COLUMN IF NOT EXISTS draft_id UUID REFERENCES booking_drafts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_conversion_source ON bookings(conversion_source);
CREATE INDEX IF NOT EXISTS idx_bookings_draft_id ON bookings(draft_id);

-- =====================================================
-- 5. ALTER: packages table (add urgency data)
-- =====================================================
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS booking_count_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_booked_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_packages_booking_count ON packages(booking_count_today DESC);
CREATE INDEX IF NOT EXISTS idx_packages_last_booked ON packages(last_booked_at DESC);

-- =====================================================
-- 6. CREATE: Function to auto-update customer history
-- =====================================================
CREATE OR REPLACE FUNCTION update_customer_booking_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update on INSERT or UPDATE to 'confirmed'/'completed' status
  IF (TG_OP = 'INSERT' AND NEW.status IN ('confirmed', 'completed', 'paid')) OR
     (TG_OP = 'UPDATE' AND NEW.status IN ('confirmed', 'completed', 'paid') AND OLD.status != NEW.status) THEN
    
    -- Upsert customer history
    INSERT INTO customer_booking_history (
      partner_id,
      customer_phone,
      customer_name,
      customer_email,
      booking_count,
      last_booking_date,
      avg_pax_count,
      updated_at
    ) VALUES (
      NEW.mitra_id,
      NEW.customer_phone,
      NEW.customer_name,
      NEW.customer_email,
      1,
      NEW.trip_date,
      (NEW.adult_pax + NEW.child_pax)::DECIMAL,
      NOW()
    )
    ON CONFLICT (partner_id, customer_phone)
    DO UPDATE SET
      customer_name = COALESCE(EXCLUDED.customer_name, customer_booking_history.customer_name),
      customer_email = COALESCE(EXCLUDED.customer_email, customer_booking_history.customer_email),
      booking_count = customer_booking_history.booking_count + 1,
      last_booking_date = EXCLUDED.last_booking_date,
      avg_pax_count = (
        (customer_booking_history.avg_pax_count * customer_booking_history.booking_count + EXCLUDED.avg_pax_count)
        / (customer_booking_history.booking_count + 1)
      ),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_customer_history ON bookings;
CREATE TRIGGER trigger_update_customer_history
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_booking_history();

-- =====================================================
-- 7. CREATE: Function to update package booking count
-- =====================================================
CREATE OR REPLACE FUNCTION update_package_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status IN ('confirmed', 'completed', 'paid')) OR
     (TG_OP = 'UPDATE' AND NEW.status IN ('confirmed', 'completed', 'paid') AND OLD.status != NEW.status) THEN
    
    UPDATE packages
    SET 
      booking_count_today = booking_count_today + 1,
      last_booked_at = NOW()
    WHERE id = NEW.package_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_package_count ON bookings;
CREATE TRIGGER trigger_update_package_count
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_package_booking_count();

-- =====================================================
-- 8. CREATE: Function to cleanup expired drafts
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM booking_drafts
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. CREATE: Function to reset daily booking counts
-- =====================================================
CREATE OR REPLACE FUNCTION reset_daily_booking_counts()
RETURNS void AS $$
BEGIN
  UPDATE packages
  SET booking_count_today = 0
  WHERE booking_count_today > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE booking_drafts IS 'Auto-saved booking drafts for conversion optimization';
COMMENT ON TABLE booking_analytics IS 'Booking flow analytics for conversion tracking';
COMMENT ON TABLE customer_booking_history IS 'Customer history for smart auto-fill';
COMMENT ON COLUMN bookings.conversion_source IS 'Source of booking creation for analytics';
COMMENT ON COLUMN bookings.time_to_complete_seconds IS 'Time taken to complete booking';
COMMENT ON COLUMN packages.booking_count_today IS 'Number of bookings today (urgency signal)';
COMMENT ON COLUMN packages.last_booked_at IS 'Last booking timestamp';

-- =====================================================
-- GRANTS (if needed for specific roles)
-- =====================================================
-- Grant access to authenticated users (handled by RLS)

