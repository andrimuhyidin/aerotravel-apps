'use client';

import { ArrowLeft, Camera, CheckCircle2, ClipboardList, Image as ImageIcon, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TripManifest, getTripManifest } from '@/lib/guide';
import { cn } from '@/lib/utils';

type TripWizardClientProps = {
  tripId: string;
  locale: string;
  tripCode?: string;
  tripName: string;
};

type WizardStepKey = 'pre_trip' | 'attendance_manifest' | 'briefing_photo' | 'completion';

type WizardStep = {
  key: WizardStepKey;
  title: string;
  description: string;
};

const STEPS: WizardStep[] = [
  {
    key: 'pre_trip',
    title: 'Persiapan Trip',
    description: 'Cek info trip, cuaca, dan perlengkapan sebelum keberangkatan.',
  },
  {
    key: 'attendance_manifest',
    title: 'Absensi & Manifest',
    description: 'Pastikan semua tamu hadir dan tercatat dengan benar.',
  },
  {
    key: 'briefing_photo',
    title: 'Briefing & Foto Wajib',
    description: 'Lakukan briefing safety dan ambil dokumentasi wajib.',
  },
  {
    key: 'completion',
    title: 'Selesaikan Trip',
    description: 'Pastikan semua tamu kembali dan dokumentasi lengkap.',
  },
];

export function TripWizardClient({ tripId, locale, tripCode, tripName }: TripWizardClientProps) {
  const [manifest, setManifest] = useState<TripManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<WizardStepKey>('pre_trip');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getTripManifest(tripId);
        if (!mounted) return;
        setManifest(data);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError((err as Error).message ?? 'Gagal memuat data trip');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [tripId]);

  const boardedTotal = (manifest?.boardedCount ?? 0) + (manifest?.returnedCount ?? 0);
  const hasDocumentation = Boolean(manifest?.documentationUrl);
  const allReturned =
    manifest?.totalPax && manifest.totalPax > 0
      ? (manifest.returnedCount ?? 0) >= manifest.totalPax
      : false;

  const isStepCompleted = (key: WizardStepKey): boolean => {
    switch (key) {
      case 'pre_trip':
        return true;
      case 'attendance_manifest':
        return boardedTotal > 0;
      case 'briefing_photo':
        return hasDocumentation;
      case 'completion':
        return allReturned;
      default:
        return false;
    }
  };

  const currentIndex = STEPS.findIndex((step) => step.key === activeStep);

  const goToNextStep = () => {
    if (currentIndex < STEPS.length - 1) {
      setActiveStep(STEPS[currentIndex + 1]?.key ?? activeStep);
    }
  };

  const goToPrevStep = () => {
    if (currentIndex > 0) {
      setActiveStep(STEPS[currentIndex - 1]?.key ?? activeStep);
    }
  };

  if (loading && !manifest) {
    return (
      <div className="space-y-4">
        <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke daftar trip</span>
        </Link>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Memuat Trip Wizard...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-3 w-40 rounded-full bg-slate-100" />
              <div className="h-3 w-56 rounded-full bg-slate-100" />
              <div className="h-3 w-48 rounded-full bg-slate-100" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke daftar trip</span>
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const step = STEPS[currentIndex] ?? STEPS[0]!;

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        href={`/${locale}/guide/trips/${tripCode || tripId}`}
        className="flex items-center gap-2 text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali ke detail trip</span>
      </Link>

      {/* Header */}
      <Card className="border-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 text-white shadow-lg">
        <CardContent className="p-5">
          <div className="mb-3">
            <h1 className="text-2xl font-bold leading-tight">{tripName}</h1>
            {tripCode && (
              <p className="mt-1 text-sm opacity-80">Kode: {tripCode}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2.5 text-sm">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 backdrop-blur-sm">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                {manifest?.totalPax ?? 0} tamu •{' '}
                {boardedTotal}/{manifest?.totalPax ?? 0} hadir/kembali
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 backdrop-blur-sm">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate font-medium">
                Meeting point dermaga
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Alur Trip Terpandu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((s, index) => {
              const completed = isStepCompleted(s.key);
              const isActive = s.key === activeStep;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveStep(s.key)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs transition-colors',
                    isActive && 'border-emerald-500 bg-emerald-50',
                    !isActive && 'border-slate-200 bg-white hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                      completed
                        ? 'bg-emerald-500 text-white'
                        : isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      'line-clamp-2 text-center font-medium',
                      isActive ? 'text-slate-900' : 'text-slate-600',
                    )}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Step Content */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">{step.title}</h2>
            <p className="mt-1 text-xs text-slate-600">{step.description}</p>

            <div className="mt-3 space-y-2 text-xs text-slate-700">
              {activeStep === 'pre_trip' && (
                <>
                  <p>
                    1. Baca itinerary dan cuaca hari ini di halaman detail trip.
                  </p>
                  <p>
                    2. Pastikan perlengkapan safety (life jacket, P3K, radio) siap.
                  </p>
                  <p>
                    3. Datang 15–30 menit lebih awal di meeting point.
                  </p>
                  <Link
                    href={`/${locale}/guide/trips/${tripCode || tripId}`}
                    className="mt-3 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    Lihat detail trip & itinerary
                  </Link>
                </>
              )}

              {activeStep === 'attendance_manifest' && (
                <>
                  <p>
                    1. Lakukan check-in dan catat kehadiran tamu di halaman Absensi &
                    Manifest.
                  </p>
                  <p>
                    2. Pastikan nama dan jumlah tamu sesuai dengan data booking.
                  </p>
                  <div className="mt-2 rounded-lg bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">Status Saat Ini</p>
                    <p className="mt-1 text-slate-600">
                      {boardedTotal > 0
                        ? `${boardedTotal}/${manifest?.totalPax ?? 0} tamu sudah tercatat hadir/kembali.`
                        : 'Belum ada tamu yang tercatat hadir. Mulai dari Absensi & Manifest.'}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/${locale}/guide/attendance?tripId=${tripId}`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      <MapPin className="mr-1.5 h-3.5 w-3.5" />
                      Buka halaman Absensi
                    </Link>
                    <Link
                      href={`/${locale}/guide/manifest?tripId=${tripId}`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-50 active:scale-[0.98]"
                    >
                      <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                      Buka halaman Manifest
                    </Link>
                  </div>
                </>
              )}

              {activeStep === 'briefing_photo' && (
                <>
                  <p>1. Lakukan briefing singkat mengenai:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Rute trip dan estimasi waktu.</li>
                    <li>Aturan keselamatan di kapal dan saat snorkeling.</li>
                    <li>Prosedur darurat dan kontak penting.</li>
                  </ul>
                  <p className="mt-2">
                    2. Ambil foto keberangkatan dan dokumentasi awal sebagai syarat
                    payroll.
                  </p>
                  <div className="mt-2 rounded-lg bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">Status Dokumentasi</p>
                    <p className="mt-1 text-slate-600">
                      {hasDocumentation
                        ? 'Link dokumentasi sudah tersimpan untuk trip ini.'
                        : 'Belum ada link dokumentasi yang tersimpan. Pastikan upload foto wajib.'}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/${locale}/guide/trips/${tripCode || tripId}/evidence`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      <Camera className="mr-1.5 h-3.5 w-3.5" />
                      Buka halaman Dokumentasi
                    </Link>
                    <Link
                      href={`/${locale}/guide/trips/${tripCode || tripId}/evidence`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-50 active:scale-[0.98]"
                    >
                      <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                      Lihat foto trip
                    </Link>
                  </div>
                </>
              )}

              {activeStep === 'completion' && (
                <>
                  <p>
                    1. Pastikan semua tamu sudah kembali dan tidak ada yang tertinggal.
                  </p>
                  <p>
                    2. Jika ada insiden, pastikan sudah dilaporkan di menu Insiden & SOS.
                  </p>
                  <p>
                    3. Selesaikan dokumentasi akhir (foto closing, catatan khusus).
                  </p>
                  <div className="mt-2 rounded-lg bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">Ringkasan Kehadiran</p>
                    <p className="mt-1 text-slate-600">
                      {manifest
                        ? `${manifest.returnedCount}/${manifest.totalPax} tamu tercatat kembali.`
                        : 'Data kehadiran belum tersedia.'}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/${locale}/guide/trips/${tripCode || tripId}`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Lihat ringkasan trip
                    </Link>
                    <Link
                      href={`/${locale}/guide/sos`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-50 active:scale-[0.98]"
                    >
                      Laporkan insiden (jika ada)
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                disabled={currentIndex === 0}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition',
                  currentIndex === 0
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-slate-100 active:scale-[0.98]',
                )}
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                disabled={currentIndex === STEPS.length - 1}
                className={cn(
                  'rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition',
                  currentIndex === STEPS.length - 1
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-emerald-700 active:scale-[0.98]',
                )}
              >
                Langkah berikutnya
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

