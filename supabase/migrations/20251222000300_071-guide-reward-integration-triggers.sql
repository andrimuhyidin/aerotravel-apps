-- Migration: 071-guide-reward-integration-triggers.sql
-- Description: Create database triggers for auto-reward on challenge completion and wallet milestone
-- Created: 2025-12-22
-- Reference: Guide Reward System Comprehensive Implementation

BEGIN;

-- ============================================
-- TRIGGER: Auto-reward on Challenge Completion
-- ============================================

-- Function to award points when challenge is completed
CREATE OR REPLACE FUNCTION auto_reward_challenge_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_points INTEGER;
BEGIN
  -- Only process if challenge status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate points based on challenge type
    CASE NEW.challenge_type
      WHEN 'trip_count' THEN
        v_points := LEAST(500, FLOOR(NEW.target_value / 10) * 100);
      WHEN 'rating' THEN
        v_points := CASE WHEN NEW.target_value >= 5.0 THEN 200 ELSE 100 END;
      WHEN 'earnings' THEN
        v_points := FLOOR(NEW.target_value / 1000);
      WHEN 'perfect_month' THEN
        v_points := 1000;
      ELSE
        v_points := 100; -- Default for custom challenges
    END CASE;

    -- Award points
    PERFORM award_reward_points(
      NEW.guide_id,
      v_points,
      'challenge'::reward_source_type,
      NEW.id,
      'Challenge completed: ' || COALESCE(NEW.title, NEW.challenge_type),
      jsonb_build_object(
        'challenge_id', NEW.id,
        'challenge_type', NEW.challenge_type,
        'target_value', NEW.target_value
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_reward_challenge_completion ON guide_challenges;
CREATE TRIGGER trigger_auto_reward_challenge_completion
  AFTER UPDATE OF status ON guide_challenges
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
  EXECUTE FUNCTION auto_reward_challenge_completion();

-- ============================================
-- TRIGGER: Auto-reward on Wallet Milestone
-- ============================================

-- Function to award points when wallet milestone is achieved
CREATE OR REPLACE FUNCTION auto_reward_wallet_milestone()
RETURNS TRIGGER AS $$
DECLARE
  v_points INTEGER;
  v_milestone_type VARCHAR(50);
BEGIN
  -- Check if milestone was just achieved (new record)
  IF TG_OP = 'INSERT' THEN
    -- Determine milestone type from milestone_name or type
    v_milestone_type := COALESCE(NEW.milestone_type, 
      CASE 
        WHEN NEW.milestone_name ILIKE '%first%million%' OR NEW.milestone_name ILIKE '%1%juta%' THEN 'first_million'
        WHEN NEW.milestone_name ILIKE '%five%million%' OR NEW.milestone_name ILIKE '%5%juta%' THEN 'five_million'
        WHEN NEW.milestone_name ILIKE '%ten%million%' OR NEW.milestone_name ILIKE '%10%juta%' THEN 'ten_million'
        ELSE LOWER(REPLACE(NEW.milestone_type, ' ', '_'))
      END
    );

    -- Calculate points
    CASE v_milestone_type
      WHEN 'first_million' THEN v_points := 500;
      WHEN 'five_million' THEN v_points := 1000;
      WHEN 'ten_million' THEN v_points := 2000;
      ELSE v_points := 0;
    END CASE;

    -- Award points if valid milestone
    IF v_points > 0 THEN
      PERFORM award_reward_points(
        NEW.guide_id,
        v_points,
        'milestone'::reward_source_type,
        NEW.id,
        'Milestone achieved: ' || COALESCE(NEW.milestone_name, v_milestone_type),
        jsonb_build_object(
          'milestone_id', NEW.id,
          'milestone_type', v_milestone_type,
          'milestone_name', NEW.milestone_name
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (only if guide_wallet_milestones table exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'guide_wallet_milestones'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_auto_reward_wallet_milestone ON guide_wallet_milestones;
    CREATE TRIGGER trigger_auto_reward_wallet_milestone
      AFTER INSERT ON guide_wallet_milestones
      FOR EACH ROW
      EXECUTE FUNCTION auto_reward_wallet_milestone();
  END IF;
END $$;

-- ============================================
-- FUNCTION: Process Points Expiration (FIFO)
-- ============================================

-- Function to expire points that are older than 12 months
CREATE OR REPLACE FUNCTION expire_reward_points()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_expired_points INTEGER := 0;
  v_transaction RECORD;
  v_guide_balance RECORD;
BEGIN
  -- Get all points that expired (12 months old)
  FOR v_transaction IN
    SELECT 
      guide_id,
      points,
      id,
      expires_at
    FROM guide_reward_transactions
    WHERE transaction_type = 'earn'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
      AND points > 0
    ORDER BY expires_at ASC, created_at ASC
  LOOP
    -- Get current balance for this guide
    SELECT balance INTO v_guide_balance
    FROM guide_reward_points
    WHERE guide_id = v_transaction.guide_id;

    -- Only expire if guide still has balance
    IF v_guide_balance.balance > 0 THEN
      -- Calculate points to expire (min of transaction points and current balance)
      v_expired_points := LEAST(v_transaction.points, v_guide_balance.balance);

      -- Create expiration transaction
      INSERT INTO guide_reward_transactions (
        guide_id,
        transaction_type,
        points,
        source_type,
        source_id,
        description,
        metadata
      ) VALUES (
        v_transaction.guide_id,
        'expire',
        -v_expired_points,
        'manual',
        v_transaction.id,
        'Points expired (12 months)',
        jsonb_build_object(
          'original_transaction_id', v_transaction.id,
          'expired_at', v_transaction.expires_at
        )
      );

      -- Update balance
      UPDATE guide_reward_points
      SET
        balance = balance - v_expired_points,
        expired_points = expired_points + v_expired_points,
        updated_at = NOW()
      WHERE guide_id = v_transaction.guide_id;

      v_expired_count := v_expired_count + 1;
    END IF;
  END LOOP;

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION auto_reward_challenge_completion IS 'Automatically award points when challenge is completed';
COMMENT ON FUNCTION auto_reward_wallet_milestone IS 'Automatically award points when wallet milestone is achieved';
COMMENT ON FUNCTION expire_reward_points IS 'Expire points that are older than 12 months (FIFO)';

COMMIT;

