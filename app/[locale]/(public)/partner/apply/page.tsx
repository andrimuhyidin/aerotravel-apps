/**
 * Partner Application Page
 * Route: /[locale]/partner/apply
 * Public page for applying to become a partner (mitra)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { PartnerApplicationForm } from './partner-application-form';

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
    title: 'Daftar sebagai Mitra - Aero Travel',
    description:
      'Bergabunglah sebagai mitra B2B Aero Travel. Dapatkan komisi menarik dan akses ke sistem booking terintegrasi.',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/apply`,
    },
  };
}

export default async function PartnerApplyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section className="py-8 sm:py-12">
      <Container>
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="mb-4 text-2xl sm:text-3xl font-bold text-slate-900">
            Daftar sebagai Mitra
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Bergabunglah dengan program mitra B2B Aero Travel dan dapatkan
            komisi menarik
          </p>
        </div>

        <PartnerApplicationForm locale={locale} />
      </Container>
    </Section>
  );
}

