/**
 * Corporate Landing Page Content
 * Client component for corporate landing page
 */

'use client';

import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';

type CorporateLandingContentProps = {
  locale: string;
  hasCorporateRole: boolean;
};

export function CorporateLandingContent({
  locale,
  hasCorporateRole,
}: CorporateLandingContentProps) {
  const benefits = [
    {
      icon: Users,
      title: 'Kelola Karyawan',
      description: 'Kelola data karyawan dan booking mereka dengan mudah',
    },
    {
      icon: FileText,
      title: 'Invoice Otomatis',
      description: 'Dapatkan invoice otomatis untuk setiap booking',
    },
    {
      icon: BarChart3,
      title: 'Laporan Keuangan',
      description: 'Pantau pengeluaran travel dengan laporan detail',
    },
    {
      icon: Shield,
      title: 'Kontrol Akses',
      description: 'Atur siapa yang bisa booking dan batas anggaran',
    },
    {
      icon: Clock,
      title: 'Proses Cepat',
      description: 'Booking dan approval dalam hitungan menit',
    },
    {
      icon: TrendingUp,
      title: 'Cost Efficiency',
      description: 'Hemat biaya dengan paket corporate yang menarik',
    },
  ];

  const features = [
    'Dashboard terintegrasi untuk HR/Admin',
    'Sistem approval otomatis',
    'Invoice bulanan terpusat',
    'Laporan pengeluaran real-time',
    'Multi-department support',
    'Custom pricing untuk perusahaan',
  ];

  return (
    <div className="flex min-h-[100vh] flex-col bg-background">
      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <Section
          className="bg-gradient-to-br from-primary/10 via-primary/5 to-teal-50"
          spacing="lg"
        >
          <Container>
            <div className="text-center">
              <h1 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
                Program Corporate Travel
              </h1>
              <p className="mb-6 text-sm text-muted-foreground sm:text-base">
                Kelola perjalanan bisnis karyawan dengan mudah dan efisien.
                Sistem terintegrasi untuk perusahaan dengan invoice otomatis
              </p>
              <div className="flex flex-col gap-2">
                {hasCorporateRole ? (
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/${locale}/corporate`}>
                      Buka Dashboard Corporate
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/${locale}/corporate/apply`}>
                        Daftar Corporate
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-center text-xs text-muted-foreground"
                    >
                      <Link href={`/${locale}/corporate`}>
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
                Untuk HR & finance
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                Keuntungan Program Corporate
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Satu platform untuk kontrol budget, approval, dan laporan
                perjalanan bisnis.
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

        {/* Features Section */}
        <Section className="bg-muted/50" spacing="lg">
          <Container>
            <div className="mb-4 text-left">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Fitur & Layanan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fitur yang biasa dipakai perusahaan untuk mengelola corporate
                travel.
              </p>
            </div>
            <div className="space-y-2.5">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl bg-card p-3 shadow-sm"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <p className="text-sm text-card-foreground">{feature}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      </main>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 z-20 border-t border-primary/20 bg-gradient-to-r from-primary to-primary/90 px-4 pb-4 pt-3">
        <Container>
          <div className="flex flex-col gap-2 text-center">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-primary-foreground">
                Siap optimalkan corporate travel?
              </h2>
              <p className="text-xs text-primary-foreground/90">
                Integrasi mudah dengan proses approval dan pelaporan yang rapi.
              </p>
            </div>
            {!hasCorporateRole ? (
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link href={`/${locale}/corporate/apply`}>
                  Daftar Corporate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link href={`/${locale}/corporate`}>
                  Buka Dashboard Corporate
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
