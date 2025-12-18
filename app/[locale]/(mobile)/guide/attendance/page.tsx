/**
 * Attendance Page
 * Route: /[locale]/guide/attendance
 * 
 * GPS Geofencing Check-in/Check-out untuk Guide
 * PRD 4.1.C - GPS Attendance & Auto-Penalty
 */

import { MapPin } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

import { AttendanceClient } from './attendance-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  return {
    title: 'Absensi - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/attendance`,
    },
  };
}

export default async function GuideAttendancePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get trips for today and upcoming
  const today = new Date().toISOString().slice(0, 10);
  const { data: assignments, error: assignmentsError } = await supabase
    .from('trip_guides')
    .select(`
      trip_id,
      trip:trips(
        id,
        trip_code,
        trip_date,
        departure_time,
        status
      )
    `)
    .eq('guide_id', user.id);

  // Filter trips that are today or upcoming
  const trips = (assignments ?? [])
    .map((a) => a.trip)
    .filter((t): t is NonNullable<typeof t> => {
      if (!t || !t.trip_date) return false;
      return t.trip_date >= today;
    })
    .sort((a, b) => {
      if (a.trip_date !== b.trip_date) {
        return a.trip_date.localeCompare(b.trip_date);
      }
      return (a.departure_time || '').localeCompare(b.departure_time || '');
    })
    .slice(0, 10);

  if (trips.length === 0) {
    return (
      <Container className="py-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <MapPin className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Tidak Ada Trip</h1>
          <p className="mt-2 text-slate-600">
            Anda belum memiliki penugasan trip.
          </p>
        </div>
      </Container>
    );
  }

  // Default meeting point - bisa di-mapping per branch/cabang nanti
  const meetingPoint = {
    id: 'default',
    name: 'Dermaga Ketapang',
    coordinates: {
      latitude: -5.4294,
      longitude: 105.2620,
    },
    radiusMeters: 50,
  } as const;

  // Use first trip as default
  const selectedTrip = trips[0];
  
  if (!selectedTrip) {
    return (
      <Container className="py-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <MapPin className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Tidak Ada Trip</h1>
          <p className="mt-2 text-slate-600">
            Anda belum memiliki penugasan trip hari ini.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Absensi GPS</h1>
        {trips.length > 1 && (
          <p className="mt-1 text-sm text-slate-600">{trips.length} trip hari ini</p>
        )}
      </div>

      <AttendanceClient
        tripId={selectedTrip.id}
        guideId={user.id}
        tripStartTime={selectedTrip.departure_time 
          ? `${selectedTrip.trip_date}T${selectedTrip.departure_time}`
          : `${selectedTrip.trip_date}T07:30:00`}
        meetingPoint={meetingPoint}
        trips={trips.length > 1 ? trips : undefined}
      />
    </Container>
  );
}
