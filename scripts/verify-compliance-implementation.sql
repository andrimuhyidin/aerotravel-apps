-- Verification Script for Compliance Tables
-- Run this in Supabase SQL Editor

SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  -- Phase 0: Foundation
  'incident_reports',
  
  -- Phase 1: Safety & Risk Management
  'destination_risk_profiles',
  'destination_risk_history',
  'trip_destination_risks',
  'chse_checklist_templates',
  'chse_daily_logs',
  'sanitization_records',
  'chse_certificates',
  'crisis_communication_plans',
  'crisis_events',
  'crisis_event_updates',
  'crisis_drill_records',
  
  -- Phase 2: Emergency Response
  'passenger_emergency_contacts',
  'passenger_medical_info',
  'emergency_notifications_log',
  'travel_advisories',
  'advisory_acknowledgments',
  'weather_cache',
  'incident_follow_ups',
  'incident_injuries',
  'incident_insurance_claims',
  
  -- Phase 3: Environmental & Sustainability
  'sustainability_metrics_monthly',
  'sustainability_initiatives',
  'sustainability_certifications',
  'local_employment_metrics',
  'community_contributions',
  'local_suppliers',
  'community_feedback',
  'marine_protection_zones',
  'trip_zone_compliance',
  'zone_violation_reports',
  'marine_wildlife_sightings',
  'water_usage_logs',
  'water_tanks',
  'water_tank_logs',
  
  -- Phase 4: Training & Competency
  'trm_training_modules',
  'trm_quiz_questions',
  'trm_training_completions',
  'trm_competency_assessments',
  'trm_performance_metrics',
  'trm_kpi_targets',
  'trm_improvement_actions',
  
  -- Phase 5: Documentation & Audit
  'compliance_audit_logs',
  'compliance_checklists',
  'compliance_checklist_assessments',
  'compliance_status_tracker'
)
ORDER BY table_name;

-- Count total tables
SELECT COUNT(*) as total_compliance_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'incident_reports', 'destination_risk_profiles', 'destination_risk_history', 
  'trip_destination_risks', 'chse_checklist_templates', 'chse_daily_logs', 
  'sanitization_records', 'chse_certificates', 'crisis_communication_plans', 
  'crisis_events', 'crisis_event_updates', 'crisis_drill_records',
  'passenger_emergency_contacts', 'passenger_medical_info', 'emergency_notifications_log',
  'travel_advisories', 'advisory_acknowledgments', 'weather_cache',
  'incident_follow_ups', 'incident_injuries', 'incident_insurance_claims',
  'sustainability_metrics_monthly', 'sustainability_initiatives', 'sustainability_certifications',
  'local_employment_metrics', 'community_contributions', 'local_suppliers', 'community_feedback',
  'marine_protection_zones', 'trip_zone_compliance', 'zone_violation_reports', 'marine_wildlife_sightings',
  'water_usage_logs', 'water_tanks', 'water_tank_logs',
  'trm_training_modules', 'trm_quiz_questions', 'trm_training_completions', 'trm_competency_assessments',
  'trm_performance_metrics', 'trm_kpi_targets', 'trm_improvement_actions',
  'compliance_audit_logs', 'compliance_checklists', 'compliance_checklist_assessments', 'compliance_status_tracker'
);

-- Check compliance-related functions
SELECT 
  routine_name,
  routine_type,
  '✅ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'generate_incident_report_number',
  'calculate_risk_score',
  'get_current_seasonal_risk',
  'calculate_destination_risk_score',
  'calculate_chse_score',
  'get_trip_emergency_contacts',
  'create_emergency_notification_batch',
  'get_location_advisories',
  'is_weather_cache_valid',
  'get_incident_summary',
  'calculate_monthly_sustainability_metrics',
  'get_community_impact_summary',
  'is_point_in_zone',
  'get_nearby_zones',
  'get_trip_water_summary',
  'check_user_training_compliance',
  'calculate_branch_training_compliance',
  'calculate_trm_metrics',
  'get_compliance_dashboard'
)
ORDER BY routine_name;

