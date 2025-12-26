/**
 * Migration: Enable Realtime for Cross-App Integration
 * Description: Enable Supabase Realtime untuk tables yang diperlukan untuk cross-app data sync
 * Created: 2025-02-02
 * Reference: Cross-App Data Integration Implementation Plan
 */

-- ============================================
-- ENABLE REALTIME FOR TABLES
-- ============================================

-- Enable Realtime untuk tables (skip if already exists)
DO $$
BEGIN
  -- bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;

  -- trips
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trips;
  END IF;

  -- mitra_wallet_transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'mitra_wallet_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mitra_wallet_transactions;
  END IF;

  -- guide_wallet_transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'guide_wallet_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE guide_wallet_transactions;
  END IF;

  -- packages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'packages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE packages;
  END IF;
END $$;

-- Enable Realtime untuk partner_notifications table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE partner_notifications;
  END IF;
END $$;

-- Note: unified_notifications table akan di-enable di migration berikutnya
-- setelah table tersebut dibuat

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE bookings IS 'Realtime enabled for cross-app booking status sync';
COMMENT ON TABLE trips IS 'Realtime enabled for cross-app trip assignment sync';
COMMENT ON TABLE mitra_wallet_transactions IS 'Realtime enabled for partner wallet balance sync';
COMMENT ON TABLE guide_wallet_transactions IS 'Realtime enabled for guide wallet balance sync';
COMMENT ON TABLE packages IS 'Realtime enabled for package availability sync';
-- Comment for partner_notifications (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_notifications') THEN
    COMMENT ON TABLE partner_notifications IS 'Realtime enabled for partner notification delivery';
  END IF;
END $$;

