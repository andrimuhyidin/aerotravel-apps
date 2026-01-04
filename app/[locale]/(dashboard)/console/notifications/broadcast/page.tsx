import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { BroadcastListClient } from './broadcast-list-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Broadcast Notifications - Admin Console',
  description: 'Kirim notifikasi broadcast ke users',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BroadcastPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Broadcast Notifications
            </h1>
            <p className="text-muted-foreground">
              Kirim notifikasi ke banyak pengguna sekaligus
            </p>
          </div>
          <BroadcastListClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

