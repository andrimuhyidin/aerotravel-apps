'use client';

/**
 * Settings Client Component
 * Pengaturan aplikasi untuk guide dengan state management
 */

import { Bell, Globe, Moon, Smartphone } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SettingsClientProps = {
  locale: string;
};

type SettingItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  key: string;
  enabled: boolean;
  iconColor?: string;
};

export function SettingsClient({ locale: _locale }: SettingsClientProps) {
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      icon: Bell,
      label: 'Notifikasi Push',
      description: 'Terima notifikasi penting tentang trip',
      key: 'push_notifications',
      enabled: true,
      iconColor: 'bg-orange-500',
    },
    {
      icon: Smartphone,
      label: 'GPS Selalu Aktif',
      description: 'Izinkan aplikasi mengakses lokasi di background',
      key: 'gps_always_on',
      enabled: true,
      iconColor: 'bg-blue-500',
    },
    {
      icon: Globe,
      label: 'Bahasa',
      description: 'Bahasa Indonesia',
      key: 'language',
      enabled: true,
      iconColor: 'bg-emerald-500',
    },
    {
      icon: Moon,
      label: 'Mode Gelap',
      description: 'Tema gelap untuk mata',
      key: 'dark_mode',
      enabled: false,
      iconColor: 'bg-slate-600',
    },
  ]);

  const handleToggle = (key: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-600">Kelola preferensi aplikasi</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Preferensi Aplikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {settings.map((setting, i) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.key}
                className={cn(
                  'flex min-h-[72px] items-center justify-between px-4 py-4 transition-colors hover:bg-slate-50',
                  i === 0 && 'rounded-t-lg',
                  i === settings.length - 1 && 'rounded-b-lg',
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                      setting.iconColor ?? 'bg-slate-500',
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{setting.label}</p>
                    {setting.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{setting.description}</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => handleToggle(setting.key)}
                  aria-label={setting.label}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
