-- ============================================
-- FIX: Add missing check_guide_certifications_valid function
-- ============================================

-- Function to check if guide has all required valid certifications
CREATE OR REPLACE FUNCTION check_guide_certifications_valid(guide_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expired_count INT;
  required_certs TEXT[] := ARRAY['first_aid', 'diving_license', 'tour_guide_license'];
  has_all_required BOOLEAN;
BEGIN
  -- Check if guide has any expired certifications
  SELECT COUNT(*) INTO expired_count
  FROM guide_certifications_tracker
  WHERE guide_id = guide_uuid
    AND expiry_date < CURRENT_DATE
    AND status = 'active';
  
  -- Check if guide has all required certifications
  SELECT 
    COUNT(DISTINCT certification_type) >= array_length(required_certs, 1)
  INTO has_all_required
  FROM guide_certifications_tracker
  WHERE guide_id = guide_uuid
    AND certification_type = ANY(required_certs)
    AND expiry_date >= CURRENT_DATE
    AND status = 'active';
  
  -- Return true only if no expired certs AND has all required certs
  RETURN (expired_count = 0 AND COALESCE(has_all_required, false));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_guide_certifications_valid(UUID) TO authenticated;

COMMENT ON FUNCTION check_guide_certifications_valid IS 'Check if guide has all required valid (non-expired) certifications';

