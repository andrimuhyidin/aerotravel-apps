/**
 * Admin AI Documents Management
 * Dashboard untuk manage SOP documents dan AI knowledge base
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { AiDocumentsManagementClient } from './ai-documents-management-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'AI Documents Management',
    description: 'Kelola SOP documents dan AI knowledge base untuk RAG',
  };
}

export default async function AiDocumentsManagementPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if admin
  const isAdmin = ['super_admin', 'ops_admin', 'owner', 'manager', 'admin'].includes(
    user.activeRole || (user.profile as { role?: string })?.role || ''
  );

  if (!isAdmin) {
    redirect(`/${locale}/guide`);
  }

  return (
    <Section spacing="lg">
      <Container>
        <div className="space-y-4 py-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900">
              AI Documents Management
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola SOP documents, FAQ, dan knowledge base untuk AI Assistant (RAG)
            </p>
          </div>

          <AiDocumentsManagementClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}
