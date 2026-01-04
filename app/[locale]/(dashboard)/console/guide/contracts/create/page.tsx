/**
 * Console: Create Contract Page
 * Form untuk membuat kontrak baru
 */

import { Metadata, Viewport } from 'next';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser, hasRole } from '@/lib/supabase/server';

import { CreateContractClient } from './create-contract-client';

type PageProps = {
  params: Promise<{ locale: string }>;
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
    title: t('contracts.create.title', { defaultValue: 'Buat Kontrak Baru' }),
    description: t('contracts.create.description', { defaultValue: 'Buat kontrak kerja untuk guide' }),
  };
}

export default async function CreateContractPage({ params }: PageProps) {
  const { locale } = await params;
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
        <CreateContractClient locale={locale} />
      </Container>
    </Section>
  );
}
