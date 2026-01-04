/**
 * KOL Trips List Client Component
 * Displays grid of available KOL trips with filters
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Calendar,
  ChevronRight,
  Instagram,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Users,
  Youtube,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/utils/logger';

type KolTrip = {
  id: string;
  slug: string;
  kol: {
    name: string;
    handle: string | null;
    platform: string | null;
    photoUrl: string | null;
    bio: string | null;
  };
  tripDate: string;
  maxParticipants: number;
  currentParticipants: number;
  spotsAvailable: number;
  pricing: {
    basePrice: number;
    kolFee: number;
    finalPrice: number;
  };
  heroImageUrl: string | null;
  package: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    province: string;
    duration: string;
    thumbnailUrl: string | null;
  } | null;
};

type KolTripsListClientProps = {
  locale: string;
};

function getPlatformIcon(platform: string | null) {
  switch (platform?.toLowerCase()) {
    case 'instagram':
      return <Instagram className="h-4 w-4" />;
    case 'youtube':
      return <Youtube className="h-4 w-4" />;
    case 'tiktok':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      );
    default:
      return <Sparkles className="h-4 w-4" />;
  }
}

export function KolTripsListClient({ locale }: KolTripsListClientProps) {
  const [trips, setTrips] = useState<KolTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  useEffect(() => {
    fetchTrips();
  }, [platformFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (platformFilter && platformFilter !== 'all') {
        params.append('platform', platformFilter);
      }

      const res = await fetch(`/api/public/kol?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setTrips(data.trips);
    } catch (error) {
      logger.error('Failed to fetch KOL trips', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search query
  const filteredTrips = trips.filter((trip) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      trip.kol.name.toLowerCase().includes(query) ||
      trip.kol.handle?.toLowerCase().includes(query) ||
      trip.package?.destination.toLowerCase().includes(query) ||
      trip.package?.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari KOL atau destinasi..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Platform</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTrips.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">Belum Ada Trip Tersedia</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Trip KOL baru akan segera hadir. Stay tuned!
          </p>
          <Link href={`/${locale}/packages`}>
            <Button variant="outline" className="mt-4">
              Lihat Paket Regular
            </Button>
          </Link>
        </div>
      )}

      {/* Trips Grid */}
      {!loading && filteredTrips.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip) => (
            <Link key={trip.id} href={`/${locale}/kol/${trip.slug}`}>
              <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
                {/* Hero Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-violet-100 to-purple-100">
                  {(trip.heroImageUrl || trip.package?.thumbnailUrl) ? (
                    <Image
                      src={trip.heroImageUrl || trip.package?.thumbnailUrl || ''}
                      alt={trip.kol.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Sparkles className="h-12 w-12 text-violet-300" />
                    </div>
                  )}

                  {/* Spots Badge */}
                  {trip.spotsAvailable <= 5 && trip.spotsAvailable > 0 && (
                    <Badge className="absolute right-2 top-2 bg-orange-500 text-white">
                      Sisa {trip.spotsAvailable} spot!
                    </Badge>
                  )}
                  {trip.spotsAvailable <= 0 && (
                    <Badge className="absolute right-2 top-2 bg-red-500 text-white">
                      Sold Out
                    </Badge>
                  )}

                  {/* KOL Avatar */}
                  <div className="absolute -bottom-6 left-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                      {trip.kol.photoUrl ? (
                        <Image
                          src={trip.kol.photoUrl}
                          alt={trip.kol.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
                          {trip.kol.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="pt-8">
                  {/* KOL Info */}
                  <div className="mb-3">
                    <h3 className="font-bold">{trip.kol.name}</h3>
                    {trip.kol.handle && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getPlatformIcon(trip.kol.platform)}
                        <span>{trip.kol.handle}</span>
                      </div>
                    )}
                  </div>

                  {/* Package Info */}
                  {trip.package && (
                    <div className="mb-3 space-y-1">
                      <p className="text-sm font-medium text-foreground/80">{trip.package.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {trip.package.destination}
                        </span>
                        <span>{trip.package.duration}</span>
                      </div>
                    </div>
                  )}

                  {/* Date & Participants */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(trip.tripDate), 'dd MMM yyyy', { locale: localeId })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {trip.currentParticipants}/{trip.maxParticipants} peserta
                    </span>
                  </div>

                  {/* Price & CTA */}
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Mulai dari</p>
                      <p className="text-lg font-bold text-primary">
                        Rp {trip.pricing.finalPrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1"
                      disabled={trip.spotsAvailable <= 0}
                    >
                      {trip.spotsAvailable > 0 ? 'Lihat Detail' : 'Sold Out'}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

