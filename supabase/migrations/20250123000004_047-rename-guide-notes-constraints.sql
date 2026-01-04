-- Migration: 047-rename-guide-notes-constraints.sql
-- Description: Rename foreign key constraints for guide_notes table
-- Created: 2025-01-23

BEGIN;

-- Rename foreign key constraints
ALTER TABLE guide_notes 
  RENAME CONSTRAINT crew_notes_created_by_fkey TO guide_notes_created_by_fkey;

ALTER TABLE guide_notes 
  RENAME CONSTRAINT crew_notes_parent_note_id_fkey TO guide_notes_parent_note_id_fkey;

ALTER TABLE guide_notes 
  RENAME CONSTRAINT crew_notes_trip_id_fkey TO guide_notes_trip_id_fkey;

ALTER TABLE guide_notes 
  RENAME CONSTRAINT crew_notes_branch_id_fkey TO guide_notes_branch_id_fkey;

COMMIT;
