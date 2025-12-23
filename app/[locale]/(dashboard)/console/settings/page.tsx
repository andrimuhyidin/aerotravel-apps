/**
 * Settings Page
 * Route: /[locale]/console/settings
 * Admin-only system settings management
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { SettingsClient } from './settings-client';

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
    title: 'System Settings - Aero Travel Console',
    description:
      'Kelola pengaturan sistem global seperti radius absensi, denda keterlambatan, dan lainnya',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/settings`,
    },
  };
}

export default async function ConsoleSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="py-8">
          <SettingsClient />
        </div>
      </Container>
    </Section>
  );
}
