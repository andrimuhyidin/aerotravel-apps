/**
 * AI Dashboard Page
 * Monitor AI usage, costs, and analytics
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { AiDashboardClient } from './ai-dashboard-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'AI Dashboard',
    description: 'Monitor AI usage, costs, and analytics',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/ai/dashboard`,
    },
  };
}

export default async function AiDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if super_admin
  if (user.activeRole !== 'super_admin') {
    redirect(`/${locale}/console`);
  }

  return (
    <Section spacing="lg">
      <Container>
        <div className="space-y-6 py-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground">
              AI Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor AI usage, token consumption, and response analytics
            </p>
          </div>

          <AiDashboardClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

