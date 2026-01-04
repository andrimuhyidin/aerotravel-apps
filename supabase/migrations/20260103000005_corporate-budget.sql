-- Migration: Corporate Budget Management
-- Purpose: Track and manage corporate travel budgets by department

-- Create companies table first if not exists
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(200),
  npwp VARCHAR(50),
  siup_number VARCHAR(100),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add company_id to users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'company_id' AND table_schema = 'public') THEN
    ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
  END IF;
END $$;

-- Create corporate budgets table
CREATE TABLE IF NOT EXISTS corporate_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department VARCHAR(100) NOT NULL,
  fiscal_year INT NOT NULL,
  fiscal_quarter INT,
  allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  alert_threshold DECIMAL(5,2) DEFAULT 80.00,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Unique budget per department per period
  UNIQUE(company_id, department, fiscal_year, fiscal_quarter),
  
  -- Ensure valid amounts
  CONSTRAINT valid_amounts CHECK (allocated_amount >= 0 AND spent_amount >= 0 AND pending_amount >= 0),
  CONSTRAINT valid_threshold CHECK (alert_threshold >= 0 AND alert_threshold <= 100)
);

-- Create budget transactions log
CREATE TABLE IF NOT EXISTS corporate_budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES corporate_budgets(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Add indexes
CREATE INDEX idx_corporate_budgets_company ON corporate_budgets(company_id);
CREATE INDEX idx_corporate_budgets_year ON corporate_budgets(fiscal_year);
CREATE INDEX idx_corporate_budgets_active ON corporate_budgets(is_active) WHERE is_active = true;
CREATE INDEX idx_budget_transactions_budget ON corporate_budget_transactions(budget_id);

-- Add comments
COMMENT ON TABLE corporate_budgets IS 'Corporate travel budget allocations by department';
COMMENT ON COLUMN corporate_budgets.alert_threshold IS 'Percentage at which to send budget alerts (e.g., 80 = alert at 80% spent)';
COMMENT ON COLUMN corporate_budgets.pending_amount IS 'Amount in pending/unapproved bookings';

-- RLS Policies
ALTER TABLE corporate_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_budget_transactions ENABLE ROW LEVEL SECURITY;

-- Corporate users can view their company's budgets
CREATE POLICY "Corporate users can view budgets" ON corporate_budgets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.company_id = corporate_budgets.company_id
        OR u.role = 'super_admin'
      )
    )
  );

-- Only admins can manage budgets
CREATE POLICY "Admins can manage budgets" ON corporate_budgets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'super_admin'
        OR (u.role = 'corporate' AND u.company_id = corporate_budgets.company_id)
      )
    )
  );

-- Transaction viewing policy
CREATE POLICY "Users can view budget transactions" ON corporate_budget_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM corporate_budgets b
      JOIN users u ON u.id = auth.uid()
      WHERE b.id = corporate_budget_transactions.budget_id
      AND (u.company_id = b.company_id OR u.role = 'super_admin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_corporate_budgets_timestamp
  BEFORE UPDATE ON corporate_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_seasons_timestamp();

-- Create function to check budget alerts
CREATE OR REPLACE FUNCTION check_budget_alert(p_budget_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_budget RECORD;
  v_usage_percent DECIMAL(5,2);
BEGIN
  SELECT * INTO v_budget FROM corporate_budgets WHERE id = p_budget_id;
  
  IF v_budget.allocated_amount = 0 THEN
    RETURN FALSE;
  END IF;
  
  v_usage_percent := ((v_budget.spent_amount + v_budget.pending_amount) / v_budget.allocated_amount) * 100;
  
  RETURN v_usage_percent >= v_budget.alert_threshold;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get budget summary
CREATE OR REPLACE FUNCTION get_budget_summary(p_company_id UUID, p_fiscal_year INT)
RETURNS TABLE (
  total_allocated DECIMAL(15,2),
  total_spent DECIMAL(15,2),
  total_pending DECIMAL(15,2),
  total_remaining DECIMAL(15,2),
  usage_percent DECIMAL(5,2),
  department_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(b.allocated_amount), 0) AS total_allocated,
    COALESCE(SUM(b.spent_amount), 0) AS total_spent,
    COALESCE(SUM(b.pending_amount), 0) AS total_pending,
    COALESCE(SUM(b.allocated_amount - b.spent_amount - b.pending_amount), 0) AS total_remaining,
    CASE 
      WHEN COALESCE(SUM(b.allocated_amount), 0) = 0 THEN 0
      ELSE ROUND((COALESCE(SUM(b.spent_amount + b.pending_amount), 0) / SUM(b.allocated_amount)) * 100, 2)
    END AS usage_percent,
    COUNT(DISTINCT b.department)::INT AS department_count
  FROM corporate_budgets b
  WHERE b.company_id = p_company_id
    AND b.fiscal_year = p_fiscal_year
    AND b.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

