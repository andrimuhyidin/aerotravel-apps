-- Migration: 041-contract-auto-expire-cron.sql
-- Description: Auto-expire contracts cron job
-- Created: 2025-01-21

-- ============================================
-- FUNCTION: Auto-expire contracts
-- ============================================
CREATE OR REPLACE FUNCTION auto_expire_contracts()
RETURNS void AS $$
BEGIN
  -- Update active contracts that have passed their expiry date
  UPDATE guide_contracts
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
    
  -- Log the update
  RAISE NOTICE 'Auto-expired contracts: %', (SELECT COUNT(*) FROM guide_contracts WHERE status = 'expired' AND updated_at > NOW() - INTERVAL '1 minute');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CRON JOB: Run daily at 00:00 UTC
-- ============================================
-- Note: This requires pg_cron extension
-- Run this manually in Supabase SQL Editor if pg_cron is enabled
-- 
-- SELECT cron.schedule(
--   'auto-expire-contracts',
--   '0 0 * * *', -- Daily at midnight UTC
--   $$SELECT auto_expire_contracts()$$
-- );

-- ============================================
-- ALTERNATIVE: Manual trigger via API
-- ============================================
-- This function can be called via API endpoint for manual execution
-- or scheduled via external cron service (Vercel Cron, etc.)
