/**
 * Partner Landing Page Content
 * Client component for partner landing page
 */

'use client';

import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle,
  CreditCard,
  HeadphonesIcon,
  Percent,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';

type PartnerLandingContentProps = {
  locale: string;
  hasMitraRole: boolean;
};

export function PartnerLandingContent({
  locale,
  hasMitraRole,
}: PartnerLandingContentProps) {
  const benefits = [
    {
      icon: Percent,
      title: 'Komisi Menarik',
      description:
        'Dapatkan komisi hingga 15% dari setiap booking yang berhasil',
    },
    {
      icon: CreditCard,
      title: 'Sistem Deposit',
      description: 'Kelola deposit dengan mudah melalui dashboard terintegrasi',
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      description: 'Pantau performa bisnis dengan analytics real-time',
    },
    {
      icon: Building2,
      title: 'Whitelabel Support',
      description: 'Gunakan brand Anda sendiri dengan fitur whitelabel',
    },
    {
      icon: HeadphonesIcon,
      title: 'Support 24/7',
      description: 'Tim support siap membantu kapan saja Anda butuhkan',
    },
    {
      icon: TrendingUp,
      title: 'Growth Program',
      description: 'Program khusus untuk membantu bisnis Anda berkembang',
    },
  ];

  const features = [
    'Akses ke semua paket travel Aero Travel',
    'Sistem booking terintegrasi',
    'Invoice otomatis',
    'Laporan keuangan real-time',
    'API integration untuk website Anda',
    'Marketing materials & support',
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
                Program Mitra B2B
              </h1>
              <p className="mb-6 text-sm text-muted-foreground sm:text-base">
                Tingkatkan bisnis travel Anda dengan menjadi mitra Aero Travel.
                Dapatkan komisi menarik dan akses ke sistem booking terintegrasi
              </p>
              <div className="flex flex-col gap-2">
                {hasMitraRole ? (
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/${locale}/partner/dashboard`}>
                      Buka Dashboard Mitra
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/${locale}/partner/apply`}>
                        Daftar sebagai Mitra
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-center text-xs text-muted-foreground"
                    >
                      <Link href={`/${locale}/login`}>
                        Sudah terdaftar? Login
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
                Untuk biro & agent
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                Keuntungan Menjadi Mitra
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Satu dashboard terintegrasi untuk mengelola penjualan produk
                Aero Travel.
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
                Tools yang biasa dipakai tim operation & finance partner.
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
                Siap scale bisnis travel Anda?
              </h2>
              <p className="text-xs text-primary-foreground/90">
                Mitra mendapatkan akses dashboard, support, dan komisi yang
                kompetitif.
              </p>
            </div>
            {!hasMitraRole ? (
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link href={`/${locale}/partner/apply`}>
                  Daftar sebagai Mitra
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link href={`/${locale}/partner/dashboard`}>
                  Buka Dashboard Mitra
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
