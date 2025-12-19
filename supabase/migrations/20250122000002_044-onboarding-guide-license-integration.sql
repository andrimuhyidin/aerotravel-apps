-- Migration: 044-onboarding-guide-license-integration.sql
-- Description: Update onboarding steps to integrate with Guide License journey
-- Created: 2025-01-22

BEGIN;

-- ============================================
-- UPDATE EXISTING ONBOARDING STEPS
-- ============================================

-- Update Step 2: Upload Dokumen - Make it specific to Guide License requirements
UPDATE guide_onboarding_steps
SET 
  title = 'Upload Dokumen Wajib',
  description = 'Upload dokumen yang diperlukan untuk Guide License',
  instructions = 'Upload 4 dokumen wajib: KTP, SKCK, Surat Kesehatan, dan Foto Formal. Dokumen ini diperlukan untuk mendapatkan AeroTravel Guide License (ATGL).',
  resource_url = '/guide/profile/edit#documents',
  resource_type = 'form'
WHERE 
  step_order = 2 
  AND branch_id IS NULL
  AND step_type = 'document';

-- ============================================
-- ADD NEW STEP: Guide License Application
-- ============================================

-- Check if step 9 (Guide License) already exists, if not, add it
DO $$
DECLARE
  max_order INTEGER;
  license_step_exists BOOLEAN;
BEGIN
  -- Get max step_order
  SELECT COALESCE(MAX(step_order), 0) INTO max_order
  FROM guide_onboarding_steps
  WHERE branch_id IS NULL;

  -- Check if Guide License step already exists
  SELECT EXISTS (
    SELECT 1 FROM guide_onboarding_steps
    WHERE branch_id IS NULL
    AND title ILIKE '%Guide License%'
  ) INTO license_step_exists;

  -- Add Guide License step if it doesn't exist
  IF NOT license_step_exists THEN
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
      max_order + 1,
      'profile_setup',
      'Apply Guide License',
      'Dapatkan AeroTravel Guide License (ATGL)',
      'Setelah menyelesaikan semua langkah onboarding, Anda dapat mengajukan Guide License. Pastikan semua persyaratan sudah terpenuhi: Profil lengkap, Kontrak ditandatangani, Dokumen terupload, Training selesai, dan Assessment selesai.',
      true,
      10,
      'link',
      '/guide/id-card',
      'auto'
    );
  END IF;
END $$;

-- ============================================
-- UPDATE STEP DEPENDENCIES (if needed)
-- ============================================

-- Ensure Guide License step depends on all previous required steps
-- This is handled by step_order, but we can add explicit dependency if needed

COMMIT;
