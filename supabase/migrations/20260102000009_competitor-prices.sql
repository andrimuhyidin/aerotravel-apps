-- Partner Competitor Prices Table
-- For market intelligence / price monitoring

CREATE TABLE IF NOT EXISTS partner_competitor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id),
  competitor_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_url TEXT,
  
  -- Pricing
  current_price DECIMAL(12,2) NOT NULL,
  previous_price DECIMAL(12,2),
  lowest_price DECIMAL(12,2),
  highest_price DECIMAL(12,2),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitor_prices_partner ON partner_competitor_prices(partner_id);

-- RLS Policies
ALTER TABLE partner_competitor_prices ENABLE ROW LEVEL SECURITY;

-- Partner can manage their own competitor data
CREATE POLICY competitor_prices_partner_all ON partner_competitor_prices
  FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Trigger for updated_at and price tracking
CREATE OR REPLACE FUNCTION update_competitor_prices_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Track previous price
  IF OLD.current_price IS DISTINCT FROM NEW.current_price THEN
    NEW.previous_price = OLD.current_price;
  END IF;
  
  -- Track lowest/highest
  IF NEW.lowest_price IS NULL OR NEW.current_price < NEW.lowest_price THEN
    NEW.lowest_price = NEW.current_price;
  END IF;
  IF NEW.highest_price IS NULL OR NEW.current_price > NEW.highest_price THEN
    NEW.highest_price = NEW.current_price;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competitor_prices_updated
  BEFORE UPDATE ON partner_competitor_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_prices_trigger();

-- Initial insert trigger for lowest/highest
CREATE OR REPLACE FUNCTION init_competitor_prices_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lowest_price = NEW.current_price;
  NEW.highest_price = NEW.current_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competitor_prices_insert
  BEFORE INSERT ON partner_competitor_prices
  FOR EACH ROW
  EXECUTE FUNCTION init_competitor_prices_trigger();

