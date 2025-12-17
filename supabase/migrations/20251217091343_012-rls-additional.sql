-- Migration: 012-rls-additional.sql
-- Description: RLS policies for new tables (009, 010, 011)
-- Created: 2025-12-17

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE split_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_bill_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_circle_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_deposit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SPLIT BILL POLICIES
-- ============================================
-- Creator can see their split bills
CREATE POLICY "split_bills_select_creator" ON split_bills
  FOR SELECT USING (creator_id = auth.uid());

-- Booking owner can see
CREATE POLICY "split_bills_select_booking" ON split_bills
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE created_by = auth.uid())
  );

-- Anyone can create (for booking process)
CREATE POLICY "split_bills_insert_all" ON split_bills
  FOR INSERT WITH CHECK (true);

-- Internal staff can manage
CREATE POLICY "split_bills_manage_internal" ON split_bills
  FOR ALL USING (is_internal_staff());

-- Participants visible to split bill participants
CREATE POLICY "split_bill_participants_select" ON split_bill_participants
  FOR SELECT USING (
    split_bill_id IN (
      SELECT id FROM split_bills WHERE creator_id = auth.uid()
    ) OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================
-- TRAVEL CIRCLE POLICIES
-- ============================================
-- Admin can manage their circles
CREATE POLICY "travel_circles_manage_admin" ON travel_circles
  FOR ALL USING (admin_id = auth.uid());

-- Members can view circles they're in
CREATE POLICY "travel_circles_select_member" ON travel_circles
  FOR SELECT USING (
    id IN (SELECT circle_id FROM travel_circle_members WHERE user_id = auth.uid())
  );

-- Members can see other members
CREATE POLICY "travel_circle_members_select" ON travel_circle_members
  FOR SELECT USING (
    circle_id IN (SELECT circle_id FROM travel_circle_members WHERE user_id = auth.uid())
  );

-- Contributions visible to members
CREATE POLICY "travel_circle_contributions_select" ON travel_circle_contributions
  FOR SELECT USING (
    circle_id IN (SELECT circle_id FROM travel_circle_members WHERE user_id = auth.uid())
  );

-- ============================================
-- KOL TRIPS POLICIES
-- ============================================
-- Active KOL trips visible to all
CREATE POLICY "kol_trips_select_active" ON kol_trips
  FOR SELECT USING (is_active = true);

-- Internal staff can manage
CREATE POLICY "kol_trips_manage_internal" ON kol_trips
  FOR ALL USING (is_internal_staff());

-- ============================================
-- CUSTOMER WALLET POLICIES
-- ============================================
-- Users can see their own wallet
CREATE POLICY "customer_wallets_select_own" ON customer_wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "customer_wallet_transactions_select_own" ON customer_wallet_transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM customer_wallets WHERE user_id = auth.uid())
  );

-- Finance can see all
CREATE POLICY "customer_wallets_finance" ON customer_wallets
  FOR ALL USING (get_user_role() IN ('super_admin', 'finance_manager'));

-- ============================================
-- CORPORATE POLICIES
-- ============================================
-- Corporate PIC can manage their company
CREATE POLICY "corporate_clients_select_pic" ON corporate_clients
  FOR SELECT USING (pic_id = auth.uid());

-- Internal staff can manage
CREATE POLICY "corporate_clients_manage_internal" ON corporate_clients
  FOR ALL USING (
    is_internal_staff() AND (branch_id = get_user_branch_id() OR is_super_admin())
  );

-- Corporate employees can see their own data
CREATE POLICY "corporate_employees_select_own" ON corporate_employees
  FOR SELECT USING (user_id = auth.uid());

-- PIC can manage employees
CREATE POLICY "corporate_employees_manage_pic" ON corporate_employees
  FOR ALL USING (
    corporate_id IN (SELECT id FROM corporate_clients WHERE pic_id = auth.uid())
  );

-- Corporate invoices visible to PIC
CREATE POLICY "corporate_invoices_select_pic" ON corporate_invoices
  FOR SELECT USING (
    corporate_id IN (SELECT id FROM corporate_clients WHERE pic_id = auth.uid())
  );

-- ============================================
-- GPS & TRACKING POLICIES
-- ============================================
-- Meeting points visible to all internal
CREATE POLICY "meeting_points_select_internal" ON meeting_points
  FOR SELECT USING (is_internal_staff());

-- Ops can manage
CREATE POLICY "meeting_points_manage_ops" ON meeting_points
  FOR ALL USING (get_user_role() IN ('super_admin', 'ops_admin'));

-- GPS pings: guides can insert their own
CREATE POLICY "gps_pings_insert_guide" ON gps_pings
  FOR INSERT WITH CHECK (guide_id = auth.uid() AND get_user_role() = 'guide');

-- Internal staff can view
CREATE POLICY "gps_pings_select_internal" ON gps_pings
  FOR SELECT USING (is_internal_staff());

-- Guide locations
CREATE POLICY "guide_locations_select_internal" ON guide_locations
  FOR SELECT USING (is_internal_staff());

CREATE POLICY "guide_locations_update_own" ON guide_locations
  FOR UPDATE USING (guide_id = auth.uid());

-- ============================================
-- INSURANCE MANIFESTS
-- ============================================
CREATE POLICY "insurance_manifests_internal" ON insurance_manifests
  FOR ALL USING (is_internal_staff());

-- ============================================
-- LOGS (Read-only for super admin)
-- ============================================
CREATE POLICY "data_retention_logs_super" ON data_retention_logs
  FOR SELECT USING (is_super_admin());

CREATE POLICY "cron_job_logs_super" ON cron_job_logs
  FOR SELECT USING (is_super_admin());

-- Notification logs: users can see their own
CREATE POLICY "notification_logs_select_own" ON notification_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notification_logs_internal" ON notification_logs
  FOR ALL USING (is_internal_staff());

-- ============================================
-- SETTINGS
-- ============================================
-- Public settings visible to all
CREATE POLICY "settings_select_public" ON settings
  FOR SELECT USING (is_public = true);

-- All settings visible to internal
CREATE POLICY "settings_select_internal" ON settings
  FOR SELECT USING (is_internal_staff());

-- Only super admin can modify
CREATE POLICY "settings_manage_super" ON settings
  FOR ALL USING (is_super_admin());
