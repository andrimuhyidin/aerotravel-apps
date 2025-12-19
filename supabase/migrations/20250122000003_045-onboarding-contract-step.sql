-- Migration: 045-onboarding-contract-step.sql
-- Description: Add Contract Signing step to onboarding journey
-- Created: 2025-01-22

BEGIN;

-- ============================================
-- ADD CONTRACT STEP TO ONBOARDING
-- ============================================

-- Check if contract step already exists
DO $$
DECLARE
  contract_step_exists BOOLEAN;
  max_order INTEGER;
BEGIN
  -- Check if contract step exists
  SELECT EXISTS (
    SELECT 1 FROM guide_onboarding_steps
    WHERE branch_id IS NULL
    AND (title ILIKE '%kontrak%' OR title ILIKE '%contract%')
  ) INTO contract_step_exists;

  -- If not exists, add it
  IF NOT contract_step_exists THEN
    -- Get max step_order
    SELECT COALESCE(MAX(step_order), 0) INTO max_order
    FROM guide_onboarding_steps
    WHERE branch_id IS NULL;

    -- Shift existing steps 2-8 down to 3-9
    UPDATE guide_onboarding_steps
    SET step_order = step_order + 1
    WHERE branch_id IS NULL
    AND step_order >= 2
    AND step_order <= 8;

    -- Insert contract step at order 2
    INSERT INTO guide_onboarding_steps (
      branch_id,
      step_order,
      step_type,
      title,
      description,
      instructions,
      is_required,
      estimated_minutes,
      resource_type,
      resource_url,
      validation_type
    )
    VALUES (
      NULL,
      2,
      'profile_setup',
      'Tandatangani Kontrak Kerja',
      'Tandatangani kontrak kerja yang telah dikirim oleh admin',
      'Admin akan mengirim kontrak kerja untuk Anda. Baca terms & conditions dengan teliti, lalu tandatangani kontrak. Kontrak ini diperlukan untuk dapat bekerja sebagai guide dan mendapatkan Guide License.',
      true,
      10,
      'link',
      '/guide/contracts',
      'auto'
    );

    -- Move Guide License step to order 10 (if exists)
    UPDATE guide_onboarding_steps
    SET step_order = 10
    WHERE branch_id IS NULL
    AND title ILIKE '%Guide License%'
    AND step_order != 10;
  END IF;
END $$;

COMMIT;
