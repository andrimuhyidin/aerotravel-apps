-- Admin Push Subscriptions Table
-- Stores Web Push subscriptions for admin console users

CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Unique constraint on user + endpoint to prevent duplicates
  CONSTRAINT unique_admin_push_subscription UNIQUE (user_id, endpoint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_push_user_id ON admin_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_push_active ON admin_push_subscriptions(active) WHERE active = true;

-- RLS Policies
ALTER TABLE admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON admin_push_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
  ON admin_push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions"
  ON admin_push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
  ON admin_push_subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Super admins can view all subscriptions (for broadcasting)
CREATE POLICY "Super admins can view all push subscriptions"
  ON admin_push_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_admin_push_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_push_subscription_timestamp ON admin_push_subscriptions;
CREATE TRIGGER update_admin_push_subscription_timestamp
  BEFORE UPDATE ON admin_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_push_subscription_timestamp();

COMMENT ON TABLE admin_push_subscriptions IS 'Stores Web Push subscriptions for admin console notifications';

