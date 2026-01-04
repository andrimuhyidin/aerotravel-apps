/**
 * AI Knowledge Base Page
 * Manage RAG documents and embeddings
 * Migrated from /console/ai-documents
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

// Reuse existing component
import { AiDocumentsManagementClient } from '../../ai-documents/ai-documents-management-client';

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
    title: 'Knowledge Base',
    description: 'Manage RAG documents and AI knowledge base',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/ai/knowledge-base`,
    },
  };
}

export default async function KnowledgeBasePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if super_admin
  if (user.activeRole !== 'super_admin') {
    redirect(`/${locale}/console`);
  }

  return (
    <Section spacing="lg">
      <Container>
        <div className="space-y-4 py-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground">
              Knowledge Base
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola SOP documents, FAQ, dan knowledge base untuk AI Assistant (RAG)
            </p>
          </div>

          <AiDocumentsManagementClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

