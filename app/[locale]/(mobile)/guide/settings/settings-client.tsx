'use client';

/**
 * Settings Client Component
 * Pengaturan aplikasi untuk guide dengan state management
 * Menggabungkan Settings dan Preferences
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Globe, Moon, RotateCcw, Smartphone, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { Switch } from '@/components/ui/switch';
import queryKeys from '@/lib/queries/query-keys';
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

type GuidePreferences = {
  guide_id: string;
  preferred_trip_types: string[];
  preferred_locations: string[];
  preferred_days_of_week: number[];
  preferred_time_slots: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
  };
  max_trips_per_day: number;
  max_trips_per_week: number;
  notification_preferences: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  preferred_language: string;
  theme_preference: string;
  dashboard_layout: Record<string, unknown> | null;
  learning_style: string | null;
  preferred_content_format: string | null;
  favorite_destinations: string[];
  preferred_durations: string[];
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Minggu' },
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
];

export function SettingsClient({ locale: _locale }: SettingsClientProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Handle hash navigation (e.g., /guide/settings#language)
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash === '#language') {
      // Scroll to language section after a short delay to ensure DOM is ready
      setTimeout(() => {
        const languageSection = document.getElementById('language-settings');
        if (languageSection) {
          languageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Also expand preferences section if collapsed
          setShowPreferences(true);
        }
      }, 300);
    }
  }, []);

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

  // Fetch preferences
  const { data: preferencesData, isLoading: preferencesLoading, error: preferencesError, refetch: preferencesRefetch } = useQuery<{
    preferences: GuidePreferences;
  }>({
    queryKey: queryKeys.guide.preferences(),
    queryFn: async () => {
      const res = await fetch('/api/guide/preferences');
      if (!res.ok) throw new Error('Failed to load preferences');
      return (await res.json()) as { preferences: GuidePreferences };
    },
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<GuidePreferences>) => {
      const res = await fetch('/api/guide/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      return (await res.json()) as { success: boolean; preferences: GuidePreferences };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.preferences() });
      setIsSaving(false);
    },
  });

  // Reset preferences mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/guide/preferences/reset', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to reset preferences');
      return (await res.json()) as { success: boolean; preferences: GuidePreferences };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.preferences() });
    },
  });

  const preferences = preferencesData?.preferences;

  const handleToggle = (key: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleUpdatePreferences = (updates: Partial<GuidePreferences>) => {
    setIsSaving(true);
    updateMutation.mutate(updates);
  };

  const handleToggleDay = (day: number) => {
    if (!preferences) return;
    const current = preferences.preferred_days_of_week || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    handleUpdatePreferences({ preferred_days_of_week: updated });
  };

  const handleToggleTimeSlot = (slot: 'morning' | 'afternoon' | 'evening') => {
    if (!preferences) return;
    const current = preferences.preferred_time_slots || {};
    handleUpdatePreferences({
      preferred_time_slots: {
        ...current,
        [slot]: !current[slot],
      },
    });
  };

  const handleToggleNotification = (channel: 'push' | 'email' | 'sms') => {
    if (!preferences) return;
    const current = preferences.notification_preferences || {};
    handleUpdatePreferences({
      notification_preferences: {
        ...current,
        [channel]: !current[channel],
      },
    });
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-600">Kelola preferensi aplikasi</p>
      </div>

      {/* Basic Settings */}
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

      {/* Preferences Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">
              Preferensi Kerja & Notifikasi
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              {showPreferences ? 'Sembunyikan' : 'Tampilkan'}
            </Button>
          </div>
        </CardHeader>
        {showPreferences && (
          <CardContent className="space-y-6">
            {preferencesLoading ? (
              <LoadingState variant="skeleton" lines={4} />
            ) : preferencesError || !preferences ? (
              <ErrorState
                message={preferencesError instanceof Error ? preferencesError.message : 'Gagal memuat preferences'}
                onRetry={() => void preferencesRefetch()}
                variant="card"
              />
            ) : (
              <>
                {/* Preferred Days */}
                <div>
                  <Label className="mb-3 block text-sm font-medium">Hari yang Disukai</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = preferences.preferred_days_of_week?.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleToggleDay(day.value)}
                          className={cn(
                            'rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all',
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                          )}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <Label className="mb-3 block text-sm font-medium">Waktu yang Disukai</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="morning" className="cursor-pointer">
                        Pagi (06:00 - 12:00)
                      </Label>
                      <Switch
                        id="morning"
                        checked={preferences.preferred_time_slots?.morning || false}
                        onCheckedChange={() => handleToggleTimeSlot('morning')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="afternoon" className="cursor-pointer">
                        Siang (12:00 - 18:00)
                      </Label>
                      <Switch
                        id="afternoon"
                        checked={preferences.preferred_time_slots?.afternoon || false}
                        onCheckedChange={() => handleToggleTimeSlot('afternoon')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="evening" className="cursor-pointer">
                        Malam (18:00 - 24:00)
                      </Label>
                      <Switch
                        id="evening"
                        checked={preferences.preferred_time_slots?.evening || false}
                        onCheckedChange={() => handleToggleTimeSlot('evening')}
                      />
                    </div>
                  </div>
                </div>

                {/* Max Trips */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Max Trip per Hari</Label>
                    <select
                      value={preferences.max_trips_per_day || 1}
                      onChange={(e) => handleUpdatePreferences({ max_trips_per_day: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Max Trip per Minggu</Label>
                    <select
                      value={preferences.max_trips_per_week || 5}
                      onChange={(e) => handleUpdatePreferences({ max_trips_per_week: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {[5, 7, 10, 14, 20].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="border-t border-slate-200 pt-4">
                  <Label className="mb-3 block text-sm font-medium">Preferensi Notifikasi</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pref-push" className="cursor-pointer">
                        Push Notifications
                      </Label>
                      <Switch
                        id="pref-push"
                        checked={preferences.notification_preferences?.push || false}
                        onCheckedChange={() => handleToggleNotification('push')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pref-email" className="cursor-pointer">
                        Email Notifications
                      </Label>
                      <Switch
                        id="pref-email"
                        checked={preferences.notification_preferences?.email || false}
                        onCheckedChange={() => handleToggleNotification('email')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pref-sms" className="cursor-pointer">
                        SMS Notifications
                      </Label>
                      <Switch
                        id="pref-sms"
                        checked={preferences.notification_preferences?.sms || false}
                        onCheckedChange={() => handleToggleNotification('sms')}
                      />
                    </div>
                  </div>
                </div>

                {/* Display Preferences */}
                <div className="border-t border-slate-200 pt-4">
                  <Label className="mb-2 block text-sm font-medium">Theme</Label>
                  <div className="flex gap-2">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Globe },
                    ].map((theme) => {
                      const Icon = theme.icon;
                      const isSelected = preferences.theme_preference === theme.value;
                      return (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() => handleUpdatePreferences({ theme_preference: theme.value })}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-all',
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div id="language-settings" className="mt-4 scroll-mt-4">
                    <Label className="mb-2 block text-sm font-medium">Bahasa</Label>
                    <select
                      value={preferences.preferred_language || 'id'}
                      onChange={(e) => handleUpdatePreferences({ preferred_language: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                {/* Save Indicator & Reset */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  {isSaving && <p className="text-sm text-slate-500">Menyimpan...</p>}
                  <Button
                    variant="outline"
                    onClick={() => resetMutation.mutate()}
                    disabled={resetMutation.isPending}
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset ke Default
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </>
  );
}
