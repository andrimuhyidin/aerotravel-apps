-- Row Level Security (RLS) Policies Examples
-- Sesuai PRD 2.5.B - Row Level Security
-- 
-- This file contains example RLS policies for multi-tenant architecture
-- Each table should have branch_id column for multi-tenancy

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Super Admin can view all profiles
CREATE POLICY "Super Admin can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================
-- BOOKINGS TABLE (Multi-Branch)
-- ============================================

-- Policy: Users can only see bookings from their branch
CREATE POLICY "Users can view bookings from own branch"
  ON bookings
  FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can create bookings in their branch
CREATE POLICY "Users can create bookings in own branch"
  ON bookings
  FOR INSERT
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update bookings in their branch
CREATE POLICY "Users can update bookings in own branch"
  ON bookings
  FOR UPDATE
  USING (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Super Admin can view all bookings
CREATE POLICY "Super Admin can view all bookings"
  ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================
-- PACKAGES TABLE (Multi-Branch)
-- ============================================

-- Policy: Public can view published packages
CREATE POLICY "Public can view published packages"
  ON packages
  FOR SELECT
  USING (is_published = true);

-- Policy: Users can view packages from their branch
CREATE POLICY "Users can view packages from own branch"
  ON packages
  FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Admin can manage packages in their branch
CREATE POLICY "Admin can manage packages in own branch"
  ON packages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND branch_id = packages.branch_id
    )
  );

-- ============================================
-- PAYMENTS TABLE (Multi-Branch)
-- ============================================

-- Policy: Users can only see payments from their branch
CREATE POLICY "Users can view payments from own branch"
  ON payments
  FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Finance role can manage payments in their branch
CREATE POLICY "Finance can manage payments in own branch"
  ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('finance', 'admin', 'super_admin')
        AND branch_id = payments.branch_id
    )
  );

-- ============================================
-- DOCUMENTS TABLE (Multi-Branch)
-- ============================================

-- Policy: Users can view documents from their branch
CREATE POLICY "Users can view documents from own branch"
  ON documents
  FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can upload documents to their branch
CREATE POLICY "Users can upload documents to own branch"
  ON documents
  FOR INSERT
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND branch_id = documents.branch_id
    )
  );

-- ============================================
-- NOTES
-- ============================================
-- 
-- 1. Always enable RLS on sensitive tables
-- 2. Use branch_id for multi-tenant isolation
-- 3. Use auth.uid() for user-specific data
-- 4. Super Admin should have bypass policies
-- 5. Test policies thoroughly before production
-- 
-- To apply these policies:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Or use Supabase CLI: supabase db push
-- 3. Verify policies in Supabase Dashboard > Authentication > Policies

