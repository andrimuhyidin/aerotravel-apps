'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type PreferencesClientProps = {
  locale: string;
};

type GuidePreferences = {
  favorite_destinations: string[];
  preferred_trip_types: ('open_trip' | 'private_trip' | 'corporate' | 'kol_trip')[];
  preferred_durations: ('1D' | '2D' | '3D' | '4D+')[];
};

const COMMON_DESTINATIONS = [
  'Pulau Pahawang',
  'Teluk Kiluan',
  'Labuan Bajo',
  'Raja Ampat',
  'Karimunjawa',
  'Tanjung Lesung',
  'Pulau Seribu',
  'Bali',
  'Lombok',
  'Nusa Penida',
];

const TRIP_TYPES: Array<{ value: 'open_trip' | 'private_trip' | 'corporate' | 'kol_trip'; label: string }> = [
  { value: 'open_trip', label: 'Open Trip' },
  { value: 'private_trip', label: 'Private Trip' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'kol_trip', label: 'KOL Trip' },
];

const DURATIONS: Array<{ value: '1D' | '2D' | '3D' | '4D+'; label: string }> = [
  { value: '1D', label: '1 Hari' },
  { value: '2D', label: '2 Hari 1 Malam' },
  { value: '3D', label: '3 Hari 2 Malam' },
  { value: '4D+', label: '4+ Hari' },
];

export function PreferencesClient({ locale: _locale }: PreferencesClientProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<GuidePreferences>({
    queryKey: ['guide', 'preferences'],
    queryFn: async () => {
      const res = await fetch('/api/guide/preferences');
      if (!res.ok) {
        throw new Error('Gagal memuat preferensi');
      }
      return (await res.json()) as GuidePreferences;
    },
  });

  const [preferences, setPreferences] = useState<GuidePreferences>({
    favorite_destinations: [],
    preferred_trip_types: [],
    preferred_durations: [],
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Sync state when data loads
  if (data && !hasChanges && preferences.favorite_destinations.length === 0) {
    setPreferences(data);
  }

  const mutation = useMutation({
    mutationFn: async (prefs: GuidePreferences) => {
      const res = await fetch('/api/guide/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        throw new Error('Gagal menyimpan preferensi');
      }
      return (await res.json()) as GuidePreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide', 'preferences'] });
      setHasChanges(false);
      logger.info('Guide preferences saved');
    },
  });

  const toggleDestination = (dest: string) => {
    const newDests = preferences.favorite_destinations.includes(dest)
      ? preferences.favorite_destinations.filter((d) => d !== dest)
      : [...preferences.favorite_destinations, dest];
    setPreferences({ ...preferences, favorite_destinations: newDests });
    setHasChanges(true);
  };

  const toggleTripType = (type: GuidePreferences['preferred_trip_types'][number]) => {
    const newTypes = preferences.preferred_trip_types.includes(type)
      ? preferences.preferred_trip_types.filter((t) => t !== type)
      : [...preferences.preferred_trip_types, type];
    setPreferences({ ...preferences, preferred_trip_types: newTypes });
    setHasChanges(true);
  };

  const toggleDuration = (duration: GuidePreferences['preferred_durations'][number]) => {
    const newDurations = preferences.preferred_durations.includes(duration)
      ? preferences.preferred_durations.filter((d) => d !== duration)
      : [...preferences.preferred_durations, duration];
    setPreferences({ ...preferences, preferred_durations: newDurations });
    setHasChanges(true);
  };

  const handleSave = () => {
    mutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">Memuat preferensi...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Favorite Destinations */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Destinasi Favorit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-slate-600">
            Pilih destinasi yang ingin Anda sering ditugaskan
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_DESTINATIONS.map((dest) => {
              const isSelected = preferences.favorite_destinations.includes(dest);
              return (
                <button
                  key={dest}
                  type="button"
                  onClick={() => toggleDestination(dest)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {dest}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trip Types */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Jenis Trip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-slate-600">Pilih jenis trip yang Anda sukai</p>
          <div className="space-y-2">
            {TRIP_TYPES.map((type) => {
              const isSelected = preferences.preferred_trip_types.includes(type.value);
              return (
                <label
                  key={type.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTripType(type.value)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Durations */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Durasi Trip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-slate-600">Pilih durasi trip yang Anda prefer</p>
          <div className="space-y-2">
            {DURATIONS.map((duration) => {
              const isSelected = preferences.preferred_durations.includes(duration.value);
              return (
                <label
                  key={duration.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDuration(duration.value)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm">{duration.label}</span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={mutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Simpan Preferensi
          </Button>
        </div>
      )}

      {mutation.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">
              {(mutation.error as Error).message || 'Gagal menyimpan preferensi'}
            </p>
          </CardContent>
        </Card>
      )}

      {mutation.isSuccess && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-700">Preferensi berhasil disimpan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
