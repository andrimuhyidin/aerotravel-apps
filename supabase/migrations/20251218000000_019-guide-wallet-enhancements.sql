-- Migration: 019-guide-wallet-enhancements.sql
-- Description: Savings goals, milestones, and wallet enhancements

-- ============================================
-- SAVINGS GOALS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Goal Info
  name VARCHAR(255) NOT NULL, -- e.g., "Liburan ke Bali"
  target_amount DECIMAL(14,2) NOT NULL,
  current_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- Auto-save settings
  auto_save_percent DECIMAL(5,2) DEFAULT 0, -- 0-100, percentage of each earning to auto-save
  auto_save_enabled BOOLEAN DEFAULT false,
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, name)
);

-- ============================================
-- MILESTONES & ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_wallet_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Milestone Info
  milestone_type VARCHAR(50) NOT NULL, -- 'first_million', 'five_million', 'ten_million', 'perfect_month', etc.
  milestone_name VARCHAR(255) NOT NULL,
  milestone_description TEXT,
  
  -- Achievement Data
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  achievement_data JSONB, -- Additional data (e.g., balance at milestone, trip count, etc.)
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, milestone_type)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_savings_goals_guide_id ON guide_savings_goals(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_savings_goals_completed ON guide_savings_goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_guide_wallet_milestones_guide_id ON guide_wallet_milestones(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_wallet_milestones_type ON guide_wallet_milestones(milestone_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_wallet_milestones ENABLE ROW LEVEL SECURITY;

-- Guide can see own savings goals
CREATE POLICY "guide_savings_goals_own" ON guide_savings_goals
  FOR ALL
  USING (guide_id = auth.uid());

-- Guide can see own milestones
CREATE POLICY "guide_wallet_milestones_own" ON guide_wallet_milestones
  FOR ALL
  USING (guide_id = auth.uid());

-- Staff can see all (for analytics)
CREATE POLICY "guide_savings_goals_staff" ON guide_savings_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

CREATE POLICY "guide_wallet_milestones_staff" ON guide_wallet_milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check and create milestones
CREATE OR REPLACE FUNCTION check_wallet_milestones(p_guide_id UUID, p_balance DECIMAL)
RETURNS TABLE(milestone_type VARCHAR, milestone_name VARCHAR) AS $$
DECLARE
  v_milestones TEXT[] := ARRAY[
    'first_million:First Million:Rp 1,000,000',
    'five_million:Five Million Club:Rp 5,000,000',
    'ten_million:Ten Million Master:Rp 10,000,000',
    'twenty_million:Twenty Million Elite:Rp 20,000,000',
    'fifty_million:Fifty Million Legend:Rp 50,000,000'
  ];
  v_milestone TEXT;
  v_parts TEXT[];
  v_type VARCHAR;
  v_name VARCHAR;
  v_threshold DECIMAL;
BEGIN
  FOREACH v_milestone IN ARRAY v_milestones
  LOOP
    v_parts := string_to_array(v_milestone, ':');
    v_type := v_parts[1];
    v_name := v_parts[2];
    v_threshold := REPLACE(REPLACE(v_parts[3], 'Rp ', ''), ',', '')::DECIMAL;
    
    -- Check if milestone not yet achieved and balance reached threshold
    IF NOT EXISTS (
      SELECT 1 FROM guide_wallet_milestones
      WHERE guide_id = p_guide_id AND milestone_type = v_type
    ) AND p_balance >= v_threshold THEN
      -- Insert milestone
      INSERT INTO guide_wallet_milestones (guide_id, milestone_type, milestone_name, milestone_description, achievement_data)
      VALUES (
        p_guide_id,
        v_type,
        v_name,
        'Achieved balance milestone of ' || v_parts[3],
        jsonb_build_object('balance', p_balance, 'threshold', v_threshold)
      )
      ON CONFLICT (guide_id, milestone_type) DO NOTHING;
      
      RETURN QUERY SELECT v_type::VARCHAR, v_name::VARCHAR;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

