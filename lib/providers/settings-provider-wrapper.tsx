/**
 * Settings Provider Wrapper (Server Component)
 * Fetches initial settings on server and passes to client provider
 */

import { getInitialSettings } from '@/lib/settings/server';
import { SettingsProvider } from './settings-provider';

export async function SettingsProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSettings = await getInitialSettings();

  return (
    <SettingsProvider initialSettings={initialSettings}>
      {children}
    </SettingsProvider>
  );
}

