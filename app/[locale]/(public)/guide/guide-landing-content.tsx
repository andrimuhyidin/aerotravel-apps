/**
 * Guide Landing Page Content
 * Client component for guide landing page
 */

'use client';

import {
  ArrowRight,
  Calendar,
  CheckCircle,
  DollarSign,
  MapPin,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';

type GuideLandingContentProps = {
  locale: string;
  hasGuideRole: boolean;
};

export function GuideLandingContent({
  locale,
  hasGuideRole,
}: GuideLandingContentProps) {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Penghasilan Fleksibel',
      description: 'Dapatkan komisi menarik dari setiap trip yang Anda handle',
    },
    {
      icon: Calendar,
      title: 'Jadwal Fleksibel',
      description: 'Pilih trip sesuai dengan waktu luang Anda',
    },
    {
      icon: Smartphone,
      title: 'Aplikasi Mobile',
      description: 'Kelola semua aktivitas guide melalui aplikasi mobile yang mudah digunakan',
    },
    {
      icon: Shield,
      title: 'Asuransi & Support',
      description: 'Dapatkan perlindungan asuransi dan dukungan tim operasional 24/7',
    },
    {
      icon: MapPin,
      title: 'Destinasi Menarik',
      description: 'Jelajahi destinasi wisata terbaik di Indonesia',
    },
    {
      icon: Users,
      title: 'Komunitas Guide',
      description: 'Bergabung dengan komunitas guide profesional',
    },
  ];

  const requirements = [
    'Minimal usia 21 tahun',
    'Memiliki KTP dan SIM yang masih berlaku',
    'Memiliki pengalaman sebagai guide atau passion di bidang pariwisata',
    'Memiliki kemampuan komunikasi yang baik',
    'Sehat jasmani dan rohani',
    'Memiliki smartphone dengan koneksi internet',
  ];

  return (
    <div className="flex min-h-[100vh] flex-col bg-background">
      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <Section className="bg-gradient-to-br from-primary/10 via-primary/5 to-teal-50" spacing="lg">
          <Container>
            <div className="text-center">
              <h1 className="mb-4 text-2xl sm:text-3xl font-bold text-foreground">
                Jadilah Guide Profesional
              </h1>
              <p className="mb-6 text-sm sm:text-base text-muted-foreground">
                Bergabunglah dengan tim guide profesional Aero Travel dan
                dapatkan penghasilan fleksibel sambil menjelajahi keindahan
                Indonesia
              </p>
              <div className="flex flex-col gap-2">
              {hasGuideRole ? (
                <Button asChild size="lg" className="w-full">
                  <Link href={`/${locale}/guide`}>
                    Buka Dashboard Guide
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/${locale}/guide/apply`}>
                      Daftar jadi Guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-center text-xs text-muted-foreground"
                  >
                    <Link href={`/${locale}/guide`}>
                      Sudah punya akses? Lihat dashboard
                    </Link>
                  </Button>
                </>
              )}
              </div>
            </div>
          </Container>
        </Section>

        {/* Benefits Section */}
        <Section spacing="lg">
          <Container>
            <div className="mb-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Kenapa Aero Guide
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-foreground">
                Keuntungan Menjadi Guide
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Dirancang untuk workflow guide lapangan yang mobile-first.
              </p>
            </div>
            <div className="space-y-3">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-sm"
                  >
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-card-foreground">
                        {benefit.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* Stats Section */}
        <Section className="bg-muted/50" spacing="lg">
          <Container>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Angka yang sudah jalan
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                <div className="mb-1.5 flex flex-col items-center gap-1">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold text-foreground">500+</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Guide Aktif</p>
              </div>
              <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                <div className="mb-1.5 flex flex-col items-center gap-1">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span className="text-lg font-bold text-foreground">4.8</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Rating</p>
              </div>
              <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                <div className="mb-1.5 flex flex-col items-center gap-1">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold text-foreground">
                    10K+
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">Trip</p>
              </div>
            </div>
          </Container>
        </Section>

        {/* Requirements Section */}
        <Section spacing="lg">
          <Container>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Persyaratan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Beberapa hal yang perlu dipenuhi sebelum mulai bertugas.
              </p>
            </div>
            <div className="space-y-2.5">
              {requirements.map((requirement, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl bg-card p-3 shadow-sm"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <p className="text-sm text-card-foreground">{requirement}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      </main>

      {/* Bottom CTA – mobile native style */}
      <div className="sticky bottom-0 z-20 border-t border-primary/20 bg-gradient-to-r from-primary to-primary/90 px-4 pb-4 pt-3">
        <Container>
          <div className="flex flex-col gap-2 text-center">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-primary-foreground">
              Siap mulai jadi Aero Guide?
            </h2>
            <p className="text-xs text-primary-foreground/90">
              Proses pendaftaran cepat, bisa langsung mulai ketika disetujui.
            </p>
          </div>
          {!hasGuideRole ? (
            <Button asChild size="lg" variant="secondary" className="w-full">
              <Link href={`/${locale}/guide/apply`}>
                Daftar Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="secondary" className="w-full">
              <Link href={`/${locale}/guide`}>
                Buka Dashboard Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          </div>
        </Container>
      </div>
    </div>
  );
}

