-- Seed Data: Permenparekraf Criteria
-- Purpose: Assessment criteria for Permenparekraf No.4/2021
-- Run after: 20260103200017_145-permenparekraf-self-assessment.sql

-- Criteria for AGEN PERJALANAN WISATA
-- Section 1: Legalitas (20%)
INSERT INTO permenparekraf_criteria (
  business_type,
  section_code,
  criteria_code,
  criteria_name,
  description,
  weight,
  max_score,
  order_index
) VALUES
('agen_perjalanan_wisata', 'legalitas','L001', 'NIB (Nomor Induk Berusaha)', 'Memiliki NIB yang masih valid dan terdaftar di OSS', 5.0, 100, 1),
('agen_perjalanan_wisata', 'legalitas','L002', 'Sertifikat Standar Usaha', 'Memiliki Sertifikat Standar Usaha Pariwisata', 4.0, 100, 2),
('agen_perjalanan_wisata', 'legalitas','L003', 'TDUP (Tanda Daftar Usaha Pariwisata)', 'TDUP yang masih berlaku', 3.0, 100, 3),
('agen_perjalanan_wisata', 'legalitas','L004', 'Keanggotaan ASITA', 'Anggota aktif ASITA (Asosiasi Perusahaan Perjalanan Wisata Indonesia)', 4.0, 100, 4),
('agen_perjalanan_wisata', 'legalitas','L005', 'Perizinan Terkait', 'Izin-izin terkait lainnya (SIUP, TDP, dll) jika diperlukan', 4.0, 100, 5);

-- Section 2: SDM (20%)
INSERT INTO permenparekraf_criteria (
  business_type,
  section_code,
  criteria_code,
  criteria_name,
  description,
  weight,
  max_score,
  order_index
) VALUES
('agen_perjalanan_wisata', 'sdm','S001', 'Jumlah SDM', 'Memiliki minimal 3 orang SDM tetap', 4.0, 100, 1),
('agen_perjalanan_wisata', 'sdm','S002', 'Sertifikasi Profesi', 'SDM memiliki sertifikat kompetensi bidang pariwisata', 5.0, 100, 2),
('agen_perjalanan_wisata', 'sdm','S003', 'Pelatihan Rutin', 'Melaksanakan pelatihan rutin untuk peningkatan kompetensi', 4.0, 100, 3),
('agen_perjalanan_wisata', 'sdm','S004', 'Guide Bersertifikat', 'Memiliki guide dengan sertifikasi MRA-TP/BNSP', 4.0, 100, 4),
('agen_perjalanan_wisata', 'sdm','S005', 'Kemampuan Bahasa Asing', 'SDM mampu berkomunikasi dalam minimal 1 bahasa asing', 3.0, 100, 5);

-- Section 3: Sarana & Prasarana (20%)
INSERT INTO permenparekraf_criteria (
  business_type,
  section_code,
  criteria_code,
  criteria_name,
  description,
  weight,
  max_score,
  order_index
) VALUES
('agen_perjalanan_wisata', 'sarana','P001', 'Kantor Tetap', 'Memiliki kantor tetap dengan alamat yang jelas', 5.0, 100, 1),
('agen_perjalanan_wisata', 'sarana','P002', 'Fasilitas Kantor', 'Fasilitas kantor yang memadai (meja, kursi, komputer, AC)', 3.0, 100, 2),
('agen_perjalanan_wisata', 'sarana','P003', 'Sistem Reservasi', 'Memiliki sistem reservasi/booking (online/offline)', 4.0, 100, 3),
('agen_perjalanan_wisata', 'sarana','P004', 'Website/Platform Digital', 'Memiliki website atau platform digital untuk promosi', 3.0, 100, 4),
('agen_perjalanan_wisata', 'sarana','P005', 'Peralatan Komunikasi', 'Peralatan komunikasi yang memadai (telepon, internet)', 3.0, 100, 5),
('agen_perjalanan_wisata', 'sarana','P006', 'Kendaraan Operasional', 'Kendaraan untuk operasional (owned/partnership)', 2.0, 100, 6);

-- Section 4: Pelayanan (20%)
INSERT INTO permenparekraf_criteria (
  business_type,
  section_code,
  criteria_code,
  criteria_name,
  description,
  weight,
  max_score,
  order_index
) VALUES
('agen_perjalanan_wisata', 'pelayanan','V001', 'SOP Pelayanan', 'Memiliki SOP pelayanan yang terdokumentasi', 4.0, 100, 1),
('agen_perjalanan_wisata', 'pelayanan','V002', 'Jam Operasional', 'Jam operasional yang jelas dan konsisten', 2.0, 100, 2),
('agen_perjalanan_wisata', 'pelayanan','V003', 'Customer Service', 'Layanan customer service yang responsif', 4.0, 100, 3),
('agen_perjalanan_wisata', 'pelayanan','V004', 'Handling Complaint', 'Sistem penanganan keluhan pelanggan', 3.0, 100, 4),
('agen_perjalanan_wisata', 'pelayanan','V005', 'Kepuasan Pelanggan', 'Survey kepuasan pelanggan dan follow-up', 3.0, 100, 5),
('agen_perjalanan_wisata', 'pelayanan','V006', 'Keselamatan Wisatawan', 'Prosedur keselamatan dan asuransi perjalanan', 4.0, 100, 6);

-- Section 5: Keuangan (10%)
INSERT INTO permenparekraf_criteria (
  business_type,
  section_code,
  criteria_code,
  criteria_name,
  description,
  weight,
  max_score,
  order_index
) VALUES
('agen_perjalanan_wisata', 'keuangan','F001', 'Pembukuan Teratur', 'Sistem pembukuan yang teratur dan rapi', 3.0, 100, 1),
('agen_perjalanan_wisata', 'keuangan','F002', 'Laporan Keuangan', 'Laporan keuangan periodik (minimal tahunan)', 3.0, 100, 2),
('agen_perjalanan_wisata', 'keuangan','F003', 'Pajak', 'Kepatuhan pembayaran pajak', 2.0, 100, 3),
('agen_perjalanan_wisata', 'keuangan','F004', 'Modal Usaha', 'Memiliki modal usaha yang memadai', 2.0, 100, 4);

-- Section 6: Lingkungan (10%)
INSERT INTO permenparekraf_criteria (
  business_type,
  section_code,
  criteria_code,
  criteria_name,
  description,
  weight,
  max_score,
  order_index
) VALUES
('agen_perjalanan_wisata', 'lingkungan','E001', 'Sustainable Tourism', 'Menerapkan prinsip pariwisata berkelanjutan', 3.0, 100, 1),
('agen_perjalanan_wisata', 'lingkungan','E002', 'Waste Management', 'Pengelolaan sampah yang baik', 2.0, 100, 2),
('agen_perjalanan_wisata', 'lingkungan','E003', 'Edukasi Wisatawan', 'Memberikan edukasi lingkungan kepada wisatawan', 2.0, 100, 3),
('agen_perjalanan_wisata', 'lingkungan','E004', 'CSR/Community Engagement', 'Program tanggung jawab sosial/pemberdayaan masyarakat', 3.0, 100, 4);

-- Simplified criteria for other business types (can be expanded later)
-- BIRO PERJALANAN WISATA (similar structure, more stringent requirements)
INSERT INTO permenparekraf_criteria (business_type, section_code, criteria_code, criteria_name, description, weight, max_score, order_index)
SELECT 
  'biro_perjalanan_wisata' as business_type,
  section_code,
  criteria_code,
  criteria_name,
  CASE 
    WHEN criteria_code = 'S001' THEN 'Memiliki minimal 5 orang SDM tetap'
    WHEN criteria_code = 'P001' THEN 'Memiliki kantor tetap dengan luas minimal 50m2'
    ELSE description
  END as description,
  weight,
  max_score,
  order_index
FROM permenparekraf_criteria
WHERE business_type = 'agen_perjalanan_wisata';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_criteria_business_type ON permenparekraf_criteria(business_type);
CREATE INDEX IF NOT EXISTS idx_criteria_section ON permenparekraf_criteria(section_code);
CREATE INDEX IF NOT EXISTS idx_criteria_order ON permenparekraf_criteria(order_index);

-- Create view for easy assessment
CREATE OR REPLACE VIEW v_permenparekraf_criteria_summary AS
SELECT 
  business_type,
  section_code,
  COUNT(*) as criteria_count,
  SUM(weight) as total_weight,
  AVG(max_score) as avg_max_score
FROM permenparekraf_criteria
WHERE is_active = true
GROUP BY business_type, section_code
ORDER BY business_type, section_code;

-- Log seed completion
DO $$
DECLARE
  total_criteria INTEGER;
  total_sections INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_criteria FROM permenparekraf_criteria;
  SELECT COUNT(DISTINCT section_code) INTO total_sections FROM permenparekraf_criteria;
  
  RAISE NOTICE 'Permenparekraf criteria seed completed:';
  RAISE NOTICE '  Total criteria: %', total_criteria;
  RAISE NOTICE '  Total sections: %', total_sections;
  RAISE NOTICE '  Business types: %', (SELECT COUNT(DISTINCT business_type) FROM permenparekraf_criteria);
END $$;

