/**
 * Guide Contract Detail Page
 * View contract details and sign/reject
 */

import { Metadata, Viewport } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { ContractDetailClient } from './contract-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
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
    title: t('contracts.detail.title', { defaultValue: 'Detail Kontrak' }),
    description: t('contracts.detail.description', { defaultValue: 'Lihat detail kontrak kerja' }),
  };
}

export default async function GuideContractDetailPage({ params }: PageProps) {
  const { locale, id: contractId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  return (
    <Section>
      <Container className="py-4">
        <ContractDetailClient locale={locale} contractId={contractId} guideId={user.id} />
      </Container>
    </Section>
  );
}
