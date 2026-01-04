/**
 * Chat Page - Full Page Chat Interface
 * Route: /[locale]/console/chat
 * AI Assistant, Ops Chat, and Broadcasts in full page mode
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { ChatPageClient } from './chat-page-client';

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
    title: 'Messages - Aero Travel',
    description: 'AI Assistant, Ops Chat, and Broadcasts',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/chat`,
    },
  };
}

export default async function ChatPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Section className="h-[calc(100vh-4rem)]">
      <Container className="h-full">
        <ChatPageClient
          locale={locale}
          userId={user.id}
          userName={user.profile?.full_name || user.email || 'User'}
        />
      </Container>
    </Section>
  );
}

