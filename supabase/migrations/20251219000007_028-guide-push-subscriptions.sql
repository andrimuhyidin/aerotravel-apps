-- Migration: 028-guide-push-subscriptions.sql
-- Description: Web Push subscriptions table
-- Created: 2025-12-19

BEGIN;

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Push Subscription
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, endpoint)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_push_subscriptions_guide_id ON guide_push_subscriptions(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_push_subscriptions_active ON guide_push_subscriptions(guide_id, is_active) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Guide can manage own subscriptions
CREATE POLICY "guide_push_subscriptions_own" ON guide_push_subscriptions
  FOR ALL
  USING (guide_id = auth.uid());

COMMIT;

