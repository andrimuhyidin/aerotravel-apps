/**
 * Settings Types
 * TypeScript types untuk semua configurable settings
 */

export type SettingValueType = 'string' | 'number' | 'boolean' | 'json';

export type Setting = {
  id: string;
  key: string;
  value: string;
  value_type: SettingValueType;
  description: string | null;
  is_public: boolean;
  branch_id: string | null;
  updated_at: string;
  updated_by: string | null;
};

// Parsed setting values
export type ParsedSettingValue = string | number | boolean | Record<string, unknown> | null;

// Branding settings
export type BrandingSettings = {
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  app_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
};

// Contact settings
export type ContactAddress = {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  countryCode: string;
};

export type ContactGeo = {
  latitude: number;
  longitude: number;
};

export type ContactSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  address: ContactAddress;
  geo: ContactGeo;
};

// Social media settings
export type SocialSettings = {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  twitter: string;
  linkedin: string;
};

// SEO settings
export type SEOSettings = {
  title_suffix: string;
  default_description: string;
  default_og_image: string;
  default_keywords: string[];
};

// Business settings
export type BusinessHours = {
  weekdays?: { opens: string; closes: string };
  saturday?: { opens: string; closes: string };
  sunday?: null | { opens: string; closes: string };
};

export type BusinessSettings = {
  hours: BusinessHours;
  currency: string;
  locale: string;
  timezone: string;
};

// Stats settings
export type StatsSettings = {
  total_customers: string;
  total_trips: string;
  years_in_business: string;
  average_rating: string;
  satisfaction_rate: string;
  total_reviews: string;
};

// Legal settings
export type LegalSettings = {
  terms_version: string;
  privacy_version: string;
};

// Email settings
export type EmailSettings = {
  from_name: string;
  from_address: string;
  reply_to: string;
};

// App feature flags
export type AppFeatures = {
  offline_mode?: boolean;
  voice_command?: boolean;
  sos_button?: boolean;
  ai_chat?: boolean;
  bulk_import?: boolean;
  whitelabel?: boolean;
  split_bill?: boolean;
  travel_circle?: boolean;
  approvals?: boolean;
};

// Per-app settings
export type AppSettings = {
  header_color: string;
  logo_override?: string;
  features: AppFeatures;
};

// Loyalty settings
export type LoyaltySettings = {
  points_per_100k: number;
  redemption_value: number;
  review_bonus: number;
  referral_bonus: number;
  min_booking_for_points: number;
};

// =====================================================
// AI Configuration Settings
// =====================================================
export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export type AISettings = {
  provider: AIProvider;
  model: string;
  api_key?: string; // Encrypted in database
  max_tokens: number;
  temperature: number;
  rate_limit_rpm: number;
  speech_enabled: boolean;
  speech_api_key?: string; // Encrypted in database
  vision_enabled: boolean;
};

// =====================================================
// Maps Configuration Settings
// =====================================================
export type MapsProvider = 'google' | 'mapbox';

export type MapsSettings = {
  provider: MapsProvider;
  api_key?: string; // Encrypted in database
  default_lat: number;
  default_lng: number;
  default_zoom: number;
  route_optimization_enabled: boolean;
};

// =====================================================
// Weather Configuration Settings
// =====================================================
export type WeatherProvider = 'openweathermap';

export type WeatherSettings = {
  enabled: boolean;
  provider: WeatherProvider;
  api_key?: string; // Encrypted in database
  wind_threshold: number; // km/h
  rain_threshold: number; // mm
  wave_threshold: number; // meters
  check_interval_hours: number;
};

// =====================================================
// Rate Limiting Configuration Settings
// =====================================================
export type RateLimitSettings = {
  enabled: boolean;
  redis_url?: string; // Encrypted in database
  redis_token?: string; // Encrypted in database
  default_limit: number; // requests per minute
  ai_limit: number; // AI requests per minute
  api_limit: number; // API requests per minute
  auth_limit: number; // Auth attempts per minute
};

// All settings grouped
export type AllSettings = {
  branding: BrandingSettings;
  contact: ContactSettings;
  social: SocialSettings;
  seo: SEOSettings;
  business: BusinessSettings;
  stats: StatsSettings;
  legal: LegalSettings;
  email: EmailSettings;
  apps: {
    customer: AppSettings;
    guide: AppSettings;
    partner: AppSettings;
    corporate: AppSettings;
  };
  loyalty: LoyaltySettings;
  // New configurable settings
  ai: AISettings;
  maps: MapsSettings;
  weather: WeatherSettings;
  ratelimit: RateLimitSettings;
};

// App code type
export type AppCode = 'customer' | 'guide' | 'partner' | 'corporate';

