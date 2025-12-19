/**
 * Corporate Application Page
 * Route: /[locale]/corporate/apply
 * Public page for applying to become a corporate client
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { CorporateApplicationForm } from './corporate-application-form';

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
    title: 'Daftar sebagai Corporate Client - Aero Travel',
    description:
      'Program corporate travel untuk perusahaan. Kelola perjalanan bisnis karyawan dengan mudah dan efisien.',
    alternates: {
      canonical: `${baseUrl}/${locale}/corporate/apply`,
    },
  };
}

export default async function CorporateApplyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section className="py-12">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold text-slate-900">
              Daftar sebagai Corporate Client
            </h1>
            <p className="text-lg text-slate-600">
              Program corporate travel untuk mengelola perjalanan bisnis
              karyawan perusahaan Anda
            </p>
          </div>

          <CorporateApplicationForm locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

