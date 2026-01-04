-- Migration: 047-trip-briefings.sql
-- Description: Add briefing points storage untuk trips
-- Created: 2025-01-22

-- Add briefing_points column ke trips table (JSONB untuk flexibility)
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS briefing_points JSONB;

-- Add columns untuk tracking briefing generation
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS briefing_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS briefing_generated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS briefing_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS briefing_updated_by UUID REFERENCES users(id);

-- Add index untuk query trips dengan briefing
CREATE INDEX IF NOT EXISTS idx_trips_briefing_generated_at 
ON trips(briefing_generated_at) 
WHERE briefing_points IS NOT NULL;

-- Add comment
COMMENT ON COLUMN trips.briefing_points IS 'AI-generated briefing points dalam format JSON: {sections: [...], estimatedDuration: number, targetAudience: string, summary: string}';
