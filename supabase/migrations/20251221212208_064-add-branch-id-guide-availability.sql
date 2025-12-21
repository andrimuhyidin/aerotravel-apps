-- Migration: 064-add-branch-id-guide-availability.sql
-- Description: Verify and add branch_id to guide_availability table if not exists
-- Created: 2025-12-21
-- Reference: Complete Guide Profile Edit Implementation Plan

BEGIN;

-- Check if branch_id exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guide_availability' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE guide_availability
    ADD COLUMN branch_id UUID REFERENCES branches(id);
    
    CREATE INDEX IF NOT EXISTS idx_guide_availability_branch_id 
    ON guide_availability(branch_id);
    
    COMMENT ON COLUMN guide_availability.branch_id IS 'Branch ID for multi-branch availability support';
  END IF;
END $$;

COMMIT;

