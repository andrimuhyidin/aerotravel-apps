import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { PaymentsListClient } from './payments-list-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Verifikasi Pembayaran - Admin Console',
  description: 'Kelola dan verifikasi pembayaran dari customer',
};

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Verifikasi Pembayaran
            </h1>
            <p className="text-muted-foreground">
              Kelola dan verifikasi bukti pembayaran dari customer
            </p>
          </div>
          <PaymentsListClient 
            locale={locale} 
            initialParams={searchParamsResolved}
          />
        </div>
      </Container>
    </Section>
  );
}

