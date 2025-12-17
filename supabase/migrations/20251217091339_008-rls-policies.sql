-- Migration: 008-rls-policies.sql
-- Description: Row Level Security policies for multi-tenant isolation
-- Created: 2025-12-17
-- Reference: PRD 2.5, 2.9, 3.3

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitra_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitra_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current user's branch_id
CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is internal staff
CREATE OR REPLACE FUNCTION is_internal_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'investor', 'finance_manager', 'marketing', 'ops_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- BRANCHES POLICIES
-- ============================================
-- Everyone can read branches
CREATE POLICY "branches_select_all" ON branches
  FOR SELECT USING (true);

-- Only super_admin can modify
CREATE POLICY "branches_modify_super_admin" ON branches
  FOR ALL USING (is_super_admin());

-- ============================================
-- USERS POLICIES
-- ============================================
-- Users can read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid());

-- Internal staff can read users in their branch
CREATE POLICY "users_select_branch" ON users
  FOR SELECT USING (
    is_internal_staff() AND (
      branch_id = get_user_branch_id() OR is_super_admin()
    )
  );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- Super admin can manage all users
CREATE POLICY "users_all_super_admin" ON users
  FOR ALL USING (is_super_admin());

-- ============================================
-- PACKAGES POLICIES
-- ============================================
-- Published packages visible to all
CREATE POLICY "packages_select_published" ON packages
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Internal staff can see all packages in their branch
CREATE POLICY "packages_select_internal" ON packages
  FOR SELECT USING (
    is_internal_staff() AND (
      branch_id = get_user_branch_id() OR is_super_admin()
    )
  );

-- Marketing and ops_admin can modify packages
CREATE POLICY "packages_modify_staff" ON packages
  FOR ALL USING (
    get_user_role() IN ('super_admin', 'marketing', 'ops_admin')
    AND (branch_id = get_user_branch_id() OR is_super_admin())
  );

-- ============================================
-- PACKAGE PRICES POLICIES
-- ============================================
-- Published prices visible to all
CREATE POLICY "package_prices_select_all" ON package_prices
  FOR SELECT USING (is_active = true);

-- Staff can modify
CREATE POLICY "package_prices_modify_staff" ON package_prices
  FOR ALL USING (
    get_user_role() IN ('super_admin', 'marketing', 'ops_admin')
  );

-- ============================================
-- BOOKINGS POLICIES
-- ============================================
-- Customers can see their own bookings
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (
    created_by = auth.uid() OR customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Mitra can see bookings they created
CREATE POLICY "bookings_select_mitra" ON bookings
  FOR SELECT USING (
    get_user_role() = 'mitra' AND mitra_id = auth.uid()
  );

-- Internal staff can see branch bookings
CREATE POLICY "bookings_select_internal" ON bookings
  FOR SELECT USING (
    is_internal_staff() AND (
      branch_id = get_user_branch_id() OR is_super_admin()
    )
  );

-- Marketing can create/edit bookings
CREATE POLICY "bookings_modify_marketing" ON bookings
  FOR ALL USING (
    get_user_role() IN ('super_admin', 'marketing')
    AND (branch_id = get_user_branch_id() OR is_super_admin())
  );

-- Customers can create bookings
CREATE POLICY "bookings_insert_customer" ON bookings
  FOR INSERT WITH CHECK (true);

-- Mitra can create bookings
CREATE POLICY "bookings_insert_mitra" ON bookings
  FOR INSERT WITH CHECK (get_user_role() = 'mitra');

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
-- Users can see payments for their bookings
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE created_by = auth.uid() OR mitra_id = auth.uid()
    )
  );

-- Finance can see all payments
CREATE POLICY "payments_select_finance" ON payments
  FOR SELECT USING (
    get_user_role() IN ('super_admin', 'finance_manager')
  );

-- Finance can modify payments
CREATE POLICY "payments_modify_finance" ON payments
  FOR ALL USING (
    get_user_role() IN ('super_admin', 'finance_manager')
  );

-- ============================================
-- MITRA WALLET POLICIES
-- ============================================
-- Mitra can see their own wallet
CREATE POLICY "mitra_wallets_select_own" ON mitra_wallets
  FOR SELECT USING (mitra_id = auth.uid());

-- Finance can see all wallets
CREATE POLICY "mitra_wallets_select_finance" ON mitra_wallets
  FOR SELECT USING (
    get_user_role() IN ('super_admin', 'finance_manager')
  );

-- ============================================
-- ASSETS POLICIES
-- ============================================
-- Marketing can see asset availability
CREATE POLICY "assets_select_availability" ON assets
  FOR SELECT USING (
    get_user_role() IN ('super_admin', 'marketing', 'ops_admin')
    AND (branch_id = get_user_branch_id() OR is_super_admin())
  );

-- Only ops_admin can modify assets
CREATE POLICY "assets_modify_ops" ON assets
  FOR ALL USING (
    get_user_role() IN ('super_admin', 'ops_admin')
    AND (branch_id = get_user_branch_id() OR is_super_admin())
  );

-- ============================================
-- TRIPS POLICIES
-- ============================================
-- Guides can see trips they're assigned to
CREATE POLICY "trips_select_guide" ON trips
  FOR SELECT USING (
    get_user_role() = 'guide' AND id IN (
      SELECT trip_id FROM trip_guides WHERE guide_id = auth.uid()
    )
  );

-- Internal staff can see branch trips
CREATE POLICY "trips_select_internal" ON trips
  FOR SELECT USING (
    is_internal_staff() AND (
      branch_id = get_user_branch_id() OR is_super_admin()
    )
  );

-- Ops can modify trips
CREATE POLICY "trips_modify_ops" ON trips
  FOR ALL USING (
    get_user_role() IN ('super_admin', 'ops_admin')
    AND (branch_id = get_user_branch_id() OR is_super_admin())
  );

-- ============================================
-- TRIP GUIDES POLICIES
-- ============================================
-- Guides can see and update their own assignments
CREATE POLICY "trip_guides_select_own" ON trip_guides
  FOR SELECT USING (guide_id = auth.uid());

CREATE POLICY "trip_guides_update_own" ON trip_guides
  FOR UPDATE USING (guide_id = auth.uid());

-- Ops can manage all
CREATE POLICY "trip_guides_manage_ops" ON trip_guides
  FOR ALL USING (
    get_user_role() IN ('super_admin', 'ops_admin')
  );

-- ============================================
-- EXPENSE REQUESTS POLICIES
-- ============================================
-- Users can see their own requests
CREATE POLICY "expense_requests_select_own" ON expense_requests
  FOR SELECT USING (requested_by = auth.uid());

-- Staff can see branch requests
CREATE POLICY "expense_requests_select_branch" ON expense_requests
  FOR SELECT USING (
    is_internal_staff() AND (
      branch_id = get_user_branch_id() OR is_super_admin()
    )
  );

-- Staff can create requests
CREATE POLICY "expense_requests_insert_staff" ON expense_requests
  FOR INSERT WITH CHECK (is_internal_staff());

-- Finance/Super Admin can approve
CREATE POLICY "expense_requests_approve" ON expense_requests
  FOR UPDATE USING (
    get_user_role() IN ('super_admin', 'finance_manager')
  );

-- ============================================
-- SALARY POLICIES
-- ============================================
-- Guides can see their own salary
CREATE POLICY "salary_payments_select_own" ON salary_payments
  FOR SELECT USING (guide_id = auth.uid());

-- Finance can manage
CREATE POLICY "salary_payments_manage_finance" ON salary_payments
  FOR ALL USING (
    get_user_role() IN ('super_admin', 'finance_manager')
  );

-- Ops can view (not pay)
CREATE POLICY "salary_payments_view_ops" ON salary_payments
  FOR SELECT USING (
    get_user_role() = 'ops_admin' AND branch_id = get_user_branch_id()
  );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================
-- Only super_admin can see audit logs
CREATE POLICY "audit_logs_super_admin" ON audit_logs
  FOR SELECT USING (is_super_admin());

-- Insert allowed for logging function
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- SOS ALERTS POLICIES
-- ============================================
-- Guides can create SOS
CREATE POLICY "sos_alerts_insert_guide" ON sos_alerts
  FOR INSERT WITH CHECK (get_user_role() = 'guide');

-- Internal staff can see and manage
CREATE POLICY "sos_alerts_manage_internal" ON sos_alerts
  FOR ALL USING (
    is_internal_staff() AND (
      branch_id = get_user_branch_id() OR is_super_admin()
    )
  );

-- ============================================
-- TICKETS POLICIES
-- ============================================
-- Users can see their own tickets
CREATE POLICY "tickets_select_own" ON tickets
  FOR SELECT USING (reported_by = auth.uid());

-- Internal staff can manage branch tickets
CREATE POLICY "tickets_manage_internal" ON tickets
  FOR ALL USING (
    is_internal_staff() AND (
      branch_id = get_user_branch_id() OR is_super_admin()
    )
  );

-- Anyone can create tickets
CREATE POLICY "tickets_insert_all" ON tickets
  FOR INSERT WITH CHECK (true);

-- ============================================
-- REVIEWS POLICIES
-- ============================================
-- Published reviews visible to all
CREATE POLICY "reviews_select_published" ON reviews
  FOR SELECT USING (is_published = true);

-- Users can create reviews for their bookings
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE created_by = auth.uid()
    )
  );

-- ============================================
-- LOYALTY POLICIES
-- ============================================
-- Users can see their own points
CREATE POLICY "loyalty_points_select_own" ON loyalty_points
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "loyalty_transactions_select_own" ON loyalty_transactions
  FOR SELECT USING (
    loyalty_id IN (
      SELECT id FROM loyalty_points WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- AI DOCUMENTS POLICIES
-- ============================================
-- Active documents visible to internal staff
CREATE POLICY "ai_documents_select_internal" ON ai_documents
  FOR SELECT USING (
    is_active = true AND (
      is_internal_staff() OR branch_id IS NULL
    )
  );

-- Super admin can manage
CREATE POLICY "ai_documents_manage_super" ON ai_documents
  FOR ALL USING (is_super_admin());
