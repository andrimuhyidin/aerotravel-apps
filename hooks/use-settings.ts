/**
 * useSettings Hook
 * Re-export from SettingsProvider for convenience
 */

export { useSettings } from '@/lib/providers/settings-provider';

/**
 * useAppSettings Hook
 * Get settings for specific app
 */
import { useSettings } from '@/lib/providers/settings-provider';
import type { AppCode, AppSettings } from '@/lib/settings/types';

export function useAppSettings(appCode: AppCode): AppSettings | null {
  const { settings } = useSettings();

  if (!settings?.apps) {
    return null;
  }

  const appSettings = settings.apps[appCode];
  if (!appSettings) {
    return null;
  }

  // Ensure defaults
  const defaults: Record<AppCode, string> = {
    customer: '',
    guide: '#059669',
    partner: '#ea580c',
    corporate: '#2563eb',
  };

  return {
    header_color: appSettings.header_color || defaults[appCode],
    logo_override: appSettings.logo_override,
    features: appSettings.features || {},
  };
}

