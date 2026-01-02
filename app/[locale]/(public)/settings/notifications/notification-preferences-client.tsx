/**
 * Notification Preferences Client Component
 * Manage notification channels and frequency
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Loader2,
  Mail,
  MessageSquare,
  Save,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import queryKeys from '@/lib/queries/query-keys';

type NotificationPreferences = {
  channels: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  frequency: 'immediate' | 'digest' | 'weekly';
  categories: {
    bookings: boolean;
    promotions: boolean;
    reminders: boolean;
    updates: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
};

const DEFAULT_PREFS: NotificationPreferences = {
  channels: {
    email: true,
    whatsapp: true,
    push: true,
  },
  frequency: 'immediate',
  categories: {
    bookings: true,
    promotions: true,
    reminders: true,
    updates: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
};

export function NotificationPreferencesClient() {
  const params = useParams();
  const locale = params.locale as string;
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ preferences: NotificationPreferences }>({
    queryKey: [...queryKeys.user.all, 'notifications', 'preferences'],
    queryFn: async () => {
      const res = await fetch('/api/user/notifications/preferences');
      if (!res.ok) throw new Error('Failed to fetch preferences');
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.preferences) {
      setPrefs(data.preferences);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      const res = await fetch('/api/user/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Preferensi notifikasi berhasil disimpan');
      setHasChanges(false);
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.user.all, 'notifications', 'preferences'],
      });
    },
    onError: () => {
      toast.error('Gagal menyimpan preferensi');
    },
  });

  const updatePrefs = (update: Partial<NotificationPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...update }));
    setHasChanges(true);
  };

  const updateChannel = (channel: keyof NotificationPreferences['channels'], value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      channels: { ...prev.channels, [channel]: value },
    }));
    setHasChanges(true);
  };

  const updateCategory = (category: keyof NotificationPreferences['categories'], value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      categories: { ...prev.categories, [category]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(prefs);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-6">
      {/* Header */}
      <div className="px-4 pb-4 pt-2 flex items-center gap-3 border-b">
        <Link
          href={`/${locale}/settings`}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Pengaturan Notifikasi</h1>
          <p className="text-xs text-muted-foreground">Kelola preferensi notifikasi</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Notification Channels */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Saluran Notifikasi
            </CardTitle>
            <CardDescription>Pilih bagaimana Anda ingin menerima notifikasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-muted-foreground">Notifikasi ke email</p>
                </div>
              </div>
              <Switch
                checked={prefs.channels.email}
                onCheckedChange={(v) => updateChannel('email', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Pesan langsung ke WA</p>
                </div>
              </div>
              <Switch
                checked={prefs.channels.whatsapp}
                onCheckedChange={(v) => updateChannel('whatsapp', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Push Notification</p>
                  <p className="text-xs text-muted-foreground">Notifikasi di perangkat</p>
                </div>
              </div>
              <Switch
                checked={prefs.channels.push}
                onCheckedChange={(v) => updateChannel('push', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Frekuensi</CardTitle>
            <CardDescription>Seberapa sering Anda ingin menerima notifikasi</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={prefs.frequency}
              onValueChange={(v: NotificationPreferences['frequency']) =>
                updatePrefs({ frequency: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Langsung (Real-time)</SelectItem>
                <SelectItem value="digest">Ringkasan Harian</SelectItem>
                <SelectItem value="weekly">Ringkasan Mingguan</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kategori Notifikasi</CardTitle>
            <CardDescription>Pilih jenis notifikasi yang ingin Anda terima</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="cat-bookings" className="text-sm cursor-pointer">
                <span className="font-medium">Booking & Trip</span>
                <p className="text-xs text-muted-foreground">
                  Konfirmasi, pengingat, dan update trip
                </p>
              </Label>
              <Switch
                id="cat-bookings"
                checked={prefs.categories.bookings}
                onCheckedChange={(v) => updateCategory('bookings', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cat-reminders" className="text-sm cursor-pointer">
                <span className="font-medium">Pengingat</span>
                <p className="text-xs text-muted-foreground">Pengingat pembayaran dan deadline</p>
              </Label>
              <Switch
                id="cat-reminders"
                checked={prefs.categories.reminders}
                onCheckedChange={(v) => updateCategory('reminders', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cat-promotions" className="text-sm cursor-pointer">
                <span className="font-medium">Promo & Penawaran</span>
                <p className="text-xs text-muted-foreground">Diskon dan penawaran khusus</p>
              </Label>
              <Switch
                id="cat-promotions"
                checked={prefs.categories.promotions}
                onCheckedChange={(v) => updateCategory('promotions', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cat-updates" className="text-sm cursor-pointer">
                <span className="font-medium">Update Sistem</span>
                <p className="text-xs text-muted-foreground">Fitur baru dan pengumuman</p>
              </Label>
              <Switch
                id="cat-updates"
                checked={prefs.categories.updates}
                onCheckedChange={(v) => updateCategory('updates', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BellOff className="h-4 w-4" />
              Jam Tenang
            </CardTitle>
            <CardDescription>
              Jeda notifikasi pada waktu tertentu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Aktifkan Jam Tenang</Label>
              <Switch
                checked={prefs.quietHours.enabled}
                onCheckedChange={(v) =>
                  updatePrefs({ quietHours: { ...prefs.quietHours, enabled: v } })
                }
              />
            </div>

            {prefs.quietHours.enabled && (
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Mulai</Label>
                  <input
                    type="time"
                    value={prefs.quietHours.start}
                    onChange={(e) =>
                      updatePrefs({
                        quietHours: { ...prefs.quietHours, start: e.target.value },
                      })
                    }
                    className="w-full h-10 px-3 border rounded-md text-sm"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Selesai</Label>
                  <input
                    type="time"
                    value={prefs.quietHours.end}
                    onChange={(e) =>
                      updatePrefs({
                        quietHours: { ...prefs.quietHours, end: e.target.value },
                      })
                    }
                    className="w-full h-10 px-3 border rounded-md text-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button (Mobile) */}
        {hasChanges && (
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

