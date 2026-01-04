/**
 * Seed About Page Content
 * Migrate existing about page content to database
 */

-- About Stats
INSERT INTO about_stats (label, value, display_order, is_active) VALUES
('Tahun Pengalaman', '5+', 1, true),
('Trip Sukses', '500+', 2, true),
('Traveler Puas', '10K+', 3, true),
('Rating Rata-rata', '4.9', 4, true);

-- About Values
INSERT INTO about_values (title, description, icon_name, display_order, is_active) VALUES
('Keamanan', 'Standar keselamatan tinggi dengan asuransi dan prosedur darurat.', 'Shield', 1, true),
('Pelayanan', 'Tim profesional yang siap melayani dengan sepenuh hati.', 'Heart', 2, true),
('Kualitas', 'Pengalaman wisata premium dengan harga yang kompetitif.', 'Award', 3, true),
('Komunitas', 'Membangun komunitas traveler yang saling berbagi pengalaman.', 'Users', 4, true);

-- About Awards
INSERT INTO about_awards (name, description, display_order, is_active) VALUES
('Member ASITA', 'Anggota resmi Asosiasi Perusahaan Perjalanan Wisata Indonesia', 1, true),
('Registered Travel Agency', 'Travel agency terdaftar dan berlisensi resmi', 2, true);

