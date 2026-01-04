/**
 * Settings Library
 * Core functions untuk fetch dan manage settings dari database
 * Dengan caching support menggunakan Redis
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getCached, invalidateCache } from '@/lib/cache/redis-cache';
import { logger } from '@/lib/utils/logger';
import type {
  ParsedSettingValue,
  AllSettings,
  BrandingSettings,
  ContactSettings,
  SocialSettings,
  SEOSettings,
  BusinessSettings,
  StatsSettings,
  LegalSettings,
  EmailSettings,
  AppSettings,
  LoyaltySettings,
  AppCode,
  AISettings,
  MapsSettings,
  WeatherSettings,
  RateLimitSettings,
  AIProvider,
  MapsProvider,
  WeatherProvider,
} from './types';
import { decryptSensitiveValue } from './encryption';

// Cache TTL: 5 minutes (300 seconds)
const SETTINGS_CACHE_TTL = 300;

/**
 * Parse setting value berdasarkan value_type
 */
function parseSettingValue(
  value: string,
  valueType: string
): ParsedSettingValue {
  if (valueType === 'number') {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  if (valueType === 'boolean') {
    return value === 'true' || value === '1';
  }
  if (valueType === 'json') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return value;
}

/**
 * Get single setting by key
 */
export async function getSetting(
  key: string,
  branchId: string | null = null
): Promise<ParsedSettingValue | null> {
  const cacheKey = `settings:${branchId || 'global'}:${key}`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .is('branch_id', branchId || null)
        .maybeSingle();

      if (error || !data) {
        logger.warn('Setting not found', { key, branchId, error });
        return null;
      }

      return parseSettingValue(data.value, data.value_type);
    }
  );
}

/**
 * Get multiple settings by prefix (e.g., 'branding.*')
 */
export async function getSettings(
  prefix: string,
  branchId: string | null = null
): Promise<Record<string, ParsedSettingValue>> {
  const cacheKey = `settings:${branchId || 'global'}:prefix:${prefix}`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .like('key', `${prefix}%`)
        .is('branch_id', branchId || null);

      if (error || !data) {
        logger.warn('Settings not found', { prefix, branchId, error });
        return {};
      }

      const result: Record<string, ParsedSettingValue> = {};
      for (const setting of data) {
        const key = setting.key.replace(`${prefix}.`, '');
        result[key] = parseSettingValue(setting.value, setting.value_type);
      }

      return result;
    }
  );
}

/**
 * Get all public settings (is_public = true)
 */
export async function getAllPublicSettings(
  branchId: string | null = null
): Promise<Record<string, ParsedSettingValue>> {
  const cacheKey = `settings:${branchId || 'global'}:public:all`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('is_public', true)
        .is('branch_id', branchId || null);

      if (error || !data) {
        logger.error('Failed to fetch public settings', error, {
          branchId,
        });
        return {};
      }

      const result: Record<string, ParsedSettingValue> = {};
      for (const setting of data) {
        result[setting.key] = parseSettingValue(
          setting.value,
          setting.value_type
        );
      }

      return result;
    }
  );
}

/**
 * Get all settings grouped by category
 */
export async function getAllSettings(
  branchId: string | null = null
): Promise<Partial<AllSettings>> {
  const cacheKey = `settings:${branchId || 'global'}:all:grouped`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const [
        branding,
        contact,
        social,
        seo,
        business,
        stats,
        legal,
        email,
        customerApp,
        guideApp,
        partnerApp,
        corporateApp,
        loyalty,
      ] = await Promise.all([
        getSettings('branding', branchId),
        getSettings('contact', branchId),
        getSettings('social', branchId),
        getSettings('seo', branchId),
        getSettings('business', branchId),
        getSettings('stats', branchId),
        getSettings('legal', branchId),
        getSettings('email', branchId),
        getSettings('app.customer', branchId),
        getSettings('app.guide', branchId),
        getSettings('app.partner', branchId),
        getSettings('app.corporate', branchId),
        getSettings('loyalty', branchId),
      ]);

      // Get points_per_100k and referral_bonus_points from existing settings
      const pointsPer100k = await getSetting('points_per_100k', branchId);
      const referralBonus = await getSetting('referral_bonus_points', branchId);

      return {
        branding: branding as unknown as BrandingSettings,
        contact: {
          ...contact,
          address: contact.address as ContactSettings['address'],
          geo: contact.geo as ContactSettings['geo'],
        } as ContactSettings,
        social: social as unknown as SocialSettings,
        seo: {
          ...seo,
          default_keywords:
            typeof seo.default_keywords === 'string'
              ? JSON.parse(seo.default_keywords as string)
              : (seo.default_keywords as string[]),
        } as SEOSettings,
        business: {
          ...business,
          hours: business.hours as BusinessSettings['hours'],
        } as BusinessSettings,
        stats: stats as unknown as StatsSettings,
        legal: legal as unknown as LegalSettings,
        email: email as unknown as EmailSettings,
        apps: {
          customer: {
            header_color: (customerApp.header_color as string) || '',
            features: (customerApp.features as AppSettings['features']) || {},
          },
          guide: {
            header_color: (guideApp.header_color as string) || '#059669',
            features: (guideApp.features as AppSettings['features']) || {},
          },
          partner: {
            header_color: (partnerApp.header_color as string) || '#ea580c',
            features: (partnerApp.features as AppSettings['features']) || {},
          },
          corporate: {
            header_color: (corporateApp.header_color as string) || '#2563eb',
            features: (corporateApp.features as AppSettings['features']) || {},
          },
        },
        loyalty: {
          ...loyalty,
          points_per_100k:
            (pointsPer100k as number) || (loyalty.points_per_100k as number) || 10,
          referral_bonus:
            (referralBonus as number) ||
            (loyalty.referral_bonus as number) ||
            10000,
        } as LoyaltySettings,
      };
    }
  );
}

/**
 * Get settings for specific app
 */
export async function getAppSettings(
  appCode: AppCode,
  branchId: string | null = null
): Promise<AppSettings> {
  const cacheKey = `settings:${branchId || 'global'}:app:${appCode}`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const appSettings = await getSettings(`app.${appCode}`, branchId);

      // Default colors if not set
      const defaultColors: Record<AppCode, string> = {
        customer: '',
        guide: '#059669',
        partner: '#ea580c',
        corporate: '#2563eb',
      };

      return {
        header_color:
          (appSettings.header_color as string) || defaultColors[appCode],
        logo_override: appSettings.logo_override as string | undefined,
        features: (appSettings.features as AppSettings['features']) || {},
      };
    }
  );
}

/**
 * Get AI configuration settings
 */
export async function getAISettings(
  branchId: string | null = null
): Promise<AISettings> {
  const cacheKey = `settings:${branchId || 'global'}:ai`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .like('key', 'ai.%')
        .is('branch_id', branchId || null);

      if (error || !data) {
        logger.warn('AI settings not found', { branchId, error });
      }

      // Build settings object with defaults
      const settings: Record<string, ParsedSettingValue> = {};
      for (const setting of data || []) {
        const key = setting.key.replace('ai.', '');
        // Decrypt if sensitive
        if (setting.is_sensitive && setting.value_encrypted) {
          const decrypted = await decryptSensitiveValue(setting.value_encrypted);
          settings[key] = decrypted || null;
        } else {
          settings[key] = parseSettingValue(setting.value, setting.value_type);
        }
      }

      return {
        provider: (settings.provider as AIProvider) || 'gemini',
        model: (settings.model as string) || 'gemini-2.0-flash',
        api_key: settings.api_key as string | undefined,
        max_tokens: (settings.max_tokens as number) || 4096,
        temperature: (settings.temperature as number) || 0.7,
        rate_limit_rpm: (settings.rate_limit_rpm as number) || 60,
        speech_enabled: (settings.speech_enabled as boolean) || false,
        speech_api_key: settings.speech_api_key as string | undefined,
        vision_enabled: (settings.vision_enabled as boolean) || true,
      };
    }
  );
}

/**
 * Get Maps configuration settings
 */
export async function getMapsSettings(
  branchId: string | null = null
): Promise<MapsSettings> {
  const cacheKey = `settings:${branchId || 'global'}:maps`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .like('key', 'maps.%')
        .is('branch_id', branchId || null);

      if (error || !data) {
        logger.warn('Maps settings not found', { branchId, error });
      }

      const settings: Record<string, ParsedSettingValue> = {};
      for (const setting of data || []) {
        const key = setting.key.replace('maps.', '');
        if (setting.is_sensitive && setting.value_encrypted) {
          const decrypted = await decryptSensitiveValue(setting.value_encrypted);
          settings[key] = decrypted || null;
        } else {
          settings[key] = parseSettingValue(setting.value, setting.value_type);
        }
      }

      return {
        provider: (settings.provider as MapsProvider) || 'google',
        api_key: settings.api_key as string | undefined,
        default_lat: (settings.default_lat as number) || -6.2088,
        default_lng: (settings.default_lng as number) || 106.8456,
        default_zoom: (settings.default_zoom as number) || 12,
        route_optimization_enabled:
          (settings.route_optimization_enabled as boolean) ?? true,
      };
    }
  );
}

/**
 * Get Weather configuration settings
 */
export async function getWeatherSettings(
  branchId: string | null = null
): Promise<WeatherSettings> {
  const cacheKey = `settings:${branchId || 'global'}:weather`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .like('key', 'weather.%')
        .is('branch_id', branchId || null);

      if (error || !data) {
        logger.warn('Weather settings not found', { branchId, error });
      }

      const settings: Record<string, ParsedSettingValue> = {};
      for (const setting of data || []) {
        const key = setting.key.replace('weather.', '');
        if (setting.is_sensitive && setting.value_encrypted) {
          const decrypted = await decryptSensitiveValue(setting.value_encrypted);
          settings[key] = decrypted || null;
        } else {
          settings[key] = parseSettingValue(setting.value, setting.value_type);
        }
      }

      return {
        enabled: (settings.enabled as boolean) ?? true,
        provider: (settings.provider as WeatherProvider) || 'openweathermap',
        api_key: settings.api_key as string | undefined,
        wind_threshold: (settings.wind_threshold as number) || 40,
        rain_threshold: (settings.rain_threshold as number) || 50,
        wave_threshold: (settings.wave_threshold as number) || 2,
        check_interval_hours: (settings.check_interval_hours as number) || 3,
      };
    }
  );
}

/**
 * Get Rate Limiting configuration settings
 */
export async function getRateLimitSettings(
  branchId: string | null = null
): Promise<RateLimitSettings> {
  const cacheKey = `settings:${branchId || 'global'}:ratelimit`;

  return getCached(
    cacheKey,
    SETTINGS_CACHE_TTL,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .like('key', 'ratelimit.%')
        .is('branch_id', branchId || null);

      if (error || !data) {
        logger.warn('Rate limit settings not found', { branchId, error });
      }

      const settings: Record<string, ParsedSettingValue> = {};
      for (const setting of data || []) {
        const key = setting.key.replace('ratelimit.', '');
        if (setting.is_sensitive && setting.value_encrypted) {
          const decrypted = await decryptSensitiveValue(setting.value_encrypted);
          settings[key] = decrypted || null;
        } else {
          settings[key] = parseSettingValue(setting.value, setting.value_type);
        }
      }

      return {
        enabled: (settings.enabled as boolean) ?? true,
        redis_url: settings.redis_url as string | undefined,
        redis_token: settings.redis_token as string | undefined,
        default_limit: (settings.default_limit as number) || 100,
        ai_limit: (settings.ai_limit as number) || 60,
        api_limit: (settings.api_limit as number) || 200,
        auth_limit: (settings.auth_limit as number) || 10,
      };
    }
  );
}

/**
 * Invalidate settings cache
 * Call this after updating settings in admin console
 */
export async function invalidateSettingsCache(
  branchId: string | null = null
): Promise<void> {
  const prefix = branchId || 'global';
  await invalidateCache(`settings:${prefix}:*`);
  logger.info('Settings cache invalidated', { branchId });
}

