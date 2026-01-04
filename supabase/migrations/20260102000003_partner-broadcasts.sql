-- Partner Broadcasts Tables
-- For WhatsApp broadcast management

-- Partner Broadcasts
CREATE TABLE IF NOT EXISTS partner_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  audience_filter JSONB DEFAULT '{}',
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'paused', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Broadcast Recipients
CREATE TABLE IF NOT EXISTS partner_broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES partner_broadcasts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES partner_customers(id),
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  message_id VARCHAR(100), -- WA message ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_broadcasts_partner ON partner_broadcasts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_broadcasts_status ON partner_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_partner_broadcasts_scheduled ON partner_broadcasts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON partner_broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_status ON partner_broadcast_recipients(status);

-- RLS Policies
ALTER TABLE partner_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- Partner can manage their own broadcasts
CREATE POLICY partner_broadcasts_partner_all ON partner_broadcasts
  FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Partner can view recipients of their broadcasts
CREATE POLICY broadcast_recipients_partner_view ON partner_broadcast_recipients
  FOR SELECT
  TO authenticated
  USING (
    broadcast_id IN (
      SELECT id FROM partner_broadcasts WHERE partner_id = auth.uid()
    )
  );

-- System can update recipient status (for webhook updates)
-- Note: In production, use a service role for this

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_partner_broadcasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_broadcasts_updated_at
  BEFORE UPDATE ON partner_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_broadcasts_updated_at();

