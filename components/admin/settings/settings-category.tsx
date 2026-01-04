/**
 * Settings Category Component
 * Wrapper component for a settings category with header and items
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { SettingItem, getSettingLabel, type Setting } from './setting-item';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type SettingsCategoryProps = {
  title: string;
  description?: string;
  prefixes: string[];
  legacyKeys?: string[];
  children?: React.ReactNode;
};

export function SettingsCategory({
  title,
  description,
  prefixes,
  legacyKeys = [],
  children,
}: SettingsCategoryProps) {
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const {
    data: settingsData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ settings: Setting[] }>({
    queryKey: queryKeys.admin?.settings?.all() || ['admin', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, branch_id: null }),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to update setting');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin?.settings?.all(),
      });
      toast.success(`Setting "${getSettingLabel(variables.key)}" berhasil diupdate`);
      setEditedValues((prev) => {
        const newValues = { ...prev };
        delete newValues[variables.key];
        return newValues;
      });
      setSavingKey(null);
    },
    onError: (err) => {
      logger.error('Failed to update setting', err);
      toast.error(
        err instanceof Error ? err.message : 'Gagal update setting'
      );
      setSavingKey(null);
    },
  });

  const handleSave = (key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
      setSavingKey(key);
      updateMutation.mutate({ key, value });
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const getCurrentValue = (setting: Setting) => {
    return editedValues[setting.key] !== undefined
      ? editedValues[setting.key]
      : setting.value;
  };

  const hasChanges = (key: string, originalValue: string) => {
    return editedValues[key] !== undefined && editedValues[key] !== originalValue;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Gagal memuat settings"
        onRetry={() => void refetch()}
      />
    );
  }

  const allSettings = settingsData?.settings || [];

  // Filter settings by prefixes and legacy keys
  const filteredSettings = allSettings.filter((s) => {
    const matchesPrefix = prefixes.some((prefix) => s.key.startsWith(prefix));
    const matchesLegacy = legacyKeys.includes(s.key);
    return matchesPrefix || matchesLegacy;
  });

  // Group by prefix for better organization
  const groupedSettings: Record<string, Setting[]> = {};
  filteredSettings.forEach((setting) => {
    const prefix = setting.key.split('.')[0] || 'other';
    if (!groupedSettings[prefix]) {
      groupedSettings[prefix] = [];
    }
    groupedSettings[prefix].push(setting);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {filteredSettings.length === 0 && !children ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Belum ada settings untuk kategori ini.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Jalankan migration untuk menambahkan settings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSettings.map((setting) => (
            <SettingItem
              key={setting.id}
              setting={setting}
              label={getSettingLabel(setting.key)}
              value={getCurrentValue(setting)}
              isChanged={hasChanges(setting.key, setting.value)}
              isSaving={savingKey === setting.key}
              onValueChange={(value) => handleChange(setting.key, value)}
              onSave={() => handleSave(setting.key)}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

