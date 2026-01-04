/**
 * Guide Application Page
 * Route: /[locale]/guide/apply
 * Public page for applying to become a guide
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { GuideApplicationForm } from './guide-application-form';

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
    title: 'Daftar sebagai Guide - Aero Travel',
    description:
      'Bergabunglah sebagai tour guide profesional di Aero Travel. Dapatkan penghasilan fleksibel dan jadwal yang sesuai dengan kebutuhan Anda.',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/apply`,
    },
  };
}

export default async function GuideApplyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section className="py-8 sm:py-12">
      <Container>
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="mb-4 text-2xl sm:text-3xl font-bold text-slate-900">
            Daftar sebagai Guide
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Bergabunglah dengan tim guide profesional Aero Travel dan dapatkan
            penghasilan fleksibel
          </p>
        </div>

        <GuideApplicationForm locale={locale} />
      </Container>
    </Section>
  );
}

