/**
 * Seed Loyalty Rewards
 * Migrate existing hardcoded rewards catalog to database
 */

INSERT INTO loyalty_rewards (name, description, category, points_cost, value_in_rupiah, stock, terms, display_order, is_active) VALUES
('Voucher Diskon Rp 50.000', 'Potongan harga Rp 50.000 untuk booking berikutnya', 'voucher', 50000, 50000, NULL, '["Berlaku untuk semua paket wisata", "Tidak dapat digabung dengan promo lain", "Masa berlaku 30 hari setelah ditukar"]'::jsonb, 1, true),
('Voucher Diskon Rp 100.000', 'Potongan harga Rp 100.000 untuk booking berikutnya', 'voucher', 95000, 100000, NULL, '["Berlaku untuk semua paket wisata", "Tidak dapat digabung dengan promo lain", "Masa berlaku 30 hari setelah ditukar"]'::jsonb, 2, true),
('Voucher Diskon Rp 200.000', 'Potongan harga Rp 200.000 untuk booking berikutnya', 'voucher', 180000, 200000, NULL, '["Berlaku untuk semua paket wisata", "Minimum booking Rp 500.000", "Tidak dapat digabung dengan promo lain", "Masa berlaku 30 hari setelah ditukar"]'::jsonb, 3, true),
('Diskon 10% Booking', 'Potongan 10% untuk 1x booking (maks Rp 500.000)', 'discount', 75000, 0, NULL, '["Maksimal potongan Rp 500.000", "Berlaku untuk semua paket wisata", "Tidak dapat digabung dengan promo lain", "Masa berlaku 14 hari setelah ditukar"]'::jsonb, 4, true),
('Upgrade Kursi Premium', 'Upgrade ke kursi depan untuk trip berikutnya', 'experience', 25000, 50000, 50, '["Subject to availability", "Berlaku untuk trip reguler", "Tidak dapat diuangkan kembali"]'::jsonb, 5, true),
('Kaos Aero Travel', 'Kaos ekslusif dengan desain Aero Travel', 'merchandise', 150000, 200000, 100, '["Tersedia ukuran S, M, L, XL", "Pengiriman gratis ke seluruh Indonesia", "Estimasi pengiriman 7-14 hari kerja"]'::jsonb, 6, true),
('Tumbler Aero Travel', 'Tumbler stainless steel 500ml dengan logo Aero', 'merchandise', 100000, 150000, 75, '["Pengiriman gratis ke seluruh Indonesia", "Estimasi pengiriman 7-14 hari kerja"]'::jsonb, 7, true),
('Priority Booking Access', 'Akses booking lebih awal untuk paket populer', 'experience', 50000, 0, NULL, '["Berlaku untuk 3 bulan", "Akses booking 24 jam lebih awal dari publik", "Berlaku untuk paket-paket favorit"]'::jsonb, 8, true);

