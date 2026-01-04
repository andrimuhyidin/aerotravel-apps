/**
 * Terms and Conditions Page
 * Route: /[locale]/legal/terms
 */

import { FileText } from 'lucide-react';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Syarat dan Ketentuan - Aero Travel',
    description:
      'Syarat dan ketentuan penggunaan layanan Aero Travel. Baca ketentuan lengkap sebelum menggunakan layanan kami.',
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/terms`,
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch legal page from database
  const legalPage = await getLegalPage('terms');
  const companyConfig = await getCompanyConfig();

  // Fallback content if not found in database
  const fallbackContent = `
    <section class="mb-8">
      <h3 class="mb-3 text-base font-semibold">1. Definisi</h3>
      <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li><strong>"Aero Travel"</strong> adalah penyedia jasa perjalanan wisata bahari</li>
        <li><strong>"Pelanggan"</strong> adalah pengguna yang memesan layanan</li>
        <li><strong>"Guide"</strong> adalah pemandu wisata yang terdaftar dan terverifikasi</li>
        <li><strong>"Trip"</strong> adalah perjalanan wisata yang disediakan oleh Aero Travel</li>
      </ul>
    </section>
  `;

  const contentHtml = legalPage?.content_html || fallbackContent;
  const lastUpdated = legalPage?.last_updated
    ? new Date(legalPage.last_updated)
    : new Date();

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">
          {legalPage?.title || 'Syarat dan Ketentuan'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Terakhir diperbarui:{' '}
          {lastUpdated.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Terms Content */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(contentHtml),
            }}
          />

          <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              <strong>Pertanyaan?</strong> Hubungi support kami melalui email{' '}
              <a
                href={`mailto:${companyConfig.email}`}
                className="text-primary underline"
              >
                {companyConfig.email}
              </a>{' '}
              atau WhatsApp{' '}
              <a
                href={`https://wa.me/${companyConfig.phone?.replace(/\D/g, '')}`}
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {companyConfig.phone}
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
