/**
 * My Trips Client Component
 * Displays user's trip history with tabs
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Calendar,
  ChevronRight,
  MapPin,
  Plane,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/utils/logger';

type Trip = {
  id: string;
  code: string;
  tripDate: string;
  totalPax: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  package: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    duration: string;
  } | null;
};

type MyTripsClientProps = {
  locale: string;
};

export function MyTripsClient({ locale }: MyTripsClientProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const [upcomingRes, completedRes] = await Promise.all([
        fetch('/api/user/bookings?status=upcoming&limit=20'),
        fetch('/api/user/bookings?status=completed&limit=20'),
      ]);

      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingTrips(data.bookings || []);
      }

      if (completedRes.ok) {
        const data = await completedRes.json();
        setCompletedTrips(data.bookings || []);
      }
    } catch (error) {
      logger.error('Failed to fetch trips', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Lunas</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Terkonfirmasi</Badge>;
      case 'pending':
        return <Badge variant="secondary">Menunggu Pembayaran</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderTripCard = (trip: Trip) => (
    <Link key={trip.id} href={`/${locale}/my-trips/${trip.id}`}>
      <Card className="mb-3 overflow-hidden hover:shadow-md transition-all active:scale-[0.99]">
        <CardContent className="p-0">
          <div className="flex">
            {/* Thumbnail */}
            <div className="h-28 w-28 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
              <span className="text-4xl">🏝️</span>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">
                    {trip.package?.name || 'Paket Wisata'}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{trip.package?.destination || '-'}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  {trip.package?.duration || '-'}
                </Badge>
                {getStatusBadge(trip.status)}
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span className="font-medium">
                    {format(new Date(trip.tripDate), 'd MMM yyyy', { locale: localeId })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {trip.totalPax} orang
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderEmptyState = (type: 'upcoming' | 'completed') => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
        <Plane className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h2 className="mb-2 text-lg font-semibold">
        {type === 'upcoming' ? 'Belum Ada Trip Mendatang' : 'Belum Ada Trip Selesai'}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground max-w-[250px]">
        {type === 'upcoming'
          ? 'Mulai petualangan Anda dengan booking paket wisata pertama'
          : 'Trip yang sudah selesai akan muncul di sini'}
      </p>
      {type === 'upcoming' && (
        <Link href={`/${locale}/packages`}>
          <Button className="h-12 gap-2 rounded-xl px-6 shadow-lg shadow-primary/25">
            <MapPin className="h-4 w-4" />
            Jelajahi Paket
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="px-4 pb-4 pt-2">
        <h1 className="text-xl font-bold">Perjalanan Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kelola semua booking dan trip Anda
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 flex-1">
        <Tabs
          defaultValue="upcoming"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'upcoming' | 'completed')}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Akan Datang
              {upcomingTrips.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {upcomingTrips.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Plane className="h-4 w-4" />
              Selesai
              {completedTrips.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {completedTrips.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="mt-0">
                {upcomingTrips.length === 0 ? (
                  renderEmptyState('upcoming')
                ) : (
                  <div>
                    {upcomingTrips.map(renderTripCard)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0">
                {completedTrips.length === 0 ? (
                  renderEmptyState('completed')
                ) : (
                  <div>
                    {completedTrips.map(renderTripCard)}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

