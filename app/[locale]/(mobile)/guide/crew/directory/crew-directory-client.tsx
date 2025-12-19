'use client';

/**
 * Crew Directory Client Component
 * Search and filter crew members, view availability, contact actions
 */

import { useQuery } from '@tanstack/react-query';
import { Map, MapPin, Phone, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import queryKeys from '@/lib/queries/query-keys';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type CrewMember = {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  badges: Array<{ name: string; level?: string }> | null;
  skills: Array<{ name: string; level?: number }> | null;
  current_availability: 'available' | 'on_duty' | 'on_trip' | 'not_available' | 'unknown';
  last_status_update: string | null;
  contact_enabled: boolean;
  branch?: {
    id: string;
    code: string;
    name: string;
  } | null;
  trip_role?: 'lead' | 'support';
  trip_info?: {
    trip_code: string;
    trip_date: string;
  };
};

type CrewDirectoryResponse = {
  myCrew: CrewMember[];
  directory: CrewMember[];
  total: number;
  limit: number;
  offset: number;
};

type CrewDirectoryClientProps = {
  locale: string;
};

const availabilityLabels: Record<string, string> = {
  available: 'Tersedia',
  on_duty: 'On Duty',
  on_trip: 'Sedang Trip',
  not_available: 'Tidak Tersedia',
  unknown: 'Unknown',
};

const availabilityColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  on_duty: 'bg-blue-100 text-blue-700',
  on_trip: 'bg-amber-100 text-amber-700',
  not_available: 'bg-slate-100 text-slate-600',
  unknown: 'bg-slate-100 text-slate-500',
};

export function CrewDirectoryClient({ locale }: CrewDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { data, isLoading, error, refetch } = useQuery<CrewDirectoryResponse>({
    queryKey: queryKeys.guide.team.directory.search({
      search: searchQuery || undefined,
      availability: availabilityFilter !== 'all' ? availabilityFilter : undefined,
      skill: skillFilter || undefined,
    }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (availabilityFilter !== 'all') params.append('availability', availabilityFilter);
      if (skillFilter) params.append('skill', skillFilter);

      const res = await fetch(`/api/guide/crew/directory?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Gagal memuat crew directory');
      }
      return (await res.json()) as CrewDirectoryResponse;
    },
  });

  // Get user location for nearby crew
  useEffect(() => {
    if (showMap && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('GPS capture failed', error);
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, [showMap]);

  // Fetch nearby crew if location available
  const { data: nearbyData } = useQuery<{
    nearby: Array<{
      user_id: string;
      display_name: string;
      distance: number;
      location: { latitude: number; longitude: number };
    }>;
  }>({
    queryKey: queryKeys.guide.team.directory.nearby(userLocation?.latitude, userLocation?.longitude),
    queryFn: async () => {
      if (!userLocation) return { nearby: [] };
      const res = await fetch(
        `/api/guide/crew/directory/nearby?lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=10000`,
      );
      if (!res.ok) {
        throw new Error('Failed to fetch nearby crew');
      }
      return res.json();
    },
    enabled: showMap && !!userLocation,
  });

  const handleContact = async (guideId: string) => {
    try {
      const res = await fetch(`/api/guide/crew/contact/${guideId}`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Gagal mendapatkan kontak');
      }
      const data = (await res.json()) as {
        actions: { call?: string | null; whatsapp?: string | null };
      };

      // Show contact options
      if (data.actions.whatsapp) {
        window.open(data.actions.whatsapp, '_blank');
      } else if (data.actions.call) {
        window.location.href = data.actions.call;
      }
    } catch (error) {
      console.error('Contact error', error);
      alert('Gagal menghubungi guide');
    }
  };

  const handleSOSNotifyNearby = async () => {
    if (!userLocation || !nearbyData?.nearby || nearbyData.nearby.length === 0) {
      alert('Tidak ada crew terdekat untuk diberitahu');
      return;
    }

    try {
      // Trigger SOS and notify nearby crew
      const res = await fetch('/api/guide/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          notify_nearby_crew: true,
        }),
      });

      if (res.ok) {
        alert(`SOS dikirim. ${nearbyData.nearby.length} crew terdekat telah diberitahu.`);
      }
    } catch (error) {
      console.error('SOS error', error);
      alert('Gagal mengirim SOS');
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <LoadingState variant="spinner" message="Memuat crew directory..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <ErrorState
            message={error instanceof Error ? error.message : 'Gagal memuat directory'}
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const myCrew = data?.myCrew ?? [];
  const directory = data?.directory ?? [];

  return (
    <div className="space-y-4">
      {/* Map Toggle & SOS */}
      <div className="flex gap-2">
        <Button
          variant={showMap ? 'default' : 'outline'}
          onClick={() => setShowMap(!showMap)}
          className="flex-1"
        >
          <Map className="mr-2 h-4 w-4" />
          {showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
        </Button>
        {showMap && userLocation && nearbyData && nearbyData.nearby.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleSOSNotifyNearby}
            className="bg-red-600 hover:bg-red-700"
          >
            SOS & Notify Nearby
          </Button>
        )}
      </div>

      {/* Map Display */}
      {showMap && userLocation && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="h-64 w-full rounded-lg bg-slate-100 relative overflow-hidden">
              {/* Map would be rendered here - using DynamicMap component */}
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Map akan ditampilkan di sini</p>
                  <p className="text-xs mt-1">
                    Lokasi Anda: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </p>
                  {nearbyData && nearbyData.nearby.length > 0 && (
                    <p className="text-xs mt-2 text-emerald-600">
                      {nearbyData.nearby.length} crew dalam radius 10km
                    </p>
                  )}
                </div>
              </div>
            </div>
            {nearbyData && nearbyData.nearby.length > 0 && (
              <div className="p-4 space-y-2 border-t">
                <p className="text-sm font-semibold">Crew Terdekat:</p>
                <div className="space-y-1">
                  {nearbyData.nearby.slice(0, 5).map((crew) => (
                    <div key={crew.user_id} className="flex items-center justify-between text-xs">
                      <span>{crew.display_name}</span>
                      <span className="text-slate-500">{crew.distance}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama guide..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="available">Tersedia</SelectItem>
                <SelectItem value="on_duty">On Duty</SelectItem>
                <SelectItem value="on_trip">Sedang Trip</SelectItem>
                <SelectItem value="not_available">Tidak Tersedia</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter skill..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* My Trip Crew */}
      {myCrew.length > 0 && (
        <div>
          <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
            My Trip Crew
          </h2>
          <div className="space-y-2">
            {myCrew.map((member) => (
              <CrewMemberCard
                key={member.user_id}
                member={member}
                onContact={handleContact}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Directory */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            All Directory
          </h2>
          <span className="text-xs text-slate-500">{directory.length} guide</span>
        </div>
        {directory.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <EmptyState
                icon={Users}
                title="Tidak ada guide ditemukan"
                description={
                  searchQuery || availabilityFilter !== 'all' || skillFilter
                    ? 'Coba ubah filter pencarian'
                    : 'Belum ada guide terdaftar'
                }
                variant="subtle"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {directory.map((member) => (
              <CrewMemberCard
                key={member.user_id}
                member={member}
                onContact={handleContact}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CrewMemberCard({
  member,
  onContact,
  locale,
}: {
  member: CrewMember;
  onContact: (guideId: string) => void;
  locale: string;
}) {
  const params = useParams();
  const localeParam = (params?.locale as string) || locale;
  const availability = member.current_availability || 'unknown';
  const availabilityLabel = availabilityLabels[availability] || availability;
  const availabilityColor = availabilityColors[availability] || availabilityColors.unknown;

  return (
    <Card className="border-0 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Link href={`/${localeParam}/guide/crew/${member.user_id}`} className="relative flex-shrink-0">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.display_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Users className="h-6 w-6" />
              </div>
            )}
            <div
              className={cn(
                'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white',
                availability === 'available' && 'bg-emerald-500',
                availability === 'on_duty' && 'bg-blue-500',
                availability === 'on_trip' && 'bg-amber-500',
                availability === 'not_available' && 'bg-slate-400',
                availability === 'unknown' && 'bg-slate-300',
              )}
              title={availabilityLabel}
            />
          </Link>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${localeParam}/guide/crew/${member.user_id}`}
                  className="font-semibold text-slate-900 hover:text-emerald-600"
                >
                  {member.display_name}
                </Link>
                {member.branch && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {member.branch.name} ({member.branch.code})
                  </p>
                )}
                {member.trip_info && (
                  <p className="mt-1 text-xs text-slate-600">
                    Trip: {member.trip_info.trip_code} ({member.trip_role === 'lead' ? 'Lead' : 'Support'})
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-medium',
                  availabilityColor,
                )}
              >
                {availabilityLabel}
              </span>
            </div>

            {/* Badges & Skills */}
            {(member.badges && member.badges.length > 0) ||
            (member.skills && member.skills.length > 0) ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {member.badges?.slice(0, 3).map((badge, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                  >
                    {badge.name}
                  </span>
                ))}
                {member.skills?.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                  >
                    {skill.name}
                    {skill.level && ` Lv.${skill.level}`}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Contact Action */}
            {member.contact_enabled && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => onContact(member.user_id)}
                >
                  <Phone className="mr-1.5 h-3.5 w-3.5" />
                  Hubungi
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
