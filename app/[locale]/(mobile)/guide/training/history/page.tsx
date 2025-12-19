import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TrainingHistoryClient } from './training-history-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guide.training' });

  return {
    title: t('history.title', { defaultValue: 'Training History' }),
    description: t('history.description', { defaultValue: 'View your training history and certificates' }),
  };
}

export default async function TrainingHistoryPage({ params }: PageProps) {
  const { locale } = await params;

  return <TrainingHistoryClient locale={locale} />;
}
