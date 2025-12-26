'use client';

/**
 * Admin Settings Management Client
 * Manage system-wide settings (geofence radius, penalties, etc.)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Loader2,
  Save,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorState } from '@/components/ui/error-state';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type Setting = {
  id: string;
  key: string;
  value: string;
  value_type: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
};

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState('operational');
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

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
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error || 'Failed to update setting');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin?.settings?.all(),
      });
      toast.success(`Setting "${variables.key}" berhasil diupdate`);
      // Clear edited value
      setEditedValues((prev) => {
        const newValues = { ...prev };
        delete newValues[variables.key];
        return newValues;
      });
    },
    onError: (error) => {
      logger.error('Failed to update setting', error);
      toast.error(
        error instanceof Error ? error.message : 'Gagal update setting'
      );
    },
  });

  const handleSave = (key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
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

  const hasChanges = (key: string) => {
    return editedValues[key] !== undefined;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
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

  const settings = settingsData?.settings || [];

  // Group settings by category
  const operationalSettings = settings.filter((s) =>
    [
      'geofence_radius_meters',
      'late_penalty_amount',
      'late_threshold_minutes',
      'sla_ticket_minutes',
    ].includes(s.key)
  );
  const paymentSettings = settings.filter((s) =>
    [
      'split_bill_expiry_hours',
      'points_per_100k',
      'referral_bonus_points',
    ].includes(s.key)
  );
  const systemSettings = settings.filter((s) =>
    ['data_retention_days', 'insurance_email'].includes(s.key)
  );

  const renderSetting = (setting: Setting) => {
    const currentValue = getCurrentValue(setting);
    const changed = hasChanges(setting.key);
    const isNumber = setting.value_type === 'number';

    // Format display for large numbers
    const displayValue =
      isNumber && currentValue && parseInt(currentValue) > 10000
        ? `${parseInt(currentValue).toLocaleString()} (${(parseInt(currentValue) / 1000).toLocaleString()} km)`
        : currentValue || '';

    return (
      <Card key={setting.id}>
        <CardHeader>
          <CardTitle className="text-base">
            {formatSettingLabel(setting.key)}
          </CardTitle>
          {setting.description && (
            <CardDescription>{setting.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor={setting.key} className="text-xs text-slate-600">
                Nilai {isNumber ? `(${displayValue})` : ''}
              </Label>
              <Input
                id={setting.key}
                type={isNumber ? 'number' : 'text'}
                value={currentValue}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => handleSave(setting.key)}
              disabled={!changed || updateMutation.isPending}
              size="sm"
              className={changed ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {updateMutation.isPending &&
              updateMutation.variables?.key === setting.key ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : changed ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tersimpan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
          <SettingsIcon className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-slate-600">
            Kelola pengaturan sistem global
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="operational">Operasional</TabsTrigger>
          <TabsTrigger value="payment">Pembayaran & Poin</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="operational" className="mt-6 space-y-4">
          {operationalSettings.map((setting) => renderSetting(setting))}
        </TabsContent>

        <TabsContent value="payment" className="mt-6 space-y-4">
          {paymentSettings.map((setting) => renderSetting(setting))}
        </TabsContent>

        <TabsContent value="system" className="mt-6 space-y-4">
          {systemSettings.map((setting) => renderSetting(setting))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatSettingLabel(key: string): string {
  const labels: Record<string, string> = {
    geofence_radius_meters: 'Radius Absensi (Geofence)',
    late_penalty_amount: 'Denda Keterlambatan',
    late_threshold_minutes: 'Toleransi Keterlambatan',
    sla_ticket_minutes: 'SLA Ticket',
    split_bill_expiry_hours: 'Masa Berlaku Split Bill',
    points_per_100k: 'Poin per Rp 100.000',
    referral_bonus_points: 'Bonus Poin Referral',
    data_retention_days: 'Retensi Data KTP',
    insurance_email: 'Email Asuransi',
  };
  return labels[key] || key;
}
