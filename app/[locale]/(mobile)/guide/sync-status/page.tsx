/**
 * Data Sync Status Page
 * Halaman detail untuk melihat status sinkronisasi data offline
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { SyncStatusClient } from './sync-status-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Status Sinkronisasi - Guide App',
    description: 'Lihat status sinkronisasi data offline dan kelola mode sinkronisasi',
  };
}

export default async function SyncStatusPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Status Sinkronisasi</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola sinkronisasi data offline dan lihat detail data yang perlu disinkronkan
        </p>
      </div>

      <SyncStatusClient locale={locale} />
    </Container>
  );
}
