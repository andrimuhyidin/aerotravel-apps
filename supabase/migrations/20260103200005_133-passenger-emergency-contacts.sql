-- Migration: 133-passenger-emergency-contacts.sql
-- Description: Passenger Emergency Contacts for Duty of Care & ISO 31030
-- Created: 2025-03-03
-- Standards: Duty of Care Policy, ISO 31030 TRM

-- ============================================
-- PASSENGER EMERGENCY CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS passenger_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES booking_passengers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Contact Info
  contact_name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) NOT NULL, -- 'spouse', 'parent', 'sibling', 'child', 'friend', 'other'
  phone VARCHAR(50) NOT NULL,
  phone_secondary VARCHAR(50),
  email VARCHAR(255),
  
  -- Address (optional)
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Indonesia',
  
  -- Notification Preferences
  notify_on_emergency BOOLEAN DEFAULT true,
  notify_on_delay BOOLEAN DEFAULT false,
  notify_on_incident BOOLEAN DEFAULT true,
  preferred_contact_method VARCHAR(20) DEFAULT 'phone', -- 'phone', 'whatsapp', 'sms', 'email'
  preferred_language VARCHAR(10) DEFAULT 'id', -- 'id', 'en'
  
  -- Priority
  priority INTEGER DEFAULT 1, -- 1 = primary, 2 = secondary, etc.
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_relationship CHECK (relationship IN ('spouse', 'parent', 'sibling', 'child', 'friend', 'colleague', 'other')),
  CONSTRAINT valid_contact_method CHECK (preferred_contact_method IN ('phone', 'whatsapp', 'sms', 'email'))
);

-- ============================================
-- PASSENGER MEDICAL INFO TABLE
-- For emergency response
-- ============================================
CREATE TABLE IF NOT EXISTS passenger_medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES booking_passengers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Medical Conditions
  has_medical_conditions BOOLEAN DEFAULT false,
  medical_conditions TEXT[], -- ['diabetes', 'hypertension', 'asthma']
  medical_notes TEXT,
  
  -- Allergies
  has_allergies BOOLEAN DEFAULT false,
  allergies TEXT[], -- ['peanuts', 'shellfish', 'penicillin']
  allergy_severity VARCHAR(20), -- 'mild', 'moderate', 'severe', 'anaphylactic'
  
  -- Medications
  current_medications TEXT[],
  medication_notes TEXT,
  
  -- Blood Type
  blood_type VARCHAR(10), -- 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  
  -- Insurance
  insurance_company VARCHAR(255),
  insurance_policy_number VARCHAR(100),
  insurance_phone VARCHAR(50),
  
  -- Special Needs
  mobility_assistance BOOLEAN DEFAULT false,
  dietary_restrictions TEXT[],
  special_needs_notes TEXT,
  
  -- Consent
  consent_share_emergency BOOLEAN DEFAULT true,
  consent_given_at TIMESTAMPTZ,
  consent_given_by VARCHAR(255),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(passenger_id, booking_id),
  CONSTRAINT valid_allergy_severity CHECK (allergy_severity IS NULL OR allergy_severity IN ('mild', 'moderate', 'severe', 'anaphylactic')),
  CONSTRAINT valid_blood_type CHECK (blood_type IS NULL OR blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
);

-- ============================================
-- EMERGENCY NOTIFICATIONS LOG TABLE
-- Track all emergency notifications sent
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Reference
  reference_type VARCHAR(50) NOT NULL, -- 'sos_alert', 'incident_report', 'crisis_event', 'trip_delay'
  reference_id UUID NOT NULL,
  
  -- Recipient
  recipient_name VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(50),
  recipient_email VARCHAR(255),
  relationship VARCHAR(100),
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'sms', 'email', 'phone_call'
  message_template VARCHAR(100),
  message_content TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'acknowledged'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Sent By
  sent_by UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_reference_type CHECK (reference_type IN ('sos_alert', 'incident_report', 'crisis_event', 'trip_delay', 'weather_warning')),
  CONSTRAINT valid_notification_type CHECK (notification_type IN ('whatsapp', 'sms', 'email', 'phone_call')),
  CONSTRAINT valid_notification_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'acknowledged'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_passenger_emergency_contacts_passenger_id ON passenger_emergency_contacts(passenger_id);
CREATE INDEX IF NOT EXISTS idx_passenger_emergency_contacts_booking_id ON passenger_emergency_contacts(booking_id);
CREATE INDEX IF NOT EXISTS idx_passenger_emergency_contacts_priority ON passenger_emergency_contacts(priority);
CREATE INDEX IF NOT EXISTS idx_passenger_emergency_contacts_active ON passenger_emergency_contacts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_passenger_medical_info_passenger_id ON passenger_medical_info(passenger_id);
CREATE INDEX IF NOT EXISTS idx_passenger_medical_info_booking_id ON passenger_medical_info(booking_id);

CREATE INDEX IF NOT EXISTS idx_emergency_notifications_log_reference ON emergency_notifications_log(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_log_status ON emergency_notifications_log(status);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_log_sent_at ON emergency_notifications_log(sent_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE passenger_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_notifications_log ENABLE ROW LEVEL SECURITY;

-- Emergency Contacts: Passenger can manage own, admins/guides can view for their trips
CREATE POLICY "Passengers can manage own emergency contacts"
  ON passenger_emergency_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM booking_passengers bp
      JOIN bookings b ON bp.booking_id = b.id
      WHERE bp.id = passenger_emergency_contacts.passenger_id
        AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY "Guides can view trip passenger emergency contacts"
  ON passenger_emergency_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM booking_passengers bp
      JOIN bookings b ON bp.booking_id = b.id
      JOIN trips t ON t.booking_id = b.id
      JOIN trip_guides tg ON tg.trip_id = t.id
      WHERE bp.id = passenger_emergency_contacts.passenger_id
        AND tg.guide_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all emergency contacts"
  ON passenger_emergency_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Medical Info: Similar to emergency contacts but more restricted
CREATE POLICY "Passengers can manage own medical info"
  ON passenger_medical_info
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM booking_passengers bp
      JOIN bookings b ON bp.booking_id = b.id
      WHERE bp.id = passenger_medical_info.passenger_id
        AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY "Guides can view medical info with consent"
  ON passenger_medical_info
  FOR SELECT
  USING (
    consent_share_emergency = true
    AND EXISTS (
      SELECT 1 FROM booking_passengers bp
      JOIN bookings b ON bp.booking_id = b.id
      JOIN trips t ON t.booking_id = b.id
      JOIN trip_guides tg ON tg.trip_id = t.id
      WHERE bp.id = passenger_medical_info.passenger_id
        AND tg.guide_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view medical info with consent"
  ON passenger_medical_info
  FOR SELECT
  USING (
    consent_share_emergency = true
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Emergency Notifications Log: Admins only
CREATE POLICY "Admins can manage emergency notifications log"
  ON emergency_notifications_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get all emergency contacts for a trip
CREATE OR REPLACE FUNCTION get_trip_emergency_contacts(p_trip_id UUID)
RETURNS TABLE (
  passenger_name VARCHAR,
  contact_name VARCHAR,
  relationship VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  notify_on_emergency BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.name as passenger_name,
    pec.contact_name,
    pec.relationship,
    pec.phone,
    pec.email,
    pec.notify_on_emergency
  FROM booking_passengers bp
  JOIN bookings b ON bp.booking_id = b.id
  JOIN trips t ON t.booking_id = b.id
  LEFT JOIN passenger_emergency_contacts pec ON pec.passenger_id = bp.id
  WHERE t.id = p_trip_id
    AND pec.is_active = true
    AND pec.notify_on_emergency = true
  ORDER BY bp.name, pec.priority;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify all emergency contacts for a trip
CREATE OR REPLACE FUNCTION create_emergency_notification_batch(
  p_reference_type VARCHAR,
  p_reference_id UUID,
  p_trip_id UUID,
  p_message_template VARCHAR,
  p_message_content TEXT,
  p_sent_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_contact RECORD;
BEGIN
  FOR v_contact IN 
    SELECT * FROM get_trip_emergency_contacts(p_trip_id)
    WHERE notify_on_emergency = true
  LOOP
    INSERT INTO emergency_notifications_log (
      reference_type,
      reference_id,
      recipient_name,
      recipient_phone,
      recipient_email,
      relationship,
      notification_type,
      message_template,
      message_content,
      status,
      sent_by
    ) VALUES (
      p_reference_type,
      p_reference_id,
      v_contact.contact_name,
      v_contact.phone,
      v_contact.email,
      v_contact.relationship,
      'whatsapp',
      p_message_template,
      p_message_content,
      'pending',
      p_sent_by
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE passenger_emergency_contacts IS 'Emergency contacts for passengers, compliant with Duty of Care and ISO 31030';
COMMENT ON TABLE passenger_medical_info IS 'Medical information for emergency response (with consent management)';
COMMENT ON TABLE emergency_notifications_log IS 'Log of all emergency notifications sent to contacts';
COMMENT ON COLUMN passenger_medical_info.consent_share_emergency IS 'Whether passenger consents to sharing medical info in emergencies';

