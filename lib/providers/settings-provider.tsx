'use client';

/**
 * Settings Provider
 * Provides settings context to all components
 * Fetches from /api/settings and caches client-side
 */

import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import type { AllSettings } from '@/lib/settings/types';

type SettingsContextValue = {
  settings: Partial<AllSettings> | null;
  isLoading: boolean;
  error: Error | null;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

type SettingsProviderProps = {
  children: ReactNode;
  initialSettings?: Partial<AllSettings> | null;
};

export function SettingsProvider({
  children,
  initialSettings = null,
}: SettingsProviderProps) {
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<Partial<AllSettings>>({
    queryKey: ['settings', 'public'],
    queryFn: async () => {
      const res = await fetch('/api/settings?format=grouped');
      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }
      const json = (await res.json()) as { settings: Partial<AllSettings> };
      return json.settings;
    },
    initialData: initialSettings || undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return (
    <SettingsContext.Provider
      value={{
        settings: settings || null,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}


/**
 * Hook to use settings
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

