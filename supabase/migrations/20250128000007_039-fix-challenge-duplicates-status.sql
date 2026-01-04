-- Migration: 039-fix-challenge-duplicates-status.sql
-- Description: Fix duplicate challenges and normalize status values
-- Created: 2025-01-28

BEGIN;

DO $$
DECLARE
  duplicate_rec RECORD;
  challenge_to_keep UUID;
BEGIN
  -- ============================================
  -- PART 1: Fix status values ('in_progress' -> 'active', 'achieved' -> 'completed')
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_challenges') THEN
    -- Update 'in_progress' to 'active'
    UPDATE guide_challenges
    SET status = 'active', updated_at = NOW()
    WHERE status = 'in_progress';
    
    -- Update 'achieved' to 'completed' (if current_value >= target_value)
    UPDATE guide_challenges
    SET 
      status = 'completed',
      completed_at = COALESCE(completed_at, NOW()),
      updated_at = NOW()
    WHERE status = 'achieved'
    AND current_value >= target_value;
    
    -- Update 'achieved' to 'active' (if current_value < target_value)
    UPDATE guide_challenges
    SET status = 'active', updated_at = NOW()
    WHERE status = 'achieved'
    AND current_value < target_value;
    
    RAISE NOTICE 'Updated challenge status values';
  END IF;

  -- ============================================
  -- PART 2: Remove duplicate challenges
  -- Keep the most recent one (highest created_at) for each (guide_id, challenge_type, title) combination
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_challenges') THEN
    -- Find and delete duplicates, keeping only the most recent one
    FOR duplicate_rec IN
      SELECT 
        guide_id,
        challenge_type,
        title,
        COUNT(*) as duplicate_count,
        MAX(created_at) as latest_created_at
      FROM guide_challenges
      WHERE status IN ('active', 'completed')
      GROUP BY guide_id, challenge_type, title
      HAVING COUNT(*) > 1
    LOOP
      -- Keep the challenge with the latest created_at
      SELECT id INTO challenge_to_keep
      FROM guide_challenges
      WHERE guide_id = duplicate_rec.guide_id
      AND challenge_type = duplicate_rec.challenge_type
      AND title = duplicate_rec.title
      AND status IN ('active', 'completed')
      ORDER BY created_at DESC, id DESC
      LIMIT 1;
      
      -- Delete all other duplicates
      IF challenge_to_keep IS NOT NULL THEN
        DELETE FROM guide_challenges
        WHERE guide_id = duplicate_rec.guide_id
        AND challenge_type = duplicate_rec.challenge_type
        AND title = duplicate_rec.title
        AND status IN ('active', 'completed')
        AND id != challenge_to_keep;
        
        RAISE NOTICE 'Removed % duplicate challenges for guide_id=%, type=%, title=%', 
          duplicate_rec.duplicate_count - 1, 
          duplicate_rec.guide_id, 
          duplicate_rec.challenge_type, 
          duplicate_rec.title;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Cleaned up duplicate challenges';
  END IF;

  -- ============================================
  -- PART 3: Add unique constraint to prevent future duplicates
  -- Only if constraint doesn't exist
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_challenges') THEN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'guide_challenges'::regclass
      AND conname = 'guide_challenges_unique_active'
    ) THEN
      -- Create partial unique index for active challenges only
      -- This allows multiple completed challenges but prevents duplicate active ones
      CREATE UNIQUE INDEX IF NOT EXISTS guide_challenges_unique_active
      ON guide_challenges (guide_id, challenge_type, title)
      WHERE status IN ('active', 'paused');
      
      RAISE NOTICE 'Created unique constraint for active challenges';
    END IF;
  END IF;

END $$;

COMMIT;

