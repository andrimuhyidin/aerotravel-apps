/**
 * Public Trip Info Page (for QR Code scan)
 * Route: /[locale]/trip/[tripId]
 */

import { Calendar, Clock, MapPin, Phone, Users } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { QRCode } from '@/components/qr-code/qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ locale: string; tripId: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tripId } = await params;
  return { title: `Info Trip - ${tripId}` };
}

export default async function PublicTripInfoPage({ params }: PageProps) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const client = supabase as unknown as any;

  // Get trip info (public, no auth required)
  const { data: trip, error } = await client
    .from('trips')
    .select(
      `
      id,
      trip_code,
      trip_date,
      departure_time,
      return_time,
      total_pax,
      documentation_url,
      package:packages(name, destination),
      guide:trip_guides(
        guide:users(full_name, phone)
      )
    `
    )
    .eq('id', tripId)
    .single();

  if (error || !trip) {
    return (
      <Container className="py-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">Trip tidak ditemukan atau tidak tersedia.</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const tripCode = (trip.trip_code as string) ?? '';
  const tripDate = (trip.trip_date as string) ?? '';
  const departureTime = (trip.departure_time as string | null) ?? null;
  const returnTime = (trip.return_time as string | null) ?? null;
  const totalPax = (trip.total_pax as number | null) ?? 0;
  const packageInfo = trip.package as { name: string | null; destination: string | null } | null;
  const packageName = packageInfo?.name ?? tripCode;
  const destination = packageInfo?.destination ?? '';

  const guides = (trip.guide as Array<{
    guide: { full_name: string | null; phone: string | null } | null;
  }> | null) ?? [];
  const leadGuide = guides[0]?.guide;

  const dateLabel = new Date(tripDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Default meeting point (can be made dynamic per branch/package)
  const meetingPoint = 'Dermaga Ketapang';

  return (
    <Container className="py-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{packageName}</h1>
        <p className="mt-1 text-sm text-slate-500">{tripCode}</p>
      </div>

      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informasi Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium">{dateLabel}</p>
              </div>
            </div>

            {departureTime && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium">Jam Kumpul: {departureTime.slice(0, 5)} WIB</p>
                  {returnTime && (
                    <p className="text-xs text-slate-500">
                      Estimasi kembali: {returnTime.slice(0, 5)} WIB
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium">{meetingPoint}</p>
                <p className="text-xs text-slate-500">Titik kumpul & keberangkatan</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium">{totalPax} peserta</p>
              </div>
            </div>

            {destination && (
              <div>
                <p className="text-xs text-slate-500">Destinasi</p>
                <p className="font-medium">{destination}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {leadGuide && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kontak Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {leadGuide.full_name && (
                <div>
                  <p className="text-xs text-slate-500">Nama</p>
                  <p className="font-medium">{leadGuide.full_name}</p>
                </div>
              )}
              {leadGuide.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <a
                    href={`https://wa.me/${leadGuide.phone.replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    {leadGuide.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {trip.documentation_url && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Album Foto Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={trip.documentation_url as string}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                Lihat Album Foto →
              </a>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 bg-slate-50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">QR Code Info Trip</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3 p-4">
            <QRCode
              value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id'}/${locale}/trip/${tripId}`}
              size={200}
              level="M"
            />
            <p className="text-center text-xs text-slate-600">
              Scan QR code ini untuk melihat info trip kapan saja
            </p>
            <p className="text-center text-xs text-slate-500">
              Pastikan Anda datang tepat waktu di titik kumpul
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
