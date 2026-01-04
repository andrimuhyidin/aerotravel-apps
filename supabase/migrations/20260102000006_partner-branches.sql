-- Partner Branches Table
-- For multi-branch support

CREATE TABLE IF NOT EXISTS partner_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  is_headquarters BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Add branch_id to partner_users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_users' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE partner_users ADD COLUMN branch_id UUID REFERENCES partner_branches(id);
  END IF;
END $$;

-- Add partner_branch_id to bookings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'partner_branch_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN partner_branch_id UUID REFERENCES partner_branches(id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_branches_partner ON partner_branches(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_branches_hq ON partner_branches(partner_id, is_headquarters) 
  WHERE is_headquarters = true AND deleted_at IS NULL;

-- RLS Policies
ALTER TABLE partner_branches ENABLE ROW LEVEL SECURITY;

-- Partner can manage their own branches
CREATE POLICY partner_branches_partner_all ON partner_branches
  FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_partner_branches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_branches_updated_at
  BEFORE UPDATE ON partner_branches
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_branches_updated_at();

