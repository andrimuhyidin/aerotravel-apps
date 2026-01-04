-- Discount Codes Table
-- Supports percentage and fixed amount discounts with various constraints

-- Discount type enum
DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Main discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code info
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Discount value
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(12,2) NOT NULL, -- percentage (0-100) or fixed amount
  max_discount_amount NUMERIC(12,2), -- cap for percentage discounts
  
  -- Constraints
  min_order_amount NUMERIC(12,2) DEFAULT 0,
  max_uses INTEGER, -- null = unlimited
  max_uses_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  
  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  
  -- Scope restrictions
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  package_ids UUID[] DEFAULT '{}', -- empty = all packages
  customer_type VARCHAR(50), -- null = all, 'new' = first-time, 'returning' = repeat
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Unique constraint on code (case-insensitive)
  CONSTRAINT unique_discount_code UNIQUE (code)
);

-- Discount usage tracking table
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  discount_amount NUMERIC(12,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(LOWER(code));
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_discount_codes_valid ON discount_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_discount_codes_branch ON discount_codes(branch_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user ON discount_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_booking ON discount_code_usage(booking_id);

-- RLS Policies
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Discount codes - admins can manage all
CREATE POLICY "Admins can manage discount codes"
  ON discount_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Public can read active discount codes (for validation)
CREATE POLICY "Authenticated users can read active discount codes"
  ON discount_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Usage tracking - insert by system, read by admins
CREATE POLICY "System can insert discount usage"
  ON discount_code_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read discount usage"
  ON discount_code_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing', 'finance_manager')
    )
  );

-- Users can see their own usage
CREATE POLICY "Users can read own discount usage"
  ON discount_code_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to validate discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code TEXT,
  p_branch_id UUID DEFAULT NULL,
  p_package_id UUID DEFAULT NULL,
  p_order_amount NUMERIC DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_code_id UUID,
  discount_type discount_type,
  discount_value NUMERIC,
  max_discount_amount NUMERIC,
  calculated_discount NUMERIC,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code RECORD;
  v_user_usage_count INTEGER;
  v_calculated_discount NUMERIC;
BEGIN
  -- Find the discount code (case-insensitive)
  SELECT * INTO v_code
  FROM discount_codes dc
  WHERE LOWER(dc.code) = LOWER(p_code)
  AND dc.is_active = true
  LIMIT 1;

  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::discount_type, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Kode diskon tidak ditemukan'::TEXT;
    RETURN;
  END IF;

  -- Check validity period
  IF v_code.valid_from > now() THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, v_code.max_discount_amount, NULL::NUMERIC, 'Kode diskon belum berlaku'::TEXT;
    RETURN;
  END IF;

  IF v_code.valid_until IS NOT NULL AND v_code.valid_until < now() THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, v_code.max_discount_amount, NULL::NUMERIC, 'Kode diskon sudah kadaluarsa'::TEXT;
    RETURN;
  END IF;

  -- Check max uses
  IF v_code.max_uses IS NOT NULL AND v_code.used_count >= v_code.max_uses THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, v_code.max_discount_amount, NULL::NUMERIC, 'Kuota kode diskon sudah habis'::TEXT;
    RETURN;
  END IF;

  -- Check per-user limit
  IF p_user_id IS NOT NULL AND v_code.max_uses_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM discount_code_usage
    WHERE discount_code_id = v_code.id
    AND user_id = p_user_id;

    IF v_user_usage_count >= v_code.max_uses_per_user THEN
      RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, v_code.max_discount_amount, NULL::NUMERIC, 'Anda sudah menggunakan kode diskon ini'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Check minimum order amount
  IF p_order_amount < v_code.min_order_amount THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, v_code.max_discount_amount, NULL::NUMERIC, 
      ('Minimum pembelian Rp ' || to_char(v_code.min_order_amount, 'FM999,999,999'))::TEXT;
    RETURN;
  END IF;

  -- Check branch restriction
  IF v_code.branch_id IS NOT NULL AND p_branch_id IS NOT NULL AND v_code.branch_id != p_branch_id THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, v_code.max_discount_amount, NULL::NUMERIC, 'Kode diskon tidak berlaku untuk cabang ini'::TEXT;
    RETURN;
  END IF;

  -- Check package restriction
  IF array_length(v_code.package_ids, 1) > 0 AND p_package_id IS NOT NULL THEN
    IF NOT (p_package_id = ANY(v_code.package_ids)) THEN
      RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, v_code.max_discount_amount, NULL::NUMERIC, 'Kode diskon tidak berlaku untuk paket ini'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Calculate discount amount
  IF v_code.discount_type = 'percentage' THEN
    v_calculated_discount := p_order_amount * (v_code.discount_value / 100);
    -- Apply cap if set
    IF v_code.max_discount_amount IS NOT NULL AND v_calculated_discount > v_code.max_discount_amount THEN
      v_calculated_discount := v_code.max_discount_amount;
    END IF;
  ELSE
    -- Fixed amount
    v_calculated_discount := LEAST(v_code.discount_value, p_order_amount);
  END IF;

  -- Round to nearest rupiah
  v_calculated_discount := ROUND(v_calculated_discount);

  -- Valid!
  RETURN QUERY SELECT true, v_code.id, v_code.discount_type, v_code.discount_value, v_code.max_discount_amount, v_calculated_discount, NULL::TEXT;
END;
$$;

-- Function to apply/use discount code
CREATE OR REPLACE FUNCTION apply_discount_code(
  p_code TEXT,
  p_user_id UUID,
  p_booking_id UUID,
  p_discount_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_id UUID;
BEGIN
  -- Get code ID
  SELECT id INTO v_code_id
  FROM discount_codes
  WHERE LOWER(code) = LOWER(p_code)
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Record usage
  INSERT INTO discount_code_usage (discount_code_id, user_id, booking_id, discount_amount)
  VALUES (v_code_id, p_user_id, p_booking_id, p_discount_amount);

  -- Increment used count
  UPDATE discount_codes
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = v_code_id;

  RETURN true;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_discount_codes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_discount_codes_timestamp ON discount_codes;
CREATE TRIGGER update_discount_codes_timestamp
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_codes_timestamp();

COMMENT ON TABLE discount_codes IS 'Discount/promo codes for bookings';
COMMENT ON TABLE discount_code_usage IS 'Tracks usage of discount codes';

