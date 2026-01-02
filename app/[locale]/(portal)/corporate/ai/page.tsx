/**
 * Corporate AI Assistant Page
 * Route: /[locale]/corporate/ai
 * AI-powered travel management assistant
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { AIChatClient } from './ai-chat-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'AI Assistant - Corporate Portal',
  description: 'AI-powered assistant untuk manajemen travel corporate',
};

export default async function CorporateAIPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <AIChatClient locale={locale} />
    </div>
  );
}

