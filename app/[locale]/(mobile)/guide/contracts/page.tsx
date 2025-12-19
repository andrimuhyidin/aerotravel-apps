/**
 * Guide Contracts Page
 * List all contracts for current guide
 */

import { Metadata, Viewport } from 'next';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { ContractsClient } from './contracts-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guide' });

  return {
    title: t('contracts.title', { defaultValue: 'Kontrak Kerja' }),
    description: t('contracts.description', { defaultValue: 'Lihat dan kelola kontrak kerja Anda' }),
  };
}

export default async function GuideContractsPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <Section>
      <Container className="py-4">
        <ContractsClient locale={locale} guideId={user.id} />
      </Container>
    </Section>
  );
}
