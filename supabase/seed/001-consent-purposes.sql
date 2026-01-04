-- Seed Data: Consent Purposes (UU PDP 2022)
-- Purpose: Initial consent purposes for PDP compliance
-- Run after: 20260103200015_143-pdp-consent-management.sql

-- Operational Consents (Mandatory)
INSERT INTO consent_purposes (
  purpose_code,
  purpose_name,
  description,
  is_mandatory,
  category,
  legal_basis,
  retention_period,
  is_active
) VALUES
(
  'booking_processing',
  'Pemrosesan Pemesanan',
  'Digunakan untuk memproses pemesanan perjalanan Anda, termasuk penyimpanan data pribadi (nama, kontak, KTP) yang diperlukan untuk pembuatan manifest penumpang dan koordinasi perjalanan.',
  true,
  'operational',
  'UU PDP 2022 Pasal 20 - Kepentingan Vital',
  30, -- 30 days after trip
  true
),
(
  'emergency_contact',
  'Kontak Darurat',
  'Menyimpan informasi kontak darurat untuk keperluan keselamatan selama perjalanan. Data akan dihubungi hanya dalam situasi emergency.',
  true,
  'operational',
  'UU PDP 2022 Pasal 20 - Kepentingan Vital',
  90, -- 90 days
  true
),
(
  'payment_processing',
  'Pemrosesan Pembayaran',
  'Menyimpan informasi pembayaran untuk proses transaksi, refund, dan laporan keuangan. Data sensitif kartu kredit tidak disimpan oleh kami.',
  true,
  'operational',
  'UU PDP 2022 Pasal 20 - Pelaksanaan Perjanjian',
  365, -- 1 year for accounting
  true
),
(
  'legal_compliance',
  'Kepatuhan Hukum',
  'Menyimpan data untuk memenuhi kewajiban hukum seperti pelaporan pajak, manifest penumpang ke Syahbandar, dan dokumentasi keselamatan maritim.',
  true,
  'operational',
  'UU PDP 2022 Pasal 21 - Pemenuhan Kewajiban Hukum',
  730, -- 2 years (legal requirement)
  true
);

-- Marketing Consents (Optional)
INSERT INTO consent_purposes (
  purpose_code,
  purpose_name,
  description,
  is_mandatory,
  category,
  legal_basis,
  retention_period,
  is_active
) VALUES
(
  'marketing_email',
  'Email Marketing & Newsletter',
  'Menerima penawaran khusus, promosi perjalanan, dan newsletter dari Aero Travel via email. Anda dapat berhenti berlangganan kapan saja.',
  false,
  'marketing',
  'UU PDP 2022 Pasal 20 - Persetujuan',
  null, -- Until withdrawn
  true
),
(
  'marketing_whatsapp',
  'Notifikasi WhatsApp',
  'Menerima informasi trip, reminder pembayaran, dan penawaran khusus via WhatsApp. Anda dapat opt-out kapan saja.',
  false,
  'marketing',
  'UU PDP 2022 Pasal 20 - Persetujuan',
  null,
  true
),
(
  'marketing_sms',
  'SMS Marketing',
  'Menerima reminder dan penawaran khusus via SMS. Biaya SMS sesuai operator Anda.',
  false,
  'marketing',
  'UU PDP 2022 Pasal 20 - Persetujuan',
  null,
  true
);

-- Analytics Consents (Optional)
INSERT INTO consent_purposes (
  purpose_code,
  purpose_name,
  description,
  is_mandatory,
  category,
  legal_basis,
  retention_period,
  is_active
) VALUES
(
  'analytics',
  'Analitik & Peningkatan Layanan',
  'Menganalisis penggunaan aplikasi untuk meningkatkan pengalaman pengguna, mengidentifikasi bug, dan mengembangkan fitur baru. Data digunakan secara anonim.',
  false,
  'analytics',
  'UU PDP 2022 Pasal 20 - Persetujuan',
  365,
  true
),
(
  'performance_monitoring',
  'Monitoring Performa Aplikasi',
  'Mengumpulkan data teknis (waktu loading, error logs) untuk menjaga kualitas aplikasi. Data tidak mencakup aktivitas pribadi Anda.',
  false,
  'analytics',
  'UU PDP 2022 Pasal 20 - Kepentingan yang Sah',
  90,
  true
);

-- Third Party Consents (Mixed)
INSERT INTO consent_purposes (
  purpose_code,
  purpose_name,
  description,
  is_mandatory,
  category,
  legal_basis,
  retention_period,
  is_active
) VALUES
(
  'insurance_sharing',
  'Berbagi Data dengan Asuransi',
  'Membagikan data perjalanan Anda kepada penyedia asuransi perjalanan untuk klaim dan emergency assistance. Data dibagikan hanya jika Anda membeli asuransi.',
  true, -- Mandatory if insurance purchased
  'third_party',
  'UU PDP 2022 Pasal 20 - Pelaksanaan Perjanjian',
  365,
  true
),
(
  'partner_sharing',
  'Berbagi Data dengan Mitra',
  'Membagikan informasi perjalanan dengan mitra (hotel, tour operator lokal) untuk koordinasi layanan. Data dibatasi sesuai kebutuhan.',
  false,
  'third_party',
  'UU PDP 2022 Pasal 20 - Persetujuan',
  90,
  true
),
(
  'photo_usage',
  'Penggunaan Foto untuk Promosi',
  'Menggunakan foto perjalanan Anda (tanpa identitas pribadi) untuk keperluan promosi media sosial dan website Aero Travel.',
  false,
  'marketing',
  'UU PDP 2022 Pasal 20 - Persetujuan',
  null, -- Until withdrawn
  true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consent_purposes_category ON consent_purposes(category);
CREATE INDEX IF NOT EXISTS idx_consent_purposes_mandatory ON consent_purposes(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_consent_purposes_active ON consent_purposes(is_active);

-- Log seed completion
DO $$
BEGIN
  RAISE NOTICE 'Consent purposes seed completed: % records', (SELECT COUNT(*) FROM consent_purposes);
END $$;

