/**
 * My Trips Page
 * Route: /[locale]/my-trips
 */

import { Calendar, MapPin, Plane } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'My Trips - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/my-trips`,
    },
  };
}

export default async function MyTripsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Placeholder trips data
  const upcomingTrips: {
    id: string;
    name: string;
    date: string;
    status: string;
  }[] = [];
  const pastTrips: { id: string; name: string; date: string }[] = [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pb-4 pt-6">
        <h1 className="text-xl font-bold">Perjalanan Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kelola semua booking dan trip Anda
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 px-5 pb-4">
        <button className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25">
          Akan Datang
        </button>
        <button className="flex-1 rounded-xl bg-muted/60 py-2.5 text-sm font-medium text-muted-foreground">
          Selesai
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5">
        {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
              <Plane className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">Belum Ada Trip</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Mulai petualangan Anda dengan booking paket wisata pertama
            </p>
            <Link href={`/${locale}/packages`}>
              <Button className="h-12 gap-2 rounded-xl px-6 shadow-lg shadow-primary/25">
                <MapPin className="h-4 w-4" />
                Jelajahi Paket
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingTrips.map((trip) => (
              <div key={trip.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    🏝️
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{trip.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {trip.date}
                    </div>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                    {trip.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
