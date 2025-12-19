/**
 * Console: Contract Detail Page
 * View and manage contract details
 */

import { Metadata, Viewport } from 'next';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser, hasRole } from '@/lib/supabase/server';

import { ContractDetailAdminClient } from './contract-detail-admin-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'console' });

  return {
    title: t('contracts.detail.title', { defaultValue: 'Detail Kontrak' }),
    description: t('contracts.detail.description', { defaultValue: 'Lihat dan kelola detail kontrak' }),
  };
}

export default async function ContractDetailAdminPage({ params }: PageProps) {
  const { locale, id: contractId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Check admin role
  const isAuthorized = await hasRole([
    'super_admin',
    'ops_admin',
    'finance_manager',
  ]);

  if (!isAuthorized) {
    return (
      <Section>
        <Container className="py-8">
          <div className="text-center">
            <p className="text-red-600">Akses ditolak. Hanya admin yang dapat mengakses halaman ini.</p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container className="py-6">
        <ContractDetailAdminClient locale={locale} contractId={contractId} />
      </Container>
    </Section>
  );
}
