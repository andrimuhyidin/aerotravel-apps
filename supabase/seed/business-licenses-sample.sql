-- Sample Business Licenses Data for MyAeroTravel ID
-- Seed data for compliance module testing

-- Get a super_admin user ID for created_by reference
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the first super_admin user
  SELECT id INTO admin_user_id FROM users WHERE role = 'super_admin' LIMIT 1;
  
  -- If no super_admin found, use NULL (will still work but without audit trail)
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No super_admin user found. Inserting licenses without created_by reference.';
  END IF;

  -- Insert NIB (Nomor Induk Berusaha)
  INSERT INTO business_licenses (
    license_type, license_number, license_name, issued_by, issued_date, expiry_date, status, notes, created_by, updated_by
  ) VALUES (
    'nib',
    '1234567890123',
    'NIB PT. MyAeroTravel Indonesia',
    'Kementerian Investasi/BKPM via OSS',
    '2023-01-15',
    '2028-01-15', -- 5 year validity
    'valid',
    'NIB utama perusahaan untuk kegiatan usaha pariwisata',
    admin_user_id,
    admin_user_id
  );

  -- Insert SKDN (Surat Keterangan Domisili Niaga)
  INSERT INTO business_licenses (
    license_type, license_number, license_name, issued_by, issued_date, expiry_date, status, notes, created_by, updated_by
  ) VALUES (
    'skdn',
    'SKDN/2023/LPG/001',
    'SKDN PT. MyAeroTravel Indonesia - Lampung',
    'Kelurahan Sukarame, Kecamatan Sukarame, Bandar Lampung',
    '2023-02-01',
    '2026-02-01', -- 3 year validity, expiring soon for testing
    'warning',
    'Surat keterangan domisili untuk kantor pusat di Lampung',
    admin_user_id,
    admin_user_id
  );

  -- Insert SISUPAR (already registered)
  INSERT INTO business_licenses (
    license_type, license_number, license_name, issued_by, issued_date, expiry_date, status, notes, created_by, updated_by
  ) VALUES (
    'sisupar',
    'SISUPAR/LPG/2023/00456',
    'Pendaftaran SISUPAR - PT. MyAeroTravel Indonesia',
    'Dinas Pariwisata Provinsi Lampung',
    '2023-03-10',
    NULL, -- Perpetual
    'valid',
    'Terdaftar di Sistem Informasi Usaha Pariwisata',
    admin_user_id,
    admin_user_id
  );

  -- Insert TDUP (Tanda Daftar Usaha Pariwisata)
  INSERT INTO business_licenses (
    license_type, license_number, license_name, issued_by, issued_date, expiry_date, status, notes, created_by, updated_by
  ) VALUES (
    'tdup',
    'TDUP/LPG/2023/789',
    'TDUP Agen Perjalanan Wisata - PT. MyAeroTravel Indonesia',
    'Dinas Pariwisata Kota Bandar Lampung',
    '2023-04-05',
    '2026-04-05', -- 3 year validity
    'valid',
    'Tanda daftar usaha untuk jenis usaha Agen Perjalanan Wisata',
    admin_user_id,
    admin_user_id
  );

  -- Insert CHSE Certificate
  INSERT INTO business_licenses (
    license_type, license_number, license_name, issued_by, issued_date, expiry_date, status, notes, created_by, updated_by
  ) VALUES (
    'chse',
    'CHSE/2024/LPG/00123',
    'Sertifikat CHSE PT. MyAeroTravel Indonesia',
    'Kementerian Pariwisata dan Ekonomi Kreatif RI',
    '2024-01-20',
    '2025-01-20', -- 1 year validity - critical!
    'critical',
    'Sertifikat Cleanliness, Health, Safety, Environment untuk kantor dan operasional',
    admin_user_id,
    admin_user_id
  );

  -- Insert ASITA Membership
  INSERT INTO business_licenses (
    license_type, license_number, license_name, issued_by, issued_date, expiry_date, status, notes, created_by, updated_by
  ) VALUES (
    'asita',
    'ASITA/LPG/2022/0042',
    'Keanggotaan ASITA - PT. MyAeroTravel Indonesia',
    'DPP ASITA Indonesia',
    '2022-06-15',
    '2025-06-15', -- Annual membership
    'valid',
    'Keanggotaan resmi asosiasi travel agent Indonesia',
    admin_user_id,
    admin_user_id
  );
  
  -- Get the ASITA license ID and insert ASITA details
  INSERT INTO asita_membership (license_id, nia, membership_type, dpd_region, member_since)
  SELECT 
    id,
    'ASITA/2022/LPG/0042',
    'corporate',
    'DPD ASITA Lampung',
    '2022-06-15'
  FROM business_licenses 
  WHERE license_type = 'asita' 
  AND license_number = 'ASITA/LPG/2022/0042';

  RAISE NOTICE 'Sample business licenses inserted successfully!';
END $$;

-- Verify inserted data
SELECT 
  license_type,
  license_number,
  license_name,
  status,
  expiry_date,
  CASE 
    WHEN expiry_date IS NULL THEN 'Perpetual'
    ELSE (expiry_date - CURRENT_DATE)::TEXT || ' days'
  END as days_until_expiry
FROM business_licenses
ORDER BY 
  CASE status 
    WHEN 'expired' THEN 1 
    WHEN 'critical' THEN 2 
    WHEN 'warning' THEN 3 
    WHEN 'valid' THEN 4 
    ELSE 5 
  END,
  expiry_date;

