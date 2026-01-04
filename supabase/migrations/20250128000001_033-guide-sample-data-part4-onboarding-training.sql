-- Migration: 033-guide-sample-data-part4-onboarding-training.sql
-- Description: Sample data for Part 4 - Onboarding & Training Data
-- Created: 2025-01-28
-- 
-- This migration creates sample data for:
-- - Onboarding progress for multiple guides
-- - Training sessions and attendance
-- - Assessments (completed and in-progress)
-- - Skills and skill goals

BEGIN;

DO $$
DECLARE
  sample_branch_id UUID;
  guide1_id UUID; -- Veteran Lead Guide
  guide2_id UUID; -- New Support Guide
  guide3_id UUID; -- Guide with Issues
  guide4_id UUID; -- Guide on Vacation
  guide5_id UUID; -- Experienced Guide
  guide6_id UUID; -- Guide Pending Contract
  guide7_id UUID; -- Guide with Special Cases
  
  onboarding_step1_id UUID;
  onboarding_step2_id UUID;
  onboarding_step3_id UUID;
  onboarding_step4_id UUID;
  onboarding_step5_id UUID;
  
  training_module1_id UUID;
  training_module2_id UUID;
  training_module3_id UUID;
  
  assessment_template1_id UUID;
  assessment_template2_id UUID;
  
  skill1_id UUID;
  skill2_id UUID;
  skill3_id UUID;
  
  training_session1_id UUID;
  training_session2_id UUID;
  training_session3_id UUID;
  
  onboarding_progress1_id UUID;
  onboarding_progress2_id UUID;
  onboarding_progress3_id UUID;
  
  admin_user_id UUID;
  
BEGIN
  -- Get branch and guides
  SELECT id INTO sample_branch_id FROM branches LIMIT 1;
  IF sample_branch_id IS NULL THEN
    RAISE NOTICE 'No branch found, skipping sample data';
    RETURN;
  END IF;
  
  SELECT id INTO guide1_id FROM users WHERE role = 'guide' LIMIT 1;
  IF guide1_id IS NULL THEN
    RAISE NOTICE 'No guide users found, skipping sample data';
    RETURN;
  END IF;
  
  -- Get admin user for created_by fields
  SELECT id INTO admin_user_id FROM users WHERE role IN ('super_admin', 'ops_admin') LIMIT 1;
  IF admin_user_id IS NULL THEN
    admin_user_id := guide1_id; -- Fallback to guide if no admin
  END IF;
  
  -- Use same guide for all (in real scenario would be different users)
  guide2_id := guide1_id;
  guide3_id := guide1_id;
  guide4_id := guide1_id;
  guide5_id := guide1_id;
  guide6_id := guide1_id;
  guide7_id := guide1_id;
  
  -- Get onboarding steps (use first available for each step_order, ensure only one row per query)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_onboarding_steps') THEN
    SELECT id INTO onboarding_step1_id FROM guide_onboarding_steps WHERE step_order = 1 AND (branch_id = sample_branch_id OR branch_id IS NULL) ORDER BY COALESCE(branch_id::text, '') DESC, id LIMIT 1;
    SELECT id INTO onboarding_step2_id FROM guide_onboarding_steps WHERE step_order = 2 AND (branch_id = sample_branch_id OR branch_id IS NULL) ORDER BY COALESCE(branch_id::text, '') DESC, id LIMIT 1;
    SELECT id INTO onboarding_step3_id FROM guide_onboarding_steps WHERE step_order = 3 AND (branch_id = sample_branch_id OR branch_id IS NULL) ORDER BY COALESCE(branch_id::text, '') DESC, id LIMIT 1;
    SELECT id INTO onboarding_step4_id FROM guide_onboarding_steps WHERE step_order = 4 AND (branch_id = sample_branch_id OR branch_id IS NULL) ORDER BY COALESCE(branch_id::text, '') DESC, id LIMIT 1;
    SELECT id INTO onboarding_step5_id FROM guide_onboarding_steps WHERE step_order = 5 AND (branch_id = sample_branch_id OR branch_id IS NULL) ORDER BY COALESCE(branch_id::text, '') DESC, id LIMIT 1;
  END IF;
  
  -- Get training modules (ensure single value with LIMIT 1)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_training_modules') THEN
    SELECT id INTO training_module1_id FROM guide_training_modules WHERE is_active = true ORDER BY id LIMIT 1;
    SELECT id INTO training_module2_id FROM guide_training_modules WHERE is_active = true ORDER BY id OFFSET 1 LIMIT 1;
    SELECT id INTO training_module3_id FROM guide_training_modules WHERE is_active = true ORDER BY id OFFSET 2 LIMIT 1;
  END IF;
  
  -- Get assessment templates (ensure single value with LIMIT 1)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_assessment_templates') THEN
    SELECT id INTO assessment_template1_id FROM guide_assessment_templates WHERE is_active = true ORDER BY id LIMIT 1;
    SELECT id INTO assessment_template2_id FROM guide_assessment_templates WHERE is_active = true ORDER BY id OFFSET 1 LIMIT 1;
  END IF;
  
  -- Get skills (ensure single value with LIMIT 1)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_skills_catalog') THEN
    SELECT id INTO skill1_id FROM guide_skills_catalog WHERE category = 'language' AND is_active = true ORDER BY id LIMIT 1;
    SELECT id INTO skill2_id FROM guide_skills_catalog WHERE category = 'activity' AND is_active = true ORDER BY id LIMIT 1;
    SELECT id INTO skill3_id FROM guide_skills_catalog WHERE category = 'safety' AND is_active = true ORDER BY id LIMIT 1;
  END IF;

  -- ============================================
  -- PART 4.1: ONBOARDING PROGRESS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_onboarding_progress') THEN
    -- Guide 1: Completed onboarding
    INSERT INTO guide_onboarding_progress (guide_id, current_step_id, started_at, completed_at, status, completion_percentage)
    VALUES (guide1_id, NULL, NOW() - INTERVAL '6 months', NOW() - INTERVAL '5 months', 'completed', 100)
    ON CONFLICT (guide_id) DO UPDATE SET
      status = 'completed',
      completion_percentage = 100,
      completed_at = NOW() - INTERVAL '5 months';
    
    SELECT id INTO onboarding_progress1_id FROM guide_onboarding_progress WHERE guide_id = guide1_id ORDER BY id LIMIT 1;
    
    -- Guide 1: Step completions
    IF onboarding_progress1_id IS NOT NULL AND onboarding_step1_id IS NOT NULL THEN
      -- Insert step completions one by one to avoid multiple rows issue
      DECLARE
        step_rec RECORD;
      BEGIN
        FOR step_rec IN 
          SELECT id FROM guide_onboarding_steps
          WHERE (branch_id = sample_branch_id OR branch_id IS NULL)
          AND is_active = true
          ORDER BY step_order, id
        LOOP
          INSERT INTO guide_onboarding_step_completions (progress_id, step_id, completed_at, status)
          VALUES (onboarding_progress1_id, step_rec.id, NOW() - INTERVAL '5 months', 'completed')
          ON CONFLICT DO NOTHING;
        END LOOP;
      END;
    END IF;
    
    -- Guide 2: In-progress onboarding (80% complete)
    INSERT INTO guide_onboarding_progress (guide_id, current_step_id, started_at, completed_at, status, completion_percentage)
    VALUES (guide2_id, onboarding_step5_id, NOW() - INTERVAL '1 week', NULL, 'in_progress', 80)
    ON CONFLICT (guide_id) DO UPDATE SET
      status = 'in_progress',
      completion_percentage = 80,
      current_step_id = onboarding_step5_id;
    
    SELECT id INTO onboarding_progress2_id FROM guide_onboarding_progress WHERE guide_id = guide2_id ORDER BY id LIMIT 1;
    
    -- Guide 2: Partial step completions
    IF onboarding_progress2_id IS NOT NULL THEN
      INSERT INTO guide_onboarding_step_completions (progress_id, step_id, completed_at, status)
      VALUES
        (onboarding_progress2_id, onboarding_step1_id, NOW() - INTERVAL '5 days', 'completed'),
        (onboarding_progress2_id, onboarding_step2_id, NOW() - INTERVAL '4 days', 'completed'),
        (onboarding_progress2_id, onboarding_step3_id, NOW() - INTERVAL '3 days', 'completed'),
        (onboarding_progress2_id, onboarding_step4_id, NOW() - INTERVAL '2 days', 'completed')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Guide 6: New guide, just started (10% complete)
    INSERT INTO guide_onboarding_progress (guide_id, current_step_id, started_at, completed_at, status, completion_percentage)
    VALUES (guide6_id, onboarding_step1_id, NOW() - INTERVAL '2 days', NULL, 'in_progress', 10)
    ON CONFLICT (guide_id) DO UPDATE SET
      status = 'in_progress',
      completion_percentage = 10,
      current_step_id = onboarding_step1_id;
    
    SELECT id INTO onboarding_progress3_id FROM guide_onboarding_progress WHERE guide_id = guide6_id ORDER BY id LIMIT 1;
  END IF;

  -- ============================================
  -- PART 4.2: TRAINING DATA
  -- ============================================
  
  -- Training Sessions (insert one by one to avoid RETURNING multiple rows)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_sessions') THEN
    -- Insert session 1
    INSERT INTO training_sessions (branch_id, session_name, session_type, description, session_date, session_time, duration_minutes, location, status, created_by)
    VALUES (sample_branch_id, 'Training SOP Keamanan - Januari 2025', 'safety', 'Pelatihan SOP keamanan dan prosedur darurat', CURRENT_DATE - INTERVAL '2 weeks', '09:00:00', 180, 'Kantor Operasional', 'completed', admin_user_id)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO training_session1_id FROM training_sessions WHERE session_name = 'Training SOP Keamanan - Januari 2025' AND branch_id = sample_branch_id ORDER BY id LIMIT 1;
    
    -- Insert session 2
    INSERT INTO training_sessions (branch_id, session_name, session_type, description, session_date, session_time, duration_minutes, location, status, created_by)
    VALUES (sample_branch_id, 'Workshop Customer Service', 'other', 'Pelatihan teknik melayani customer dengan baik', CURRENT_DATE - INTERVAL '1 week', '10:00:00', 120, 'Kantor Operasional', 'completed', admin_user_id)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO training_session2_id FROM training_sessions WHERE session_name = 'Workshop Customer Service' AND branch_id = sample_branch_id ORDER BY id LIMIT 1;
    
    -- Insert session 3
    INSERT INTO training_sessions (branch_id, session_name, session_type, description, session_date, session_time, duration_minutes, location, status, created_by)
    VALUES (sample_branch_id, 'Training Pertolongan Pertama', 'safety', 'Pelatihan P3K dan pertolongan pertama', CURRENT_DATE + INTERVAL '1 week', '09:00:00', 240, 'Kantor Operasional', 'scheduled', admin_user_id)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO training_session3_id FROM training_sessions WHERE session_name = 'Training Pertolongan Pertama' AND branch_id = sample_branch_id ORDER BY id LIMIT 1;
    
    -- Training Attendance (only if sessions exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_attendance') AND training_session1_id IS NOT NULL THEN
      INSERT INTO training_attendance (session_id, guide_id, branch_id, status, checked_in_at)
      VALUES
        (training_session1_id, guide1_id, sample_branch_id, 'present', NOW() - INTERVAL '2 weeks' + INTERVAL '9 hours')
      ON CONFLICT DO NOTHING;
      
      IF training_session2_id IS NOT NULL THEN
        INSERT INTO training_attendance (session_id, guide_id, branch_id, status, checked_in_at)
        VALUES
          (training_session2_id, guide1_id, sample_branch_id, 'present', NOW() - INTERVAL '1 week' + INTERVAL '10 hours')
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    
    -- Training Certificates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_certificates') AND training_session1_id IS NOT NULL THEN
      INSERT INTO training_certificates (session_id, guide_id, branch_id, certificate_number, certificate_pdf_url, quiz_passed, is_issued, issued_at)
      VALUES
        (training_session1_id, guide1_id, sample_branch_id, 'CERT-SAF-2025-001', 'https://example.com/certificates/cert-001.pdf', true, true, NOW() - INTERVAL '2 weeks' + INTERVAL '12 hours'),
        (training_session1_id, guide5_id, sample_branch_id, 'CERT-SAF-2025-002', 'https://example.com/certificates/cert-002.pdf', true, true, NOW() - INTERVAL '2 weeks' + INTERVAL '12 hours'),
        (training_session2_id, guide1_id, sample_branch_id, 'CERT-CS-2025-001', 'https://example.com/certificates/cert-003.pdf', true, true, NOW() - INTERVAL '1 week' + INTERVAL '12 hours')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Training Progress (from guide_training_modules) - insert one by one to avoid conflict
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_training_progress') AND training_module1_id IS NOT NULL THEN
    INSERT INTO guide_training_progress (guide_id, module_id, status, progress_percent, completed_at, score)
    VALUES (guide1_id, training_module1_id, 'completed', 100, NOW() - INTERVAL '3 months', 95)
    ON CONFLICT (guide_id, module_id) DO UPDATE SET
      status = EXCLUDED.status,
      progress_percent = EXCLUDED.progress_percent;
    
    IF training_module2_id IS NOT NULL THEN
      INSERT INTO guide_training_progress (guide_id, module_id, status, progress_percent, completed_at, score)
      VALUES (guide1_id, training_module2_id, 'completed', 100, NOW() - INTERVAL '2 months', 88)
      ON CONFLICT (guide_id, module_id) DO UPDATE SET
        status = EXCLUDED.status,
        progress_percent = EXCLUDED.progress_percent;
    END IF;
    
    INSERT INTO guide_training_progress (guide_id, module_id, status, progress_percent, completed_at, score)
    VALUES (guide5_id, training_module1_id, 'completed', 100, NOW() - INTERVAL '2 months', 92)
    ON CONFLICT (guide_id, module_id) DO UPDATE SET
      status = EXCLUDED.status,
      progress_percent = EXCLUDED.progress_percent;
    
    INSERT INTO guide_training_progress (guide_id, module_id, status, progress_percent, completed_at, score)
    VALUES (guide2_id, training_module1_id, 'in_progress', 60, NULL, NULL)
    ON CONFLICT (guide_id, module_id) DO UPDATE SET
      status = EXCLUDED.status,
      progress_percent = EXCLUDED.progress_percent;
    
    INSERT INTO guide_training_progress (guide_id, module_id, status, progress_percent, completed_at, score)
    VALUES (guide6_id, training_module1_id, 'not_started', 0, NULL, NULL)
    ON CONFLICT (guide_id, module_id) DO UPDATE SET
      status = EXCLUDED.status,
      progress_percent = EXCLUDED.progress_percent;
  END IF;
  
  -- Mandatory Trainings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_mandatory_trainings') THEN
    INSERT INTO guide_mandatory_trainings (guide_id, branch_id, training_type, required_completion_date, status, completed_at)
    VALUES
      (guide2_id, sample_branch_id, 'safety', CURRENT_DATE + INTERVAL '30 days', 'pending', NULL),
      (guide6_id, sample_branch_id, 'safety', CURRENT_DATE + INTERVAL '45 days', 'pending', NULL),
      (guide1_id, sample_branch_id, 'safety', CURRENT_DATE - INTERVAL '10 days', 'completed', CURRENT_DATE - INTERVAL '10 days')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Compliance Education
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_compliance_education') THEN
    INSERT INTO guide_compliance_education (guide_id, branch_id, module_name, module_type, completed_at, score)
    VALUES
      (guide1_id, sample_branch_id, 'ISO 21101 - Safety Standards', 'iso_compliance', NOW() - INTERVAL '1 month', 90),
      (guide1_id, sample_branch_id, 'Environmental Protection Guidelines', 'environmental', NOW() - INTERVAL '3 weeks', 85),
      (guide5_id, sample_branch_id, 'ISO 21101 - Safety Standards', 'iso_compliance', NOW() - INTERVAL '2 weeks', 88)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 4.3: ASSESSMENTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_assessments') AND assessment_template1_id IS NOT NULL THEN
    -- Guide 1: Completed assessment with high score
    INSERT INTO guide_assessments (guide_id, template_id, started_at, completed_at, answers, score, category, status, insights)
    VALUES
      (guide1_id, assessment_template1_id, NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months', 
       '{"q1": 5, "q2": 5, "q3": 5, "q4": 4, "q5": 5}'::jsonb, 
       96, 'Excellent', 'completed',
       '{"summary": "Kemampuan komunikasi sangat baik", "recommendations": ["Terus pertahankan kualitas pelayanan", "Bisa menjadi mentor untuk guide baru"]}'::jsonb)
    ON CONFLICT DO NOTHING;
    
    -- Guide 2: Completed assessment with medium score
    INSERT INTO guide_assessments (guide_id, template_id, started_at, completed_at, answers, score, category, status)
    VALUES
      (guide2_id, assessment_template1_id, NOW() - INTERVAL '1 week', NOW() - INTERVAL '6 days',
       '{"q1": 3, "q2": 4, "q3": 3, "q4": 3, "q5": 3}'::jsonb,
       68, 'Average', 'completed')
    ON CONFLICT DO NOTHING;
    
    -- Guide 6: In-progress assessment
    INSERT INTO guide_assessments (guide_id, template_id, started_at, completed_at, answers, score, category, status)
    VALUES
      (guide6_id, assessment_template1_id, NOW() - INTERVAL '1 day', NULL,
       '{"q1": 4, "q2": null, "q3": null, "q4": null, "q5": null}'::jsonb,
       NULL, NULL, 'in_progress')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 4.4: SKILLS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_skills') THEN
    -- Guide 1: Multiple validated skills
    IF skill1_id IS NOT NULL THEN
      INSERT INTO guide_skills (guide_id, skill_id, current_level, target_level, status, validated_at, validated_by)
      VALUES
        (guide1_id, skill1_id, 5, 5, 'validated', NOW() - INTERVAL '6 months', admin_user_id)
      ON CONFLICT (guide_id, skill_id) DO UPDATE SET
        current_level = 5,
        status = 'validated';
    END IF;
    
    IF skill2_id IS NOT NULL THEN
      -- Insert one by one to avoid conflict on same key
      INSERT INTO guide_skills (guide_id, skill_id, current_level, target_level, status, validated_at)
      VALUES (guide1_id, skill2_id, 4, 5, 'validated', NOW() - INTERVAL '4 months')
      ON CONFLICT (guide_id, skill_id) DO UPDATE SET
        current_level = EXCLUDED.current_level;
      
      INSERT INTO guide_skills (guide_id, skill_id, current_level, target_level, status, validated_at)
      VALUES (guide5_id, skill2_id, 5, 5, 'validated', NOW() - INTERVAL '3 months')
      ON CONFLICT (guide_id, skill_id) DO UPDATE SET
        current_level = EXCLUDED.current_level;
    END IF;
    
    IF skill3_id IS NOT NULL THEN
      -- Insert one by one to avoid conflict on same key
      INSERT INTO guide_skills (guide_id, skill_id, current_level, target_level, status)
      VALUES (guide1_id, skill3_id, 5, 5, 'validated')
      ON CONFLICT (guide_id, skill_id) DO UPDATE SET
        current_level = EXCLUDED.current_level;
      
      INSERT INTO guide_skills (guide_id, skill_id, current_level, target_level, status)
      VALUES (guide2_id, skill3_id, 2, 4, 'claimed')
      ON CONFLICT (guide_id, skill_id) DO UPDATE SET
        current_level = EXCLUDED.current_level;
      
      INSERT INTO guide_skills (guide_id, skill_id, current_level, target_level, status)
      VALUES (guide5_id, skill3_id, 4, 5, 'validated')
      ON CONFLICT (guide_id, skill_id) DO UPDATE SET
        current_level = EXCLUDED.current_level;
    END IF;
    
    -- Skill Goals
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_skill_goals') AND skill2_id IS NOT NULL THEN
      INSERT INTO guide_skill_goals (guide_id, skill_id, target_level, target_date, status)
      VALUES
        (guide2_id, skill2_id, 4, CURRENT_DATE + INTERVAL '3 months', 'active'),
        (guide2_id, skill1_id, 3, CURRENT_DATE + INTERVAL '6 months', 'active')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RAISE NOTICE 'Part 4 completed: Onboarding & Training data created';
  
END $$;

COMMIT;

