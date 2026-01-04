/**
 * Server-side Settings Helpers
 * For SSR and initial data loading
 */

import 'server-only';

import { getAllSettings } from './index';
import type { AllSettings } from './types';

/**
 * Get initial settings for SSR
 * Use this in page/layout components to pass initial data to SettingsProvider
 */
export async function getInitialSettings(): Promise<Partial<AllSettings> | null> {
  try {
    return await getAllSettings(null);
  } catch (error) {
    // Silently fail - client will fetch
    return null;
  }
}

