/**
 * Privacy Policy Page
 * Route: /[locale]/legal/privacy
 */

import { Shield } from 'lucide-react';
import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Card, CardContent } from '@/components/ui/card';
import { locales } from '@/i18n';
import { getLegalPage } from '@/lib/cms/legal-pages';
import { sanitizeHtml } from '@/lib/templates/utils';
import { getCompanyConfig } from '@/lib/config/company';

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Kebijakan Privasi - Aero Travel',
    description:
      'Kebijakan privasi Aero Travel menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.',
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/privacy`,
    },
  };
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch legal page from database
  const legalPage = await getLegalPage('privacy');
  const companyConfig = await getCompanyConfig();

  const lastUpdated = legalPage?.last_updated
    ? new Date(legalPage.last_updated)
    : new Date();

  // Fallback content if not found in database
  const fallbackContent = `
    <div class="space-y-4">
      <div>
        <h2 class="mb-2 text-sm font-semibold">1. Pengenalan</h2>
        <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Kebijakan Privasi ini menjelaskan bagaimana Aero Travel ("kami", "kita", atau "perusahaan") mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda ketika Anda menggunakan aplikasi Guide App dan layanan terkait.</p>
      </div>
    </div>
  `;

  const contentHtml = legalPage?.content_html || fallbackContent;

  return (
    <Container className="py-4">
      {/* Hero */}
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mb-2 text-xl font-bold">
          {legalPage?.title || 'Kebijakan Privasi'}
        </h1>
        <p className="text-xs text-muted-foreground">
          Terakhir diperbarui:{' '}
          {lastUpdated.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(contentHtml),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
