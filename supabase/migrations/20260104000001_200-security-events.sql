-- Migration: 200-security-events.sql
-- Description: Security event monitoring for ISO 27001 compliance
-- Created: 2026-01-04

-- ============================================
-- SECURITY EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- 'failed_login', 'rate_limit_exceeded', 'suspicious_activity', 'unauthorized_access', 'brute_force_detected'
  email VARCHAR(255),
  user_id UUID REFERENCES users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_security_events_email ON security_events(email);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view security events
CREATE POLICY "Super admins can view all security events"
  ON security_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- System can insert security events (no user context needed)
CREATE POLICY "Allow system to insert security events"
  ON security_events
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTION: Check for brute force attacks
-- ============================================
CREATE OR REPLACE FUNCTION check_brute_force_attack(
  p_email VARCHAR,
  p_ip_address VARCHAR,
  p_time_window_minutes INTEGER DEFAULT 5,
  p_threshold INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  v_failed_attempts INTEGER;
BEGIN
  -- Count failed login attempts in the time window
  SELECT COUNT(*)
  INTO v_failed_attempts
  FROM security_events
  WHERE event_type = 'failed_login'
    AND (email = p_email OR ip_address = p_ip_address)
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  RETURN v_failed_attempts >= p_threshold;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get security event summary
-- ============================================
CREATE OR REPLACE FUNCTION get_security_event_summary(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  event_type VARCHAR,
  event_count BIGINT,
  unique_ips BIGINT,
  unique_emails BIGINT,
  severity VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT se.ip_address) as unique_ips,
    COUNT(DISTINCT se.email) as unique_emails,
    se.severity
  FROM security_events se
  WHERE se.created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY se.event_type, se.severity
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE security_events IS 'Security event monitoring for ISO 27001 compliance';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event: failed_login, rate_limit_exceeded, suspicious_activity, unauthorized_access, brute_force_detected';
COMMENT ON COLUMN security_events.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON FUNCTION check_brute_force_attack IS 'Check if there are too many failed login attempts in a time window';
COMMENT ON FUNCTION get_security_event_summary IS 'Get summary of security events for the past N days';

