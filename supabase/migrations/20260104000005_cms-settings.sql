/**
 * CMS Settings
 * Additional settings for managing static content via admin console
 */

-- Insert new settings for CMS content
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  -- Legal/DPO
  ('legal.dpo_email', 'privacy@aerotravel.co.id', 'string', 'DPO email address', true),
  ('legal.dpo_phone', '+6281234567890', 'string', 'DPO phone number', true),
  ('legal.dpo_address', 'Bandar Lampung, Lampung, Indonesia 35123', 'string', 'DPO address', true),
  ('legal.response_time_days', '14', 'number', 'Response time for data requests (days)', true),
  
  -- About Page
  ('about.story', 'Aero Travel didirikan dengan satu visi: memberikan pengalaman wisata bahari terbaik dengan standar keselamatan tinggi. Berawal dari kecintaan terhadap keindahan laut Indonesia, kami berkomitmen untuk membawa setiap traveler menikmati surga bawah laut yang memukau. Dengan tim profesional dan guide berpengalaman, kami telah melayani ribuan traveler dari berbagai daerah. Setiap perjalanan adalah kesempatan bagi kami untuk berbagi keajaiban alam Indonesia.', 'text', 'Company story', true),
  ('about.vision', 'Menjadi travel agency marine tourism terdepan di Indonesia yang mengutamakan keamanan, kenyamanan, dan pengalaman tak terlupakan bagi setiap traveler.', 'text', 'Company vision', true),
  ('about.mission', 'Menyediakan paket wisata berkualitas dengan harga terjangkau. Menerapkan standar keselamatan tertinggi. Memberdayakan masyarakat lokal sebagai mitra. Menjaga kelestarian lingkungan bahari.', 'text', 'Company mission', true),
  ('about.founding_date', '2019-01-01', 'date', 'Company founding date', true),
  
  -- App Metadata
  ('app.version', '1.0.0', 'string', 'App version', true),
  ('app.copyright_text', 'Aero Travel Indonesia', 'string', 'Copyright text', true),
  ('app.copyright_year', '2025', 'number', 'Copyright year', true),
  ('app.app_store_url', '#', 'string', 'App Store URL', true),
  ('app.play_store_url', '#', 'string', 'Play Store URL', true),
  
  -- Help/Support
  ('help.support_hours', 'Senin - Minggu, 08:00 - 21:00 WIB', 'string', 'Support hours', true),
  
  -- Landing Pages (stored as JSON)
  ('landing.guide.benefits', '[]', 'json', 'Guide landing benefits', true),
  ('landing.guide.requirements', '[]', 'json', 'Guide landing requirements', true),
  ('landing.guide.stats', '[]', 'json', 'Guide landing stats', true),
  ('landing.partner.benefits', '[]', 'json', 'Partner landing benefits', true),
  ('landing.partner.features', '[]', 'json', 'Partner landing features', true),
  ('landing.corporate.benefits', '[]', 'json', 'Corporate landing benefits', true),
  ('landing.corporate.features', '[]', 'json', 'Corporate landing features', true)
ON CONFLICT (branch_id, key) DO NOTHING;

