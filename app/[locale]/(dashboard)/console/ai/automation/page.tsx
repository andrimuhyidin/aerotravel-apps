/**
 * Automation Rules Page
 * Workflow automation configuration
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { AutomationClient } from './automation-client';

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
    title: 'Automation Rules',
    description: 'Configure workflow automation rules',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/ai/automation`,
    },
  };
}

export default async function AutomationPage({ params }: PageProps) {
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
              Automation Rules
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure automated workflows and triggers
            </p>
          </div>

          <AutomationClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

