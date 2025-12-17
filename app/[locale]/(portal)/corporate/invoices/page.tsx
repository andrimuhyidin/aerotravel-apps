/**
 * Corporate Invoices Page
 * Route: /[locale]/corporate/invoices
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  return {
    title: 'Corporate Invoices - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/corporate/invoices`,
    },
  };
}

export default async function CorporateInvoicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-6">Corporate Invoices</h1>
          
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-muted-foreground">
              Corporate Invoices page will be implemented here.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
