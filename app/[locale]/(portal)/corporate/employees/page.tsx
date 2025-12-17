/**
 * Employees Page
 * Route: /[locale]/corporate/employees
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
    title: 'Employees - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/corporate/employees`,
    },
  };
}

export default async function CorporateEmployeesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-6">Employees</h1>
          
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-muted-foreground">
              Employees page will be implemented here.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
