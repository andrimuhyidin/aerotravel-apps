-- Partner Contracts Table
-- For e-signature contract management

CREATE TABLE IF NOT EXISTS partner_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'partnership',
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  
  -- Signature data
  signed_at TIMESTAMPTZ,
  signature_data TEXT, -- Base64 encoded signature image
  signature_location VARCHAR(50), -- lat,lng
  signature_ip VARCHAR(50),
  signature_user_agent TEXT,
  
  -- Validity
  expires_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_contracts_partner ON partner_contracts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_contracts_status ON partner_contracts(status);

-- RLS Policies
ALTER TABLE partner_contracts ENABLE ROW LEVEL SECURITY;

-- Partner can view their own contracts
CREATE POLICY partner_contracts_partner_select ON partner_contracts
  FOR SELECT
  TO authenticated
  USING (partner_id = auth.uid());

-- Partner can update (sign) their pending contracts
CREATE POLICY partner_contracts_partner_update ON partner_contracts
  FOR UPDATE
  TO authenticated
  USING (partner_id = auth.uid() AND status = 'pending')
  WITH CHECK (partner_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_partner_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_contracts_updated_at
  BEFORE UPDATE ON partner_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_contracts_updated_at();

