-- Migration: 034-guide-enhancement-default-data.sql
-- Description: Default data for Guide Enhancement System
-- Date: 2025-12-19

-- ============================================
-- DEFAULT ONBOARDING STEPS
-- ============================================

-- Insert default onboarding steps (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guide_onboarding_steps WHERE step_order = 1 AND branch_id IS NULL) THEN
    INSERT INTO guide_onboarding_steps (branch_id, step_order, step_type, title, description, instructions, is_required, estimated_minutes, resource_type, validation_type)
    VALUES
      (NULL, 1, 'profile_setup', 'Lengkapi Profil', 'Lengkapi informasi profil Anda', 'Isi semua informasi yang diperlukan di halaman profil', true, 10, 'form', 'auto'),
      (NULL, 2, 'document', 'Upload Dokumen', 'Upload dokumen yang diperlukan', 'Upload KTP, SIM, dan dokumen lainnya', true, 15, 'form', 'manual'),
      (NULL, 3, 'training', 'Video Pelatihan Dasar', 'Tonton video pelatihan dasar', 'Pelajari SOP dan standar pelayanan', true, 30, 'video', 'auto'),
      (NULL, 4, 'assessment', 'Kuis Keselamatan', 'Uji pengetahuan keselamatan', 'Jawab pertanyaan tentang keselamatan dan SOP', true, 15, 'quiz', 'auto'),
      (NULL, 5, 'profile_setup', 'Informasi Bank', 'Tambahkan informasi rekening bank', 'Isi informasi rekening untuk pembayaran', true, 5, 'form', 'auto'),
      (NULL, 6, 'profile_setup', 'Kontak Darurat', 'Tambahkan kontak darurat', 'Isi informasi kontak darurat', true, 5, 'form', 'auto'),
      (NULL, 7, 'training', 'Video Customer Service', 'Pelajari teknik customer service', 'Tonton video tentang cara melayani customer dengan baik', false, 20, 'video', 'auto'),
      (NULL, 8, 'assessment', 'Self Assessment Awal', 'Isi self assessment awal', 'Evaluasi kemampuan dan pengalaman Anda', false, 20, 'survey', 'auto');
  END IF;
END $$;

-- ============================================
-- DEFAULT ASSESSMENT TEMPLATES
-- ============================================

-- Insert default assessment templates (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guide_assessment_templates WHERE name = 'Self Assessment - Komunikasi' AND branch_id IS NULL) THEN
    INSERT INTO guide_assessment_templates (branch_id, name, description, category, assessment_type, estimated_minutes, passing_score, questions, scoring_config, result_categories, is_recurring, recurrence_interval, is_required)
    VALUES
      (
        NULL,
        'Self Assessment - Komunikasi',
        'Evaluasi kemampuan komunikasi dan customer service',
        'self_assessment',
        'rating',
        15,
        NULL,
        '[
          {
            "id": "q1",
            "type": "rating",
            "question": "Bagaimana kemampuan Anda dalam menjelaskan informasi kompleks kepada turis?",
            "scale": 5,
            "required": true,
            "weight": 20,
            "category": "communication"
          },
          {
            "id": "q2",
            "type": "rating",
            "question": "Seberapa nyaman Anda berbicara dalam bahasa Inggris?",
            "scale": 5,
            "required": true,
            "weight": 20,
            "category": "language"
          },
          {
            "id": "q3",
            "type": "rating",
            "question": "Bagaimana kemampuan Anda menangani keluhan customer?",
            "scale": 5,
            "required": true,
            "weight": 20,
            "category": "customer_service"
          },
          {
            "id": "q4",
            "type": "rating",
            "question": "Seberapa baik Anda dalam menjelaskan sejarah dan budaya lokal?",
            "scale": 5,
            "required": true,
            "weight": 20,
            "category": "knowledge"
          },
          {
            "id": "q5",
            "type": "rating",
            "question": "Bagaimana kemampuan Anda dalam memimpin grup wisata?",
            "scale": 5,
            "required": true,
            "weight": 20,
            "category": "leadership"
          }
        ]'::jsonb,
        '{"method": "weighted_average", "scale": 5}'::jsonb,
        '[
          {"min": 4.5, "max": 5.0, "category": "Excellent", "description": "Kemampuan komunikasi sangat baik"},
          {"min": 3.5, "max": 4.4, "category": "Good", "description": "Kemampuan komunikasi baik"},
          {"min": 2.5, "max": 3.4, "category": "Average", "description": "Kemampuan komunikasi cukup"},
          {"min": 1.0, "max": 2.4, "category": "Needs Improvement", "description": "Perlu peningkatan"}
        ]'::jsonb,
        true,
        90,
        false
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM guide_assessment_templates WHERE name = 'Kuis Keselamatan' AND branch_id IS NULL) THEN
    INSERT INTO guide_assessment_templates (branch_id, name, description, category, assessment_type, estimated_minutes, passing_score, questions, scoring_config, result_categories, is_recurring, recurrence_interval, is_required)
    VALUES
      (
        NULL,
        'Kuis Keselamatan',
        'Uji pengetahuan tentang keselamatan dan SOP',
        'skills_evaluation',
        'quiz',
        20,
        70,
        '[
          {
            "id": "q1",
            "type": "multiple_choice",
            "question": "Apa yang harus dilakukan jika ada turis yang sakit selama trip?",
            "options": [
              "Lanjutkan trip seperti biasa",
              "Hubungi ops dan bawa ke fasilitas kesehatan terdekat",
              "Biarkan turis istirahat di hotel",
              "Tunggu sampai turis sembuh"
            ],
            "correct_answer": 1,
            "required": true,
            "weight": 25,
            "category": "safety"
          },
          {
            "id": "q2",
            "type": "multiple_choice",
            "question": "Kapan harus menggunakan life jacket?",
            "options": [
              "Hanya saat badai",
              "Selalu saat aktivitas air",
              "Hanya untuk yang tidak bisa berenang",
              "Tidak perlu"
            ],
            "correct_answer": 1,
            "required": true,
            "weight": 25,
            "category": "safety"
          },
          {
            "id": "q3",
            "type": "multiple_choice",
            "question": "Apa yang harus dilakukan jika cuaca memburuk?",
            "options": [
              "Lanjutkan trip",
              "Cari tempat aman dan hubungi ops",
              "Tunggu sampai cuaca membaik",
              "Biarkan turis memutuskan"
            ],
            "correct_answer": 1,
            "required": true,
            "weight": 25,
            "category": "safety"
          },
          {
            "id": "q4",
            "type": "multiple_choice",
            "question": "Bagaimana cara menangani emergency?",
            "options": [
              "Panik dan minta bantuan",
              "Tetap tenang, hubungi emergency contact, ikuti SOP",
              "Tunggu bantuan datang",
              "Biarkan turis menangani sendiri"
            ],
            "correct_answer": 1,
            "required": true,
            "weight": 25,
            "category": "safety"
          }
        ]'::jsonb,
        '{"method": "percentage_correct", "passing_score": 70}'::jsonb,
        '[
          {"min": 90, "max": 100, "category": "Excellent", "description": "Pengetahuan keselamatan sangat baik"},
          {"min": 70, "max": 89, "category": "Pass", "description": "Pengetahuan keselamatan cukup"},
          {"min": 0, "max": 69, "category": "Fail", "description": "Perlu belajar lebih lanjut"}
        ]'::jsonb,
        false,
        NULL,
        true
      );
  END IF;
END $$;

-- ============================================
-- DEFAULT SKILLS CATALOG
-- ============================================

-- Insert default skills catalog (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guide_skills_catalog WHERE name = 'Bahasa Inggris' AND branch_id IS NULL) THEN
    INSERT INTO guide_skills_catalog (branch_id, name, description, category, icon_name, levels, validation_method, requires_certification, display_order)
    VALUES
      (
        NULL,
        'Bahasa Inggris',
        'Kemampuan berkomunikasi dalam bahasa Inggris',
        'language',
        'Globe',
        '[
          {"level": 1, "name": "Basic", "description": "Dapat berkomunikasi dasar", "requirements": ["Dapat memperkenalkan diri", "Dapat memberikan instruksi sederhana"]},
          {"level": 2, "name": "Intermediate", "description": "Dapat berkomunikasi dengan baik", "requirements": ["Dapat menjelaskan itinerary", "Dapat menjawab pertanyaan umum"]},
          {"level": 3, "name": "Advanced", "description": "Fasih berkomunikasi", "requirements": ["Dapat menjelaskan sejarah dan budaya", "Dapat menangani situasi kompleks"]},
          {"level": 4, "name": "Fluent", "description": "Sangat fasih", "requirements": ["Native-like fluency", "Dapat memberikan presentasi"]},
          {"level": 5, "name": "Native", "description": "Seperti native speaker", "requirements": ["Native-level proficiency"]}
        ]'::jsonb,
        'assessment',
        false,
        1
      ),
      (
        NULL,
        'Renang',
        'Kemampuan berenang untuk aktivitas air',
        'activity',
        'Waves',
        '[
          {"level": 1, "name": "Basic", "description": "Dapat berenang dasar", "requirements": ["Dapat berenang 25 meter", "Dapat mengapung"]},
          {"level": 2, "name": "Intermediate", "description": "Dapat berenang dengan baik", "requirements": ["Dapat berenang 100 meter", "Dapat berbagai gaya renang"]},
          {"level": 3, "name": "Advanced", "description": "Perenang handal", "requirements": ["Dapat berenang 500 meter", "Dapat menyelam dasar"]},
          {"level": 4, "name": "Expert", "description": "Perenang profesional", "requirements": ["Dapat berenang jarak jauh", "Dapat menyelam dalam"]},
          {"level": 5, "name": "Professional", "description": "Instruktur renang", "requirements": ["Sertifikasi instruktur", "Dapat menyelamatkan orang tenggelam"]}
        ]'::jsonb,
        'certification',
        true,
        2
      ),
      (
        NULL,
        'First Aid',
        'Kemampuan pertolongan pertama',
        'safety',
        'Heart',
        '[
          {"level": 1, "name": "Basic", "description": "Pengetahuan dasar first aid", "requirements": ["Dapat menangani luka ringan", "Dapat melakukan CPR dasar"]},
          {"level": 2, "name": "Intermediate", "description": "Sertifikasi first aid", "requirements": ["Sertifikasi first aid", "Dapat menangani berbagai situasi"]},
          {"level": 3, "name": "Advanced", "description": "Advanced first aid", "requirements": ["Sertifikasi advanced", "Dapat menangani emergency"]},
          {"level": 4, "name": "Expert", "description": "Paramedic level", "requirements": ["Sertifikasi paramedic", "Dapat menangani situasi kritis"]},
          {"level": 5, "name": "Professional", "description": "Medical professional", "requirements": ["Sertifikasi medis", "Dapat memberikan perawatan medis"]}
        ]'::jsonb,
        'certification',
        true,
        3
      ),
      (
        NULL,
        'Fotografi',
        'Kemampuan mengambil foto yang baik',
        'technical',
        'Camera',
        '[
          {"level": 1, "name": "Basic", "description": "Dapat mengambil foto dasar", "requirements": ["Dapat menggunakan kamera smartphone", "Dapat mengambil foto grup"]},
          {"level": 2, "name": "Intermediate", "description": "Dapat mengambil foto yang baik", "requirements": ["Dapat menggunakan kamera DSLR", "Dapat editing dasar"]},
          {"level": 3, "name": "Advanced", "description": "Fotografer handal", "requirements": ["Dapat mengambil foto profesional", "Dapat editing advanced"]},
          {"level": 4, "name": "Expert", "description": "Fotografer profesional", "requirements": ["Portfolio profesional", "Dapat berbagai teknik"]},
          {"level": 5, "name": "Professional", "description": "Fotografer master", "requirements": ["Sertifikasi profesional", "Dapat mengajar fotografi"]}
        ]'::jsonb,
        'self_claim',
        false,
        4
      ),
      (
        NULL,
        'Snorkeling Guide',
        'Kemampuan memandu aktivitas snorkeling',
        'activity',
        'Waves',
        '[
          {"level": 1, "name": "Basic", "description": "Dapat snorkeling dasar", "requirements": ["Dapat menggunakan peralatan snorkeling", "Dapat mengapung"]},
          {"level": 2, "name": "Intermediate", "description": "Dapat memandu snorkeling", "requirements": ["Dapat memandu grup kecil", "Dapat menjelaskan teknik"]},
          {"level": 3, "name": "Advanced", "description": "Pemandu snorkeling handal", "requirements": ["Dapat memandu grup besar", "Dapat menangani masalah"]},
          {"level": 4, "name": "Expert", "description": "Pemandu profesional", "requirements": ["Sertifikasi PADI atau sejenis", "Dapat diving dasar"]},
          {"level": 5, "name": "Professional", "description": "Instruktur diving", "requirements": ["Sertifikasi instruktur", "Dapat mengajar diving"]}
        ]'::jsonb,
        'certification',
        true,
        5
      );
  END IF;
END $$;
