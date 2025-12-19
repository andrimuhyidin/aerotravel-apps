-- Migration: 020-guide-wallet-auto-balance.sql
-- Description: Auto-update wallet balance via database trigger

-- ============================================
-- FUNCTION: Calculate balance from transactions
-- ============================================
CREATE OR REPLACE FUNCTION calculate_guide_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL(14,2) AS $$
DECLARE
  v_balance DECIMAL(14,2) := 0;
  v_tx RECORD;
BEGIN
  -- Calculate balance from all transactions
  FOR v_tx IN
    SELECT transaction_type, amount, status
    FROM guide_wallet_transactions
    WHERE wallet_id = p_wallet_id
    ORDER BY created_at ASC
  LOOP
    IF v_tx.transaction_type = 'earning' THEN
      -- Earnings always increase balance
      v_balance := v_balance + v_tx.amount;
    ELSIF v_tx.transaction_type = 'withdraw_request' THEN
      -- Only approved withdraw requests reduce balance
      IF v_tx.status = 'approved' THEN
        v_balance := v_balance - v_tx.amount;
      END IF;
    ELSIF v_tx.transaction_type = 'withdraw_approved' THEN
      -- Approved withdrawal reduces balance
      v_balance := v_balance - v_tx.amount;
    ELSIF v_tx.transaction_type = 'adjustment' THEN
      -- Adjustments can be positive or negative (only approved)
      IF v_tx.status IS NULL OR v_tx.status = 'approved' THEN
        v_balance := v_balance + v_tx.amount;
      END IF;
    END IF;
  END LOOP;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Auto-update wallet balance
-- ============================================
CREATE OR REPLACE FUNCTION auto_update_guide_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_new_balance DECIMAL(14,2);
BEGIN
  -- Calculate new balance from all transactions
  v_new_balance := calculate_guide_wallet_balance(NEW.wallet_id);

  -- Update wallet balance
  UPDATE guide_wallets
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE id = NEW.wallet_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-update balance on transaction insert
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_update_wallet_balance ON guide_wallet_transactions;

CREATE TRIGGER trigger_auto_update_wallet_balance
  AFTER INSERT OR UPDATE ON guide_wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_guide_wallet_balance();

-- ============================================
-- FUNCTION: Sync all wallet balances (for migration/repair)
-- ============================================
CREATE OR REPLACE FUNCTION sync_all_guide_wallet_balances()
RETURNS TABLE(wallet_id UUID, old_balance DECIMAL(14,2), new_balance DECIMAL(14,2)) AS $$
DECLARE
  v_wallet RECORD;
  v_calculated DECIMAL(14,2);
BEGIN
  FOR v_wallet IN
    SELECT id, balance FROM guide_wallets
  LOOP
    v_calculated := calculate_guide_wallet_balance(v_wallet.id);
    
    IF v_calculated != v_wallet.balance THEN
      UPDATE guide_wallets
      SET balance = v_calculated, updated_at = NOW()
      WHERE id = v_wallet.id;
      
      wallet_id := v_wallet.id;
      old_balance := v_wallet.balance;
      new_balance := v_calculated;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL SYNC: Fix any existing inconsistencies
-- ============================================
-- Run sync for all wallets to fix any existing issues
SELECT sync_all_guide_wallet_balances();

