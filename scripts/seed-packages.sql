-- Seed Data: Destinations & Packages
-- Run: npx supabase db execute -f scripts/seed-packages.sql

-- ============================================
-- DESTINATIONS
-- ============================================
INSERT INTO destinations (id, name, slug, description, province, city, country, latitude, longitude, timezone, is_active) VALUES
('d1000000-0000-0000-0000-000000000001', 'Pulau Pahawang', 'pahawang', 'Surga snorkeling dengan terumbu karang yang indah dan air jernih', 'Lampung', 'Pesawaran', 'Indonesia', -5.6689, 105.2194, 'Asia/Jakarta', true),
('d1000000-0000-0000-0000-000000000002', 'Teluk Kiluan', 'kiluan', 'Habitat lumba-lumba dan pantai yang tenang', 'Lampung', 'Tanggamus', 'Indonesia', -5.7833, 104.9667, 'Asia/Jakarta', true),
('d1000000-0000-0000-0000-000000000003', 'Labuan Bajo', 'labuan-bajo', 'Gerbang menuju Taman Nasional Komodo', 'Nusa Tenggara Timur', 'Manggarai Barat', 'Indonesia', -8.4539, 119.8893, 'Asia/Makassar', true),
('d1000000-0000-0000-0000-000000000004', 'Raja Ampat', 'raja-ampat', 'Surga diving dengan biodiversitas laut tertinggi di dunia', 'Papua Barat', 'Raja Ampat', 'Indonesia', -0.2334, 130.5167, 'Asia/Jayapura', true),
('d1000000-0000-0000-0000-000000000005', 'Karimunjawa', 'karimunjawa', 'Kepulauan tropis dengan 27 pulau eksotis', 'Jawa Tengah', 'Jepara', 'Indonesia', -5.8667, 110.4500, 'Asia/Jakarta', true),
('d1000000-0000-0000-0000-000000000006', 'Tanjung Lesung', 'tanjung-lesung', 'Pantai berpasir putih dengan ombak tenang', 'Banten', 'Pandeglang', 'Indonesia', -6.4833, 105.6500, 'Asia/Jakarta', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ============================================
-- PACKAGES
-- ============================================
INSERT INTO packages (id, name, slug, description, destination_id, duration_days, duration_nights, base_price, min_pax, max_pax, is_published, package_type, difficulty_level) VALUES
-- Pahawang
('p1000000-0000-0000-0000-000000000001', 'Pahawang Island 2D1N', 'pahawang-2d1n', 
'Paket snorkeling 2 hari 1 malam di Pulau Pahawang. Nikmati keindahan terumbu karang, berenang bersama ikan nemo, dan camping di tepi pantai.',
'd1000000-0000-0000-0000-000000000001', 2, 1, 450000, 2, 30, true, 'open_trip', 'easy'),

('p1000000-0000-0000-0000-000000000002', 'Pahawang Island 3D2N', 'pahawang-3d2n',
'Paket lengkap 3 hari 2 malam eksplorasi Pahawang. Termasuk island hopping ke Pulau Kelagian dan Pulau Tegal.',
'd1000000-0000-0000-0000-000000000001', 3, 2, 750000, 2, 25, true, 'open_trip', 'easy'),

-- Kiluan
('p1000000-0000-0000-0000-000000000003', 'Kiluan Dolphin Tour 2D1N', 'kiluan-dolphin-2d1n',
'Pengalaman melihat lumba-lumba di habitat aslinya. Berangkat pagi untuk melihat lumba-lumba bermain di laut lepas.',
'd1000000-0000-0000-0000-000000000002', 2, 1, 550000, 4, 20, true, 'open_trip', 'easy'),

-- Labuan Bajo
('p1000000-0000-0000-0000-000000000004', 'Labuan Bajo Explorer 3D2N', 'labuan-bajo-3d2n',
'Jelajahi keajaiban Komodo! Kunjungi Pulau Komodo, Pulau Padar, Pink Beach, dan Manta Point. Live on board kapal phinisi.',
'd1000000-0000-0000-0000-000000000003', 3, 2, 3500000, 6, 15, true, 'open_trip', 'medium'),

('p1000000-0000-0000-0000-000000000005', 'Labuan Bajo Premium 4D3N', 'labuan-bajo-4d3n',
'Paket premium dengan kapal phinisi mewah. Termasuk diving di Manta Point dan sunset dinner di Pulau Kalong.',
'd1000000-0000-0000-0000-000000000003', 4, 3, 5500000, 4, 12, true, 'private_trip', 'medium'),

-- Raja Ampat
('p1000000-0000-0000-0000-000000000006', 'Raja Ampat Paradise 5D4N', 'raja-ampat-5d4n',
'Ekspedisi diving dan snorkeling di surga bawah laut Raja Ampat. Kunjungi Pianemo, Wayag, dan spot diving terbaik dunia.',
'd1000000-0000-0000-0000-000000000004', 5, 4, 8500000, 4, 10, true, 'open_trip', 'medium'),

-- Karimunjawa
('p1000000-0000-0000-0000-000000000007', 'Karimunjawa Island Hopping 3D2N', 'karimunjawa-3d2n',
'Jelajahi kepulauan Karimunjawa dengan island hopping seru. Snorkeling, berenang dengan hiu, dan menikmati sunset.',
'd1000000-0000-0000-0000-000000000005', 3, 2, 1250000, 4, 20, true, 'open_trip', 'easy'),

-- Tanjung Lesung
('p1000000-0000-0000-0000-000000000008', 'Tanjung Lesung Beach Escape 2D1N', 'tanjung-lesung-2d1n',
'Weekend getaway ke pantai Tanjung Lesung. Cocok untuk keluarga dengan aktivitas water sport dan BBQ dinner.',
'd1000000-0000-0000-0000-000000000006', 2, 1, 650000, 2, 30, true, 'open_trip', 'easy')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  is_published = EXCLUDED.is_published;

-- ============================================
-- PACKAGE INCLUSIONS (what's included)
-- ============================================
INSERT INTO package_inclusions (id, package_id, inclusion_type, description, is_included) VALUES
-- Pahawang 2D1N
('i1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'transport', 'Transportasi PP dari meeting point', true),
('i1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'boat', 'Kapal penyeberangan ke pulau', true),
('i1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000001', 'meal', 'Makan 3x (1x malam, 1x pagi, 1x siang)', true),
('i1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000001', 'equipment', 'Alat snorkeling', true),
('i1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000001', 'accommodation', 'Tenda camping atau homestay', true),
('i1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000001', 'guide', 'Tour guide lokal', true),
('i1000000-0000-0000-0000-000000000007', 'p1000000-0000-0000-0000-000000000001', 'insurance', 'Asuransi perjalanan', true),

-- Labuan Bajo 3D2N
('i1000000-0000-0000-0000-000000000011', 'p1000000-0000-0000-0000-000000000004', 'boat', 'Live on board kapal phinisi', true),
('i1000000-0000-0000-0000-000000000012', 'p1000000-0000-0000-0000-000000000004', 'meal', 'Full board (makan 3x sehari)', true),
('i1000000-0000-0000-0000-000000000013', 'p1000000-0000-0000-0000-000000000004', 'equipment', 'Alat snorkeling', true),
('i1000000-0000-0000-0000-000000000014', 'p1000000-0000-0000-0000-000000000004', 'guide', 'Tour guide & ranger Komodo', true),
('i1000000-0000-0000-0000-000000000015', 'p1000000-0000-0000-0000-000000000004', 'entrance', 'Tiket masuk Taman Nasional Komodo', true),
('i1000000-0000-0000-0000-000000000016', 'p1000000-0000-0000-0000-000000000004', 'insurance', 'Asuransi perjalanan', true),
('i1000000-0000-0000-0000-000000000017', 'p1000000-0000-0000-0000-000000000004', 'transport', 'Tiket pesawat tidak termasuk', false)

ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  is_included = EXCLUDED.is_included;

-- ============================================
-- PACKAGE ITINERARIES
-- ============================================
INSERT INTO package_itineraries (id, package_id, day_number, title, description) VALUES
-- Pahawang 2D1N
('t1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 1, 'Berangkat & Snorkeling', 
'07:00 Berkumpul di meeting point Bandar Lampung
08:00 Berangkat menuju Dermaga Ketapang
10:00 Menyeberang ke Pulau Pahawang
11:00 Check-in homestay/tenda
12:00 Makan siang
14:00 Snorkeling spot 1 & 2
17:00 Free time & sunset
19:00 Makan malam & api unggun'),

('t1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 2, 'Island Hopping & Pulang',
'07:00 Sarapan
08:00 Island hopping ke Pulau Kelagian
10:00 Snorkeling spot 3
12:00 Makan siang di pulau
14:00 Kembali ke dermaga
16:00 Perjalanan pulang ke Bandar Lampung
18:00 Sampai di meeting point'),

-- Labuan Bajo 3D2N
('t1000000-0000-0000-0000-000000000011', 'p1000000-0000-0000-0000-000000000004', 1, 'Kedatangan & Pulau Padar',
'10:00 Tiba di Bandara Komodo, dijemput ke pelabuhan
11:00 Boarding kapal phinisi
12:00 Makan siang di kapal
14:00 Berlayar menuju Pulau Padar
16:00 Trekking ke puncak Padar untuk sunset
19:00 Makan malam & bermalam di kapal'),

('t1000000-0000-0000-0000-000000000012', 'p1000000-0000-0000-0000-000000000004', 2, 'Komodo & Pink Beach',
'06:00 Sarapan
07:00 Trekking di Pulau Komodo
10:00 Snorkeling di Pink Beach
12:00 Makan siang
14:00 Manta Point snorkeling
17:00 Sunset di Pulau Kalong (flying fox)
19:00 Makan malam BBQ di kapal'),

('t1000000-0000-0000-0000-000000000013', 'p1000000-0000-0000-0000-000000000004', 3, 'Kanawa & Kepulangan',
'06:00 Sunrise & sarapan
08:00 Snorkeling di Pulau Kanawa
10:00 Kembali ke Labuan Bajo
12:00 Check-out kapal
13:00 Makan siang di restoran lokal
15:00 Transfer ke bandara / hotel')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- ============================================
-- PACKAGE IMAGES (placeholder URLs)
-- ============================================
INSERT INTO package_images (id, package_id, image_url, alt_text, is_primary, sort_order) VALUES
('m1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', '/images/packages/pahawang-1.jpg', 'Snorkeling di Pahawang', true, 1),
('m1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', '/images/packages/pahawang-2.jpg', 'Pantai Pahawang', false, 2),
('m1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000004', '/images/packages/labuan-bajo-1.jpg', 'Pulau Padar', true, 1),
('m1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', '/images/packages/labuan-bajo-2.jpg', 'Komodo Dragon', false, 2),
('m1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000006', '/images/packages/raja-ampat-1.jpg', 'Pianemo Raja Ampat', true, 1)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text;

-- Done!
SELECT 'Seed data inserted successfully!' as status;
