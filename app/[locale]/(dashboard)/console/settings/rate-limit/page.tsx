import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Shield } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { RateLimitSettingsClient } from './rate-limit-settings-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Rate Limiting | MyAeroTravel ID',
    description: 'Configure API rate limiting and Redis settings',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/settings/rate-limit`,
    },
  };
}

export default async function RateLimitSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="space-y-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Rate Limiting</h1>
              <p className="text-sm text-muted-foreground">
                Konfigurasi rate limiting dan koneksi Redis untuk perlindungan API.
              </p>
            </div>
          </div>

          <RateLimitSettingsClient />
        </div>
      </Container>
    </Section>
  );
}

