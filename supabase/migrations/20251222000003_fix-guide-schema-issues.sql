-- Fix Guide Schema Issues
-- 1. Add missing columns to guide_certifications_tracker
-- 2. Add missing columns to salary_deductions
-- 3. Fix RLS policies for guide_performance_metrics

-- ===================================================
-- 1. Add branch_id to guide_certifications_tracker
-- ===================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guide_certifications_tracker' 
    AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.guide_certifications_tracker 
    ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    
    -- Set default branch_id from user's branch (guides are users with role 'guide')
    UPDATE public.guide_certifications_tracker gct
    SET branch_id = u.branch_id
    FROM public.users u
    WHERE gct.guide_id = u.id
    AND gct.branch_id IS NULL;
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_guide_certifications_tracker_branch_id 
    ON public.guide_certifications_tracker(branch_id);
  END IF;
END $$;

-- ===================================================
-- 2. Add description to salary_deductions
-- ===================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'salary_deductions' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.salary_deductions 
    ADD COLUMN description TEXT;
    
    -- Set default description based on deduction_type
    UPDATE public.salary_deductions
    SET description = CASE 
      WHEN deduction_type = 'late_penalty' THEN 'Late check-in penalty'
      WHEN deduction_type = 'no_documentation' THEN 'Missing documentation penalty'
      WHEN deduction_type = 'damage' THEN 'Asset damage deduction'
      ELSE reason -- Use the reason field as description for 'other' type
    END
    WHERE description IS NULL;
  END IF;
END $$;

-- ===================================================
-- 3. Fix RLS Policies for guide_performance_metrics
-- ===================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Guides can view own metrics" ON public.guide_performance_metrics;
DROP POLICY IF EXISTS "Guides can insert own metrics" ON public.guide_performance_metrics;
DROP POLICY IF EXISTS "Guides can update own metrics" ON public.guide_performance_metrics;
DROP POLICY IF EXISTS "System can manage metrics" ON public.guide_performance_metrics;

-- Enable RLS
ALTER TABLE public.guide_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Guides can view their own metrics
CREATE POLICY "Guides can view own metrics" 
ON public.guide_performance_metrics
FOR SELECT
TO authenticated
USING (
  guide_id = auth.uid()
  OR
  -- Allow service role
  auth.jwt()->>'role' = 'service_role'
);

-- Policy: Guides can insert their own metrics
CREATE POLICY "Guides can insert own metrics" 
ON public.guide_performance_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  guide_id = auth.uid()
  OR
  -- Allow service role
  auth.jwt()->>'role' = 'service_role'
);

-- Policy: Guides can update their own metrics
CREATE POLICY "Guides can update own metrics" 
ON public.guide_performance_metrics
FOR UPDATE
TO authenticated
USING (
  guide_id = auth.uid()
  OR
  -- Allow service role
  auth.jwt()->>'role' = 'service_role'
)
WITH CHECK (
  guide_id = auth.uid()
  OR
  -- Allow service role
  auth.jwt()->>'role' = 'service_role'
);

-- Policy: Admin/Staff can view all metrics
CREATE POLICY "Admin can view all metrics" 
ON public.guide_performance_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'ops_admin', 'finance_manager')
  )
  OR
  auth.jwt()->>'role' = 'service_role'
);

-- ===================================================
-- 4. Update RLS Policies for guide_certifications_tracker
-- ===================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Guides can view own certifications" ON public.guide_certifications_tracker;
DROP POLICY IF EXISTS "Guides can insert own certifications" ON public.guide_certifications_tracker;
DROP POLICY IF EXISTS "Guides can update own certifications" ON public.guide_certifications_tracker;

-- Enable RLS
ALTER TABLE public.guide_certifications_tracker ENABLE ROW LEVEL SECURITY;

-- Policy: Guides can view their own certifications
CREATE POLICY "Guides can view own certifications" 
ON public.guide_certifications_tracker
FOR SELECT
TO authenticated
USING (
  guide_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'ops_admin', 'finance_manager')
  )
);

-- Policy: Guides can insert their own certifications
CREATE POLICY "Guides can insert own certifications" 
ON public.guide_certifications_tracker
FOR INSERT
TO authenticated
WITH CHECK (
  guide_id = auth.uid()
);

-- Policy: Guides can update their own certifications
CREATE POLICY "Guides can update own certifications" 
ON public.guide_certifications_tracker
FOR UPDATE
TO authenticated
USING (guide_id = auth.uid())
WITH CHECK (guide_id = auth.uid());

-- ===================================================
-- 5. Grant necessary permissions
-- ===================================================

GRANT SELECT, INSERT, UPDATE ON public.guide_certifications_tracker TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.guide_performance_metrics TO authenticated;
GRANT SELECT ON public.salary_deductions TO authenticated;

-- ===================================================
-- Comments
-- ===================================================

COMMENT ON COLUMN public.guide_certifications_tracker.branch_id IS 'Branch where the guide is assigned';
COMMENT ON COLUMN public.salary_deductions.description IS 'Human-readable description of the deduction';

