-- Migration: 063-risk-assessment-weather-enhancement.sql
-- Description: Enhance risk assessment with weather data integration and updated risk score formula
-- Created: 2025-01-24

-- ============================================
-- ADD WEATHER DATA COLUMN
-- ============================================
ALTER TABLE pre_trip_assessments
ADD COLUMN IF NOT EXISTS weather_data JSONB;

-- ============================================
-- UPDATE RISK SCORE CALCULATION FUNCTION
-- ============================================
-- New formula: (wave_height × 20) + (wind_speed × 10) + (missing_crew × 25) + (missing_equipment × 30)
-- Threshold: > 70 = BLOCK trip

CREATE OR REPLACE FUNCTION calculate_risk_score(
  wave_height_val DECIMAL,
  wind_speed_val DECIMAL,
  weather_condition_val VARCHAR,
  crew_ready_val BOOLEAN,
  equipment_complete_val BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Wave height scoring (wave_height × 20)
  IF wave_height_val IS NOT NULL THEN
    score := score + (wave_height_val * 20)::INTEGER;
  END IF;
  
  -- Wind speed scoring (wind_speed × 10)
  -- Note: wind_speed should be in km/h, if in knots multiply by 1.852
  IF wind_speed_val IS NOT NULL THEN
    score := score + (wind_speed_val * 10)::INTEGER;
  END IF;
  
  -- Missing crew (missing_crew × 25)
  IF NOT crew_ready_val THEN
    score := score + 25;
  END IF;
  
  -- Missing equipment (missing_equipment × 30)
  IF NOT equipment_complete_val THEN
    score := score + 30;
  END IF;
  
  -- Weather condition bonus penalty
  IF weather_condition_val = 'stormy' THEN
    score := score + 20;
  ELSIF weather_condition_val = 'rainy' THEN
    score := score + 10;
  ELSIF weather_condition_val = 'cloudy' THEN
    score := score + 5;
  END IF;
  
  RETURN LEAST(score, 200); -- Cap at 200 for safety
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- UPDATE RISK LEVEL FUNCTION
-- ============================================
-- Updated thresholds based on new formula
CREATE OR REPLACE FUNCTION get_risk_level(score INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  IF score <= 40 THEN
    RETURN 'low';
  ELSIF score <= 70 THEN
    RETURN 'medium';
  ELSIF score <= 100 THEN
    RETURN 'high';
  ELSE
    RETURN 'critical';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- UPDATE CAN_TRIP_START FUNCTION
-- ============================================
-- Block trip if risk_score > 70 (unless admin override)
CREATE OR REPLACE FUNCTION can_trip_start(trip_uuid UUID, guide_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_valid_certs BOOLEAN;
  has_safe_assessment BOOLEAN;
  latest_risk_score INTEGER;
BEGIN
  -- Check certifications
  SELECT check_guide_certifications_valid(guide_uuid) INTO has_valid_certs;
  
  -- Check risk assessment (block if score > 70)
  SELECT 
    COALESCE(
      (
        SELECT is_safe
        FROM pre_trip_assessments
        WHERE trip_id = trip_uuid
          AND guide_id = guide_uuid
        ORDER BY created_at DESC
        LIMIT 1
      ),
      false
    ),
    COALESCE(
      (
        SELECT risk_score
        FROM pre_trip_assessments
        WHERE trip_id = trip_uuid
          AND guide_id = guide_uuid
        ORDER BY created_at DESC
        LIMIT 1
      ),
      0
    )
  INTO has_safe_assessment, latest_risk_score;
  
  -- If risk score > 70, block unless admin approved
  IF latest_risk_score > 70 AND NOT has_safe_assessment THEN
    RETURN false;
  END IF;
  
  RETURN has_valid_certs AND has_safe_assessment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN pre_trip_assessments.weather_data IS 'Cached weather data from OpenWeather API (JSONB)';
COMMENT ON FUNCTION calculate_risk_score IS 'Calculate risk score: (wave_height × 20) + (wind_speed × 10) + (missing_crew × 25) + (missing_equipment × 30). Threshold > 70 = BLOCK trip';

