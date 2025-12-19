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
  DollarSign,
  HeadphonesIcon,
  Percent,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

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
      description: 'Dapatkan komisi hingga 15% dari setiap booking yang berhasil',
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
    <>
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-cyan-50 via-cyan-100 to-cyan-50 py-20">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold text-slate-900">
              Program Mitra B2B
            </h1>
            <p className="mb-8 text-xl text-slate-700">
              Tingkatkan bisnis travel Anda dengan menjadi mitra Aero Travel.
              Dapatkan komisi menarik dan akses ke sistem booking terintegrasi
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {hasMitraRole ? (
                <Button asChild size="lg" className="text-lg">
                  <Link href={`/${locale}/partner/dashboard`}>
                    Masuk ke Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg">
                    <Link href={`/${locale}/mitra/apply`}>
                      Daftar sebagai Mitra
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg">
                    <Link href={`/${locale}/login`}>
                      Login
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Benefits Section */}
      <Section className="py-16">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              Keuntungan Menjadi Mitra
            </h2>
            <p className="text-lg text-slate-600">
              Nikmati berbagai keuntungan saat bergabung dengan program mitra B2B
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                    <Icon className="h-6 w-6 text-cyan-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Features Section */}
      <Section className="bg-slate-50 py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-slate-900">
                Fitur & Layanan
              </h2>
              <p className="text-lg text-slate-600">
                Semua yang Anda butuhkan untuk mengembangkan bisnis travel
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600" />
                  <p className="text-slate-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-r from-cyan-600 to-cyan-700 py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Siap Mengembangkan Bisnis Travel Anda?
            </h2>
            <p className="mb-8 text-lg text-cyan-50">
              Daftar sekarang dan nikmati berbagai keuntungan sebagai mitra B2B
              Aero Travel
            </p>
            {!hasMitraRole && (
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link href={`/${locale}/partner/apply`}>
                  Daftar sebagai Mitra
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

