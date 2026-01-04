/**
 * Configurable Settings Migration
 * Add all configurable settings for branding, contact, SEO, per-app, etc.
 * These settings can be managed through Admin Console
 */

-- Insert global branding settings
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  -- Branding
  ('branding.logo_url', '/logo.png', 'string', 'URL logo utama', true),
  ('branding.logo_dark_url', '/logo-dark.png', 'string', 'URL logo untuk dark mode', true),
  ('branding.favicon_url', '/favicon.ico', 'string', 'URL favicon', true),
  ('branding.app_name', 'MyAeroTravel', 'string', 'Nama aplikasi', true),
  ('branding.tagline', 'Your Trusted Travel Partner', 'string', 'Tagline', true),
  ('branding.primary_color', '#0066FF', 'string', 'Warna utama (hex)', true),
  ('branding.secondary_color', '#FF6600', 'string', 'Warna sekunder (hex)', true),
  
  -- Contact
  ('contact.email', 'info@myaerotravel.id', 'string', 'Email kontak', true),
  ('contact.phone', '+62-812-3456-7890', 'string', 'Nomor telepon', true),
  ('contact.whatsapp', '+62-812-3456-7890', 'string', 'WhatsApp', true),
  ('contact.address', '{"street":"Jl. Raden Intan No. 123","city":"Bandar Lampung","province":"Lampung","postalCode":"35132","country":"Indonesia","countryCode":"ID"}', 'json', 'Alamat lengkap', true),
  ('contact.geo', '{"latitude":-5.4294,"longitude":105.262}', 'json', 'Koordinat geografis', true),
  
  -- Social Media
  ('social.instagram', 'https://www.instagram.com/myaerotravel', 'string', 'Instagram URL', true),
  ('social.facebook', 'https://www.facebook.com/myaerotravel', 'string', 'Facebook URL', true),
  ('social.tiktok', 'https://www.tiktok.com/@myaerotravel', 'string', 'TikTok URL', true),
  ('social.youtube', 'https://www.youtube.com/@myaerotravel', 'string', 'YouTube URL', true),
  ('social.twitter', 'https://twitter.com/myaerotravel', 'string', 'Twitter URL', true),
  ('social.linkedin', 'https://www.linkedin.com/company/myaerotravel', 'string', 'LinkedIn URL', true),
  
  -- SEO
  ('seo.title_suffix', ' | MyAeroTravel', 'string', 'Suffix untuk page title', true),
  ('seo.default_description', 'Platform travel management terpercaya untuk pengalaman wisata bahari terbaik di Indonesia.', 'string', 'Meta description default', true),
  ('seo.default_og_image', '/og-image.jpg', 'string', 'Default OG image', true),
  ('seo.default_keywords', '["travel indonesia","paket wisata","wisata bahari","pahawang","kiluan","labuan bajo"]', 'json', 'Default keywords', true),
  
  -- Business
  ('business.hours', '{"weekdays":{"opens":"08:00","closes":"17:00"},"saturday":{"opens":"08:00","closes":"12:00"},"sunday":null}', 'json', 'Jam operasional', true),
  ('business.currency', 'IDR', 'string', 'Mata uang default', true),
  ('business.locale', 'id_ID', 'string', 'Locale default', true),
  ('business.timezone', 'Asia/Jakarta', 'string', 'Timezone default', true),
  
  -- Stats (editable trust signals)
  ('stats.total_customers', '10,000+', 'string', 'Total pelanggan', true),
  ('stats.total_trips', '5,000+', 'string', 'Total trip', true),
  ('stats.years_in_business', '7+', 'string', 'Tahun beroperasi', true),
  ('stats.average_rating', '4.9', 'string', 'Rating rata-rata', true),
  ('stats.satisfaction_rate', '98%', 'string', 'Tingkat kepuasan', true),
  ('stats.total_reviews', '1500', 'string', 'Total review', true),
  
  -- Legal
  ('legal.terms_version', '2.0', 'string', 'Versi Terms of Service', true),
  ('legal.privacy_version', '2.0', 'string', 'Versi Privacy Policy', true),
  
  -- Email
  ('email.from_name', 'Aero Travel', 'string', 'Nama pengirim email', false),
  ('email.from_address', 'noreply@aerotravel.co.id', 'string', 'Alamat email pengirim', false),
  ('email.reply_to', 'info@aerotravel.co.id', 'string', 'Reply-to email', false),
  
  -- Per-App Settings
  ('app.customer.header_color', '', 'string', 'Warna header Customer App (kosong = primary)', true),
  ('app.guide.header_color', '#059669', 'string', 'Warna header Guide App (emerald)', true),
  ('app.partner.header_color', '#ea580c', 'string', 'Warna header Partner Portal (orange)', true),
  ('app.corporate.header_color', '#2563eb', 'string', 'Warna header Corporate Portal (blue)', true),
  ('app.guide.features', '{"offline_mode":true,"voice_command":true,"sos_button":true}', 'json', 'Feature flags Guide App', false),
  ('app.partner.features', '{"ai_chat":true,"bulk_import":true,"whitelabel":true}', 'json', 'Feature flags Partner', false),
  ('app.customer.features', '{"ai_chat":true,"split_bill":true,"travel_circle":true}', 'json', 'Feature flags Customer App', false),
  ('app.corporate.features', '{"ai_chat":true,"approvals":true}', 'json', 'Feature flags Corporate', false),
  
  -- Loyalty (migrate from hardcoded, but keep existing points_per_100k and referral_bonus_points)
  ('loyalty.redemption_value', '1', 'number', 'Nilai redeem per poin (Rp)', false),
  ('loyalty.review_bonus', '50', 'number', 'Bonus poin untuk review', false),
  ('loyalty.min_booking_for_points', '100000', 'number', 'Minimum booking value untuk dapat poin', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- Note: points_per_100k and referral_bonus_points already exist in settings table
-- from migration 20251217091342_011-live-tracking.sql
-- We'll keep them and use them in the loyalty system

