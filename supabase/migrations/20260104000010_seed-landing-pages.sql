/**
 * Seed Landing Pages
 * Update settings with landing page JSON content
 */

-- Guide Landing Page
UPDATE settings SET value = '[
  {"icon": "DollarSign", "title": "Penghasilan Fleksibel", "description": "Dapatkan komisi menarik dari setiap trip yang Anda handle"},
  {"icon": "Calendar", "title": "Jadwal Fleksibel", "description": "Pilih trip sesuai dengan waktu luang Anda"},
  {"icon": "Smartphone", "title": "Aplikasi Mobile", "description": "Kelola semua aktivitas guide melalui aplikasi mobile yang mudah digunakan"},
  {"icon": "Shield", "title": "Asuransi & Support", "description": "Dapatkan perlindungan asuransi dan dukungan tim operasional 24/7"},
  {"icon": "MapPin", "title": "Destinasi Menarik", "description": "Jelajahi destinasi wisata terbaik di Indonesia"},
  {"icon": "Users", "title": "Komunitas Guide", "description": "Bergabung dengan komunitas guide profesional"}
]'::jsonb::text
WHERE key = 'landing.guide.benefits';

UPDATE settings SET value = '[
  "Minimal usia 21 tahun",
  "Memiliki KTP dan SIM yang masih berlaku",
  "Memiliki pengalaman sebagai guide atau passion di bidang pariwisata",
  "Memiliki kemampuan komunikasi yang baik",
  "Sehat jasmani dan rohani",
  "Memiliki smartphone dengan koneksi internet"
]'::jsonb::text
WHERE key = 'landing.guide.requirements';

UPDATE settings SET value = '[
  {"icon": "Users", "value": "500+", "label": "Guide Aktif"},
  {"icon": "Star", "value": "4.8", "label": "Rating"},
  {"icon": "TrendingUp", "value": "10K+", "label": "Trip"}
]'::jsonb::text
WHERE key = 'landing.guide.stats';

-- Partner Landing Page
UPDATE settings SET value = '[
  {"icon": "Percent", "title": "Komisi Menarik", "description": "Dapatkan komisi hingga 15% dari setiap booking yang berhasil"},
  {"icon": "CreditCard", "title": "Sistem Deposit", "description": "Kelola deposit dengan mudah melalui dashboard terintegrasi"},
  {"icon": "BarChart3", "title": "Dashboard Analytics", "description": "Pantau performa bisnis dengan analytics real-time"},
  {"icon": "Building2", "title": "Whitelabel Support", "description": "Gunakan brand Anda sendiri dengan fitur whitelabel"},
  {"icon": "HeadphonesIcon", "title": "Support 24/7", "description": "Tim support siap membantu kapan saja Anda butuhkan"},
  {"icon": "TrendingUp", "title": "Growth Program", "description": "Program khusus untuk membantu bisnis Anda berkembang"}
]'::jsonb::text
WHERE key = 'landing.partner.benefits';

UPDATE settings SET value = '[
  "Akses ke semua paket travel Aero Travel",
  "Sistem booking terintegrasi",
  "Invoice otomatis",
  "Laporan keuangan real-time",
  "API integration untuk website Anda",
  "Marketing materials & support"
]'::jsonb::text
WHERE key = 'landing.partner.features';

-- Corporate Landing Page
UPDATE settings SET value = '[
  {"icon": "Users", "title": "Kelola Karyawan", "description": "Kelola data karyawan dan booking mereka dengan mudah"},
  {"icon": "FileText", "title": "Invoice Otomatis", "description": "Dapatkan invoice otomatis untuk setiap booking"},
  {"icon": "BarChart3", "title": "Laporan Keuangan", "description": "Pantau pengeluaran travel dengan laporan detail"},
  {"icon": "Shield", "title": "Kontrol Akses", "description": "Atur siapa yang bisa booking dan batas anggaran"},
  {"icon": "Clock", "title": "Proses Cepat", "description": "Booking dan approval dalam hitungan menit"},
  {"icon": "TrendingUp", "title": "Cost Efficiency", "description": "Hemat biaya dengan paket corporate yang menarik"}
]'::jsonb::text
WHERE key = 'landing.corporate.benefits';

UPDATE settings SET value = '[
  "Dashboard terintegrasi untuk HR/Admin",
  "Sistem approval otomatis",
  "Invoice bulanan terpusat",
  "Laporan pengeluaran real-time",
  "Multi-department support",
  "Custom pricing untuk perusahaan"
]'::jsonb::text
WHERE key = 'landing.corporate.features';

