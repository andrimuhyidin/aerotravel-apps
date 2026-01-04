-- Migration: Add liability waiver columns to bookings table
-- Purpose: Track digital waiver signatures for legal compliance
-- Related: PRD Customer Portal - Liability Waiver

-- Add waiver columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS waiver_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waiver_signature_url TEXT,
ADD COLUMN IF NOT EXISTS waiver_signer_ip INET,
ADD COLUMN IF NOT EXISTS waiver_signer_user_agent TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bookings.waiver_signed_at IS 'Timestamp when customer signed the liability waiver';
COMMENT ON COLUMN bookings.waiver_signature_url IS 'URL to signature image stored in Supabase Storage';
COMMENT ON COLUMN bookings.waiver_signer_ip IS 'IP address of signer for legal audit trail';
COMMENT ON COLUMN bookings.waiver_signer_user_agent IS 'Browser user agent for legal audit trail';

-- Create index for querying unsigned waivers
CREATE INDEX IF NOT EXISTS idx_bookings_waiver_unsigned 
ON bookings (trip_date, status) 
WHERE waiver_signed_at IS NULL;

-- Create audit log trigger for waiver changes
CREATE OR REPLACE FUNCTION log_waiver_signature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.waiver_signed_at IS NOT NULL AND OLD.waiver_signed_at IS NULL THEN
    INSERT INTO audit_logs (
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      user_id,
      created_at
    ) VALUES (
      'waiver_signed',
      'bookings',
      NEW.id,
      NULL,
      jsonb_build_object(
        'waiver_signed_at', NEW.waiver_signed_at,
        'waiver_signer_ip', NEW.waiver_signer_ip::text
      ),
      NEW.user_id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_waiver_signature ON bookings;
CREATE TRIGGER trigger_log_waiver_signature
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_waiver_signature();

