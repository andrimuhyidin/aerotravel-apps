-- ============================================
-- Compliance Tables Verification Script
-- Run this to verify all required tables exist
-- ============================================

-- Check for required tables
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  -- Safety & Risk Management
  'sos_alerts',
  'pre_trip_assessments', 
  'incident_reports',
  'safety_briefings',
  'safety_checklists',
  
  -- Environmental & Sustainability
  'waste_logs',
  'waste_log_photos',
  'trip_fuel_logs',
  'sustainability_goals',
  
  -- Passenger & Consent
  'passenger_consents',
  'booking_passengers',
  
  -- Crew & Certifications
  'guide_certifications_tracker',
  'crew_certifications',
  
  -- Training
  'training_sessions',
  'training_attendance',
  'mandatory_trainings',
  'guide_mandatory_training_assignments',
  
  -- Tracking
  'gps_pings',
  'guide_locations',
  
  -- Insurance
  'insurance_manifests',
  'insurance_companies'
)
ORDER BY table_name;

-- Check for missing tables
SELECT 'Missing tables:' as info;
SELECT unnest(ARRAY[
  'sos_alerts',
  'pre_trip_assessments', 
  'incident_reports',
  'safety_briefings',
  'waste_logs',
  'trip_fuel_logs',
  'sustainability_goals',
  'passenger_consents',
  'guide_certifications_tracker',
  'training_sessions',
  'mandatory_trainings',
  'gps_pings',
  'insurance_manifests'
]) as required_table
EXCEPT
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

