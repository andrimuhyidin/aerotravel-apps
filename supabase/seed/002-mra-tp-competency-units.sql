-- Seed Data: MRA-TP Competency Units
-- Purpose: ASEAN Tourism Professional Certification Board competency units
-- Run after: 20260103200016_144-mra-tp-certifications.sql

-- Core Tourism Guide Competencies (BNSP Standards)
INSERT INTO mra_tp_competency_units (
  unit_code,
  unit_title,
  description,
  category,
  level,
  minimum_score
) VALUES
-- Level 1: Foundation Competencies
(
  'TG-001',
  'Menerapkan Prinsip-Prinsip Pemanduan Wisata',
  'Memahami dan menerapkan prinsip dasar pemanduan wisata, etika profesi, dan standar pelayanan kepada wisatawan.',
  'foundation',
  1,
  70,
  true,
  3
),
(
  'TG-002',
  'Berkomunikasi dalam Bahasa Inggris Dasar',
  'Mampu berkomunikasi dengan wisatawan dalam bahasa Inggris tingkat dasar, termasuk memberikan informasi umum dan menjawab pertanyaan sederhana.',
  'language',
  1,
  70,
  true,
  4
),
(
  'TG-003',
  'Memberikan Informasi Destinasi Wisata',
  'Menyampaikan informasi akurat tentang destinasi wisata, sejarah, budaya, dan daya tarik lokal kepada wisatawan.',
  'knowledge',
  1,
  75,
  true,
  3
),
(
  'TG-004',
  'Menerapkan Prosedur Keselamatan Dasar',
  'Memahami dan menerapkan prosedur keselamatan dasar untuk wisatawan, termasuk identifikasi risiko dan tindakan pencegahan.',
  'safety',
  1,
  80,
  true,
  4
),
(
  'TG-005',
  'Mengelola Dinamika Kelompok',
  'Mengelola kelompok wisatawan dengan berbagai karakteristik, menangani situasi konflik, dan memastikan kepuasan kelompok.',
  'soft_skills',
  1,
  70,
  true,
  3
),

-- Level 2: Intermediate Competencies
(
  'TG-101',
  'Merancang dan Mengelola Tur',
  'Merencanakan itinerary, mengelola logistik perjalanan, dan memastikan kelancaran pelaksanaan tur dari awal hingga akhir.',
  'operations',
  2,
  75,
  true,
  4
),
(
  'TG-102',
  'Berkomunikasi dalam Bahasa Asing (Lanjutan)',
  'Komunikasi lanjutan dalam bahasa Inggris atau bahasa asing lainnya, termasuk presentasi kompleks dan diskusi mendalam.',
  'language',
  2,
  75,
  false,
  3
),
(
  'TG-103',
  'Memberikan Interpretasi Budaya',
  'Menyampaikan interpretasi mendalam tentang budaya lokal, tradisi, dan warisan budaya dengan cara yang engaging dan edukatif.',
  'knowledge',
  2,
  80,
  true,
  4
),
(
  'TG-104',
  'Menangani Situasi Darurat',
  'Mengambil tindakan cepat dan tepat dalam situasi darurat, termasuk pertolongan pertama, evakuasi, dan koordinasi dengan pihak berwenang.',
  'safety',
  2,
  85,
  true,
  5
),
(
  'TG-105',
  'Mengelola Keuangan Tur',
  'Mengelola budget perjalanan, transaksi keuangan, dan pelaporan biaya dengan akuntabel dan transparan.',
  'operations',
  2,
  70,
  false,
  3
),

-- Level 3: Advanced Competencies
(
  'TG-201',
  'Mengembangkan Produk Wisata Inovatif',
  'Merancang dan mengembangkan produk wisata baru yang inovatif, sustainable, dan sesuai dengan tren pasar.',
  'development',
  3,
  80,
  false,
  5
),
(
  'TG-202',
  'Menerapkan Prinsip Sustainable Tourism',
  'Menerapkan prinsip pariwisata berkelanjutan, menjaga kelestarian lingkungan, dan memberdayakan masyarakat lokal.',
  'sustainability',
  3,
  85,
  true,
  4
),
(
  'TG-203',
  'Memberikan Pelatihan dan Mentoring',
  'Memberikan pelatihan kepada guide junior, mentoring, dan berbagi best practices dalam pemanduan wisata.',
  'leadership',
  3,
  75,
  false,
  4
),

-- Marine Tourism Specific
(
  'MT-001',
  'Menerapkan Keselamatan Wisata Bahari',
  'Memahami dan menerapkan prosedur keselamatan khusus untuk wisata bahari, termasuk penggunaan life jacket, prosedur evakuasi kapal, dan penanganan situasi darurat di laut.',
  'marine_safety',
  2,
  85,
  true,
  5
),
(
  'MT-002',
  'Memahami Ekosistem Laut',
  'Memiliki pengetahuan tentang ekosistem laut, konservasi terumbu karang, dan praktik wisata bahari yang bertanggung jawab.',
  'marine_knowledge',
  2,
  75,
  true,
  4
),
(
  'MT-003',
  'Memberikan Briefing Snorkeling/Diving',
  'Memberikan briefing keselamatan yang jelas dan komprehensif untuk aktivitas snorkeling atau diving, termasuk penggunaan equipment dan prosedur buddy system.',
  'marine_operations',
  2,
  80,
  true,
  4
),
(
  'MT-004',
  'Navigasi dan Orientasi Maritim',
  'Memahami dasar-dasar navigasi maritim, membaca peta laut, dan menggunakan GPS untuk keselamatan perjalanan.',
  'marine_technical',
  2,
  70,
  false,
  3
),

-- Eco-Tourism Specific
(
  'ET-001',
  'Interpretasi Alam dan Lingkungan',
  'Memberikan interpretasi mendalam tentang ekosistem, flora, fauna, dan pentingnya konservasi kepada wisatawan.',
  'eco_knowledge',
  2,
  80,
  true,
  4
),
(
  'ET-002',
  'Menerapkan Leave No Trace Principles',
  'Menerapkan dan mengajarkan prinsip Leave No Trace untuk meminimalkan dampak wisata terhadap lingkungan.',
  'eco_practice',
  2,
  85,
  true,
  3
),

-- Cultural Tourism Specific
(
  'CT-001',
  'Interpretasi Warisan Budaya',
  'Memberikan interpretasi mendalam tentang warisan budaya, situs bersejarah, dan praktik budaya lokal dengan sensitivitas dan akurasi.',
  'cultural_knowledge',
  2,
  80,
  true,
  4
),
(
  'CT-002',
  'Fasilitasi Interaksi Budaya',
  'Memfasilitasi interaksi yang bermakna dan respectful antara wisatawan dan komunitas lokal.',
  'cultural_practice',
  2,
  75,
  false,
  3
),

-- First Aid & Emergency (Mandatory for All)
(
  'FA-001',
  'Pertolongan Pertama Dasar',
  'Mampu memberikan pertolongan pertama untuk situasi umum seperti luka, pingsan, heat stroke, dan situasi darurat kesehatan lainnya.',
  'first_aid',
  2,
  90,
  true,
  5
),
(
  'FA-002',
  'CPR dan AED',
  'Mampu melakukan CPR (Cardiopulmonary Resuscitation) dan menggunakan AED (Automated External Defibrillator) dengan benar.',
  'first_aid',
  2,
  90,
  true,
  4
),

-- Technology & Digital
(
  'TD-001',
  'Menggunakan Teknologi Digital dalam Pemanduan',
  'Memanfaatkan teknologi digital (apps, GPS, online booking) untuk meningkatkan efisiensi dan pengalaman wisatawan.',
  'technology',
  2,
  70,
  false,
  3
),

-- Crisis Management
(
  'CM-001',
  'Manajemen Krisis dan Komunikasi',
  'Mengelola situasi krisis dengan tenang, berkomunikasi efektif dengan wisatawan, dan berkoordinasi dengan pihak terkait.',
  'crisis',
  3,
  85,
  true,
  5
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competency_units_category ON mra_tp_competency_units(category);
CREATE INDEX IF NOT EXISTS idx_competency_units_level ON mra_tp_competency_units(level);

-- Log seed completion
DO $$
DECLARE
  total_units INTEGER;
  mandatory_units INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_units FROM mra_tp_competency_units;
  
  RAISE NOTICE 'MRA-TP competency units seed completed:';
  RAISE NOTICE '  Total units: %', total_units;
  RAISE NOTICE '  Mandatory units: %', mandatory_units;
  RAISE NOTICE '  Optional units: %', (total_units - mandatory_units);
END $$;

