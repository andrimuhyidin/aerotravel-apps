import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { CertificationsClient } from './certifications-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guide.certifications' });

  return {
    title: t('title', { defaultValue: 'My Certifications' }),
    description: t('description', { defaultValue: 'Manage your certifications' }),
  };
}

export default async function CertificationsPage({ params }: PageProps) {
  const { locale } = await params;

  return <CertificationsClient locale={locale} />;
}
