/**
 * Environment Fallback Utility
 * Provides hybrid configuration: database settings first, env vars as fallback
 *
 * This allows:
 * 1. Easy configuration via admin panel (stored in DB)
 * 2. Fallback to .env for development or if DB not configured
 * 3. Seamless migration from env-based to DB-based config
 */

import 'server-only';

import { env } from '@/lib/env';
import { getSetting } from './index';
import { decryptSensitiveValue } from './encryption';
import { logger } from '@/lib/utils/logger';

// Mapping of setting keys to env variable names
type EnvKeyMapping = {
  // AI Settings
  'ai.api_key': 'GEMINI_API_KEY';
  'ai.speech_api_key': 'GOOGLE_SPEECH_TO_TEXT_API_KEY';

  // Maps Settings
  'maps.api_key': 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY';

  // Weather Settings
  'weather.api_key': 'OPENWEATHER_API_KEY';

  // Rate Limit Settings
  'ratelimit.redis_url': 'UPSTASH_REDIS_REST_URL';
  'ratelimit.redis_token': 'UPSTASH_REDIS_REST_TOKEN';
};

type SettingKey = keyof EnvKeyMapping;
type EnvKey = EnvKeyMapping[SettingKey];

// Type-safe mapping
const settingToEnvMap: Record<SettingKey, EnvKey> = {
  'ai.api_key': 'GEMINI_API_KEY',
  'ai.speech_api_key': 'GOOGLE_SPEECH_TO_TEXT_API_KEY',
  'maps.api_key': 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'weather.api_key': 'OPENWEATHER_API_KEY',
  'ratelimit.redis_url': 'UPSTASH_REDIS_REST_URL',
  'ratelimit.redis_token': 'UPSTASH_REDIS_REST_TOKEN',
};

/**
 * Get a configuration value with database priority and env fallback
 *
 * @param settingKey - The database setting key (e.g., 'ai.api_key')
 * @param defaultValue - Optional default value if neither DB nor env has the value
 * @param branchId - Optional branch ID for multi-tenant settings
 * @returns The configuration value from DB, env, or default
 *
 * @example
 * const apiKey = await getConfigValue('ai.api_key');
 * const redisUrl = await getConfigValue('ratelimit.redis_url', 'redis://localhost');
 */
export async function getConfigValue(
  settingKey: SettingKey,
  defaultValue?: string,
  branchId: string | null = null
): Promise<string | undefined> {
  try {
    // 1. Try database first
    const dbValue = await getSetting(settingKey, branchId);
    if (dbValue && typeof dbValue === 'string' && dbValue.length > 0) {
      logger.debug('Config loaded from database', { key: settingKey });
      return dbValue;
    }

    // 2. Fallback to environment variable
    const envKey = settingToEnvMap[settingKey];
    if (envKey) {
      const envValue = env[envKey as keyof typeof env];
      if (envValue && typeof envValue === 'string' && envValue.length > 0) {
        logger.debug('Config loaded from env', { key: settingKey, envKey });
        return envValue;
      }
    }

    // 3. Return default value
    if (defaultValue) {
      logger.debug('Config using default value', { key: settingKey });
      return defaultValue;
    }

    return undefined;
  } catch (error) {
    logger.error('Error getting config value', error, { settingKey });

    // On error, try env as final fallback
    const envKey = settingToEnvMap[settingKey];
    if (envKey) {
      const envValue = env[envKey as keyof typeof env];
      if (envValue) return envValue as string;
    }

    return defaultValue;
  }
}

/**
 * Get a sensitive configuration value (encrypted in DB)
 * Same priority: DB first, env fallback
 *
 * @param settingKey - The database setting key for sensitive data
 * @param branchId - Optional branch ID for multi-tenant settings
 * @returns The decrypted value from DB or env fallback
 */
export async function getSensitiveConfigValue(
  settingKey: SettingKey,
  branchId: string | null = null
): Promise<string | undefined> {
  try {
    // 1. Try database first (with decryption)
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data } = await supabase
      .from('settings')
      .select('value, value_encrypted, is_sensitive')
      .eq('key', settingKey)
      .is('branch_id', branchId || null)
      .maybeSingle();

    if (data) {
      // If sensitive and encrypted, decrypt it
      if (data.is_sensitive && data.value_encrypted) {
        const decrypted = await decryptSensitiveValue(data.value_encrypted);
        if (decrypted) {
          logger.debug('Sensitive config loaded from database (decrypted)', {
            key: settingKey,
          });
          return decrypted;
        }
      }
      // If not encrypted but has value
      if (data.value && !data.value.startsWith('••••')) {
        return data.value;
      }
    }

    // 2. Fallback to environment variable
    const envKey = settingToEnvMap[settingKey];
    if (envKey) {
      const envValue = env[envKey as keyof typeof env];
      if (envValue) {
        logger.debug('Sensitive config loaded from env', {
          key: settingKey,
          envKey,
        });
        return envValue as string;
      }
    }

    return undefined;
  } catch (error) {
    logger.error('Error getting sensitive config value', error, { settingKey });

    // Fallback to env
    const envKey = settingToEnvMap[settingKey];
    if (envKey) {
      const envValue = env[envKey as keyof typeof env];
      if (envValue) return envValue as string;
    }

    return undefined;
  }
}

/**
 * Check if a config is set (either in DB or env)
 *
 * @param settingKey - The setting key to check
 * @returns true if value exists and is non-empty
 */
export async function isConfigured(
  settingKey: SettingKey,
  branchId: string | null = null
): Promise<boolean> {
  const value = await getConfigValue(settingKey, undefined, branchId);
  return !!value && value.length > 0;
}

/**
 * Get multiple config values at once
 *
 * @param keys - Array of setting keys
 * @param branchId - Optional branch ID
 * @returns Object with key-value pairs
 */
export async function getMultipleConfigValues(
  keys: SettingKey[],
  branchId: string | null = null
): Promise<Partial<Record<SettingKey, string>>> {
  const results: Partial<Record<SettingKey, string>> = {};

  await Promise.all(
    keys.map(async (key) => {
      const value = await getConfigValue(key, undefined, branchId);
      if (value) {
        results[key] = value;
      }
    })
  );

  return results;
}

/**
 * Get the source of a configuration value
 * Useful for debugging and admin UI
 *
 * @param settingKey - The setting key to check
 * @returns 'database', 'env', or 'none'
 */
export async function getConfigSource(
  settingKey: SettingKey,
  branchId: string | null = null
): Promise<'database' | 'env' | 'none'> {
  // Check DB first
  const dbValue = await getSetting(settingKey, branchId);
  if (dbValue && typeof dbValue === 'string' && dbValue.length > 0) {
    return 'database';
  }

  // Check env
  const envKey = settingToEnvMap[settingKey];
  if (envKey) {
    const envValue = env[envKey as keyof typeof env];
    if (envValue) return 'env';
  }

  return 'none';
}

