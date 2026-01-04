/**
 * Admin Configurable Settings - Phase 1
 * Business Rules, Financial, Operational Settings
 * 
 * These settings can be managed through Admin Console
 */

-- ============================================
-- PARTNER REWARDS SETTINGS
-- ============================================
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  ('partner_rewards.referral_points', '1000', 'number', 'Bonus poin referral partner', false),
  ('partner_rewards.points_per_10k', '1', 'number', 'Poin per Rp 10.000 booking NTA', false),
  ('partner_rewards.min_redemption_points', '100', 'number', 'Minimum poin untuk redeem', false),
  ('partner_rewards.points_expiration_months', '12', 'number', 'Masa berlaku poin (bulan)', false),
  ('partner_rewards.milestone_configs', '[
    {"type":"bookings_10","label":"10 Bookings","value":10,"points":500,"description":"Mencapai 10 bookings"},
    {"type":"bookings_50","label":"50 Bookings","value":50,"points":2500,"description":"Mencapai 50 bookings"},
    {"type":"bookings_100","label":"100 Bookings","value":100,"points":5000,"description":"Mencapai 100 bookings"},
    {"type":"bookings_500","label":"500 Bookings","value":500,"points":25000,"description":"Mencapai 500 bookings"},
    {"type":"bookings_1000","label":"1000 Bookings","value":1000,"points":50000,"description":"Mencapai 1000 bookings"},
    {"type":"revenue_10m","label":"Revenue Rp 10M","value":10000000,"points":1000,"description":"Total revenue mencapai Rp 10 juta"},
    {"type":"revenue_50m","label":"Revenue Rp 50M","value":50000000,"points":5000,"description":"Total revenue mencapai Rp 50 juta"},
    {"type":"revenue_100m","label":"Revenue Rp 100M","value":100000000,"points":10000,"description":"Total revenue mencapai Rp 100 juta"},
    {"type":"revenue_500m","label":"Revenue Rp 500M","value":500000000,"points":50000,"description":"Total revenue mencapai Rp 500 juta"}
  ]', 'json', 'Konfigurasi milestone rewards', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- GUIDE BONUS SETTINGS
-- ============================================
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  ('guide_bonus.rating_5_percent', '0.1', 'number', 'Bonus rating 5 bintang (10%)', false),
  ('guide_bonus.rating_4_percent', '0.05', 'number', 'Bonus rating 4 bintang (5%)', false),
  ('guide_bonus.on_time_bonus', '50000', 'number', 'Bonus tepat waktu (Rp)', false),
  ('guide_bonus.documentation_bonus', '100000', 'number', 'Bonus upload dokumentasi (Rp)', false),
  ('guide_bonus.guest_count_bonus_per_pax', '10000', 'number', 'Bonus per pax melebihi target', false),
  ('guide_bonus.reward_points_percentage', '0.1', 'number', 'Persentase reward points dari bonus', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- APPROVAL LIMITS SETTINGS
-- ============================================
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  ('approvals.super_admin_limit', '0', 'number', 'Limit approval super_admin (0 = unlimited)', false),
  ('approvals.finance_manager_limit', '50000000', 'number', 'Limit approval finance manager (Rp)', false),
  ('approvals.marketing_limit', '10000000', 'number', 'Limit approval marketing (Rp)', false),
  ('approvals.ops_admin_limit', '5000000', 'number', 'Limit approval ops admin (Rp)', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- FINANCIAL SETTINGS
-- ============================================
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  ('finance.tax_rate', '0.11', 'number', 'PPN rate (11%)', false),
  ('finance.deposit_percentage', '0.5', 'number', 'Deposit percentage (50%)', false),
  ('finance.child_discount_percentage', '0.5', 'number', 'Child discount (50%)', false),
  ('finance.platform_fee_rate', '0.05', 'number', 'Platform fee rate (5%)', false),
  ('finance.guide_percentage', '0.7', 'number', 'Guide share percentage (70%)', false),
  ('finance.tax_withheld_rate', '0.025', 'number', 'Tax withheld rate (2.5%)', false),
  ('finance.cost_structures', '{
    "boat_trip": [
      {"category":"Operasional","description":"BBM Kapal","amount":500000,"isVariable":false},
      {"category":"Operasional","description":"Sewa Kapal","amount":1500000,"isVariable":false},
      {"category":"Operasional","description":"Crew Kapal","amount":300000,"isVariable":false},
      {"category":"Guide","description":"Fee Guide","amount":200000,"isVariable":false},
      {"category":"Konsumsi","description":"Makan per Pax","amount":50000,"isVariable":true},
      {"category":"Konsumsi","description":"Snack per Pax","amount":15000,"isVariable":true},
      {"category":"Perlengkapan","description":"Alat Snorkeling per Pax","amount":25000,"isVariable":true},
      {"category":"Asuransi","description":"Asuransi per Pax","amount":10000,"isVariable":true},
      {"category":"Dokumentasi","description":"Foto/Video","amount":100000,"isVariable":false}
    ],
    "land_trip": [
      {"category":"Transportasi","description":"Sewa Kendaraan","amount":800000,"isVariable":false},
      {"category":"Transportasi","description":"BBM","amount":300000,"isVariable":false},
      {"category":"Guide","description":"Fee Guide","amount":200000,"isVariable":false},
      {"category":"Konsumsi","description":"Makan per Pax","amount":75000,"isVariable":true},
      {"category":"Tiket","description":"Tiket Masuk per Pax","amount":50000,"isVariable":true},
      {"category":"Asuransi","description":"Asuransi per Pax","amount":10000,"isVariable":true}
    ]
  }', 'json', 'Default cost structures per trip type', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- RATE LIMITS SETTINGS
-- ============================================
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  ('rate_limits.guide_ai', '{"limit":10,"window":"1m"}', 'json', 'Guide AI rate limit (requests per window)', false),
  ('rate_limits.guide_upload', '{"limit":5,"window":"1m"}', 'json', 'Guide upload rate limit', false),
  ('rate_limits.guide_sos', '{"limit":3,"window":"1h"}', 'json', 'Guide SOS rate limit', false),
  ('rate_limits.guide_ocr', '{"limit":5,"window":"1m"}', 'json', 'Guide OCR rate limit', false),
  ('rate_limits.guide_push', '{"limit":20,"window":"1m"}', 'json', 'Guide push notifications rate limit', false),
  ('rate_limits.public_post', '{"limit":10,"window":"1m"}', 'json', 'Public POST rate limit', false),
  ('rate_limits.public_get', '{"limit":100,"window":"1m"}', 'json', 'Public GET rate limit', false),
  ('rate_limits.public_ai', '{"limit":5,"window":"1m"}', 'json', 'Public AI rate limit', false),
  ('rate_limits.ai_chat', '{"limit":10,"window":"1m"}', 'json', 'AI chat rate limit', false),
  ('rate_limits.payment', '{"limit":5,"window":"1m"}', 'json', 'Payment verification rate limit', false),
  ('rate_limits.general_api', '{"limit":100,"window":"5m"}', 'json', 'General API rate limit', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- GEOFENCING & GPS SETTINGS
-- ============================================
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  ('geofencing.gps_timeout_ms', '10000', 'number', 'GPS timeout (ms)', false),
  ('geofencing.gps_max_age_ms', '0', 'number', 'GPS max age untuk getCurrentPosition (ms)', false),
  ('geofencing.gps_watch_max_age_ms', '5000', 'number', 'GPS max age untuk watchPosition (ms)', false),
  ('geofencing.default_radius_meters', '50', 'number', 'Default geofence radius (meters)', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- INTEGRATION SETTINGS
-- ============================================
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  ('integrations.whatsapp_max_retries', '3', 'number', 'WhatsApp max retry attempts', false),
  ('integrations.request_timeout_ms', '30000', 'number', 'Default request timeout (ms)', false),
  ('integrations.webhook_timeout_ms', '10000', 'number', 'Webhook timeout (ms)', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- VALIDATION RULES SETTINGS
-- ============================================
INSERT INTO settings (key, value, value_type, description, is_public) VALUES
  ('validation.package_code_min_length', '3', 'number', 'Min length package code', false),
  ('validation.package_code_max_length', '20', 'number', 'Max length package code', false),
  ('validation.package_name_min_length', '3', 'number', 'Min length package name', false),
  ('validation.package_name_max_length', '200', 'number', 'Max length package name', false),
  ('validation.slug_min_length', '3', 'number', 'Min length slug', false),
  ('validation.slug_max_length', '200', 'number', 'Max length slug', false),
  ('validation.short_description_max_length', '500', 'number', 'Max length short description', false),
  ('validation.min_pax_minimum', '1', 'number', 'Minimum value for min pax', false),
  ('validation.max_pax_minimum', '1', 'number', 'Minimum value for max pax', false)
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE settings IS 'Centralized configurable settings for admin management. Keys are organized by category prefix (e.g., partner_rewards., guide_bonus., finance., etc.)';

