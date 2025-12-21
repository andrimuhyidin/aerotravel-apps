-- Migration: 065-auto-generate-employee-number.sql
-- Description: Auto-generate employee_number for guides when created or contract signed
-- Created: 2025-12-21
-- Reference: Complete Guide Profile Edit Implementation Plan - Data Integration

BEGIN;

-- ============================================
-- FUNCTION: Generate Employee Number
-- Format: AT-{BRANCH_CODE}-{YYYYMMDD}-{XXX}
-- Example: AT-LPG-20251221-001
-- ============================================
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TRIGGER AS $$
DECLARE
  v_branch_code VARCHAR(10);
  v_date_str VARCHAR(8);
  v_seq_num INTEGER;
  v_employee_number VARCHAR(50);
BEGIN
  -- Only generate for guides
  IF NEW.role != 'guide' THEN
    RETURN NEW;
  END IF;
  
  -- Skip if employee_number already exists
  IF NEW.employee_number IS NOT NULL AND NEW.employee_number != '' THEN
    RETURN NEW;
  END IF;
  
  -- Get branch code
  IF NEW.branch_id IS NOT NULL THEN
    SELECT code INTO v_branch_code
    FROM branches
    WHERE id = NEW.branch_id AND is_active = true
    LIMIT 1;
  END IF;
  
  -- Default to 'AT' if no branch code
  IF v_branch_code IS NULL OR v_branch_code = '' THEN
    v_branch_code := 'AT';
  END IF;
  
  -- Format: YYYYMMDD
  v_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get next sequence number for this branch and date
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_seq_num
  FROM users
  WHERE employee_number LIKE 'AT-' || v_branch_code || '-' || v_date_str || '-%'
    AND role = 'guide';
  
  -- Generate employee number
  v_employee_number := 'AT-' || v_branch_code || '-' || v_date_str || '-' || LPAD(v_seq_num::TEXT, 3, '0');
  
  NEW.employee_number := v_employee_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-generate on user insert
-- ============================================
DROP TRIGGER IF EXISTS trigger_generate_employee_number ON users;
CREATE TRIGGER trigger_generate_employee_number
  BEFORE INSERT ON users
  FOR EACH ROW
  WHEN (NEW.role = 'guide' AND (NEW.employee_number IS NULL OR NEW.employee_number = ''))
  EXECUTE FUNCTION generate_employee_number();

-- ============================================
-- FUNCTION: Auto-generate on contract signed
-- ============================================
CREATE OR REPLACE FUNCTION generate_employee_number_on_contract_signed()
RETURNS TRIGGER AS $$
DECLARE
  v_guide_id UUID;
  v_branch_code VARCHAR(10);
  v_date_str VARCHAR(8);
  v_seq_num INTEGER;
  v_employee_number VARCHAR(50);
  v_current_employee_number VARCHAR(50);
BEGIN
  -- Only trigger when contract is signed (status changes to 'active' or 'signed')
  IF NEW.status NOT IN ('active', 'signed') OR OLD.status IN ('active', 'signed') THEN
    RETURN NEW;
  END IF;
  
  -- Only for master contracts
  IF NEW.is_master_contract != true THEN
    RETURN NEW;
  END IF;
  
  v_guide_id := NEW.guide_id;
  
  -- Check if guide already has employee_number
  SELECT employee_number INTO v_current_employee_number
  FROM users
  WHERE id = v_guide_id;
  
  IF v_current_employee_number IS NOT NULL AND v_current_employee_number != '' THEN
    RETURN NEW;
  END IF;
  
  -- Get branch code from contract
  IF NEW.branch_id IS NOT NULL THEN
    SELECT code INTO v_branch_code
    FROM branches
    WHERE id = NEW.branch_id AND is_active = true
    LIMIT 1;
  END IF;
  
  -- Default to 'AT' if no branch code
  IF v_branch_code IS NULL OR v_branch_code = '' THEN
    v_branch_code := 'AT';
  END IF;
  
  -- Format: YYYYMMDD (use contract start_date or today)
  IF NEW.start_date IS NOT NULL THEN
    v_date_str := TO_CHAR(NEW.start_date::DATE, 'YYYYMMDD');
  ELSE
    v_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  END IF;
  
  -- Get next sequence number for this branch and date
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_seq_num
  FROM users
  WHERE employee_number LIKE 'AT-' || v_branch_code || '-' || v_date_str || '-%'
    AND role = 'guide';
  
  -- Generate employee number
  v_employee_number := 'AT-' || v_branch_code || '-' || v_date_str || '-' || LPAD(v_seq_num::TEXT, 3, '0');
  
  -- Update guide's employee_number
  UPDATE users
  SET employee_number = v_employee_number,
      updated_at = NOW()
  WHERE id = v_guide_id
    AND (employee_number IS NULL OR employee_number = '');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-generate on contract signed
-- ============================================
DROP TRIGGER IF EXISTS trigger_generate_employee_number_on_contract ON guide_contracts;
CREATE TRIGGER trigger_generate_employee_number_on_contract
  AFTER UPDATE OF status ON guide_contracts
  FOR EACH ROW
  WHEN (NEW.status IN ('active', 'signed') AND OLD.status NOT IN ('active', 'signed') AND NEW.is_master_contract = true)
  EXECUTE FUNCTION generate_employee_number_on_contract_signed();

-- ============================================
-- FUNCTION: Auto-set hire_date on contract signed
-- ============================================
CREATE OR REPLACE FUNCTION auto_set_hire_date_on_contract()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when contract is signed (status changes to 'active' or 'signed')
  IF NEW.status NOT IN ('active', 'signed') OR OLD.status IN ('active', 'signed') THEN
    RETURN NEW;
  END IF;
  
  -- Only for master contracts
  IF NEW.is_master_contract != true THEN
    RETURN NEW;
  END IF;
  
  -- Update guide's hire_date if not already set
  UPDATE users
  SET hire_date = NEW.start_date,
      updated_at = NOW()
  WHERE id = NEW.guide_id
    AND hire_date IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-set hire_date on contract signed
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_set_hire_date ON guide_contracts;
CREATE TRIGGER trigger_auto_set_hire_date
  AFTER UPDATE OF status ON guide_contracts
  FOR EACH ROW
  WHEN (NEW.status IN ('active', 'signed') AND OLD.status NOT IN ('active', 'signed') AND NEW.is_master_contract = true)
  EXECUTE FUNCTION auto_set_hire_date_on_contract();

COMMIT;

