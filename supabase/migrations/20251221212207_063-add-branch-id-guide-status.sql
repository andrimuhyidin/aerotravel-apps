-- Migration: 063-add-branch-id-guide-status.sql
-- Description: Verify and add branch_id to guide_status table if not exists
-- Created: 2025-12-21
-- Reference: Complete Guide Profile Edit Implementation Plan

BEGIN;

-- Check if branch_id exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guide_status' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE guide_status
    ADD COLUMN branch_id UUID REFERENCES branches(id);
    
    CREATE INDEX IF NOT EXISTS idx_guide_status_branch_id 
    ON guide_status(branch_id);
    
    COMMENT ON COLUMN guide_status.branch_id IS 'Branch ID for multi-branch support';
  END IF;
END $$;

COMMIT;

