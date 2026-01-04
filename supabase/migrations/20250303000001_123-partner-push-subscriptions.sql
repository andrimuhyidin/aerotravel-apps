-- Migration: 123-partner-push-subscriptions.sql
-- Description: Web Push subscriptions table for partner portal
-- Created: 2025-03-03

BEGIN;

-- ============================================
-- PARTNER PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS partner_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Push Subscription
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  -- Device Info
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_push_subscriptions_user_id ON partner_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_push_subscriptions_partner_id ON partner_push_subscriptions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_push_subscriptions_active ON partner_push_subscriptions(user_id, is_active) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE partner_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "partner_push_subscriptions_own" ON partner_push_subscriptions
  FOR ALL
  USING (user_id = auth.uid());

-- Partner admins can view all subscriptions for their partner
CREATE POLICY "partner_push_subscriptions_admin" ON partner_push_subscriptions
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'mitra'
    )
  );

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_partner_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_push_subscriptions_updated_at ON partner_push_subscriptions;
CREATE TRIGGER trigger_update_partner_push_subscriptions_updated_at
  BEFORE UPDATE ON partner_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_push_subscriptions_updated_at();

COMMIT;

