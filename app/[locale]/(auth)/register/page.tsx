/**
 * Register Page - New Account
 * PRD 3.1 - Identity Strategy
 *
 * Route: /[locale]/register
 * Access: Public
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';

import { RegisterForm } from './register-form';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth.register');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: `${t('title')} - Aero Travel`,
    description: t('description'),
    alternates: {
      canonical: `${baseUrl}/${locale}/register`,
    },
  };
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth.register');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="mb-4 text-4xl">🚀</div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Buat akun dan mulai petualangan Anda
        </p>
      </div>

      <RegisterForm locale={locale} />
    </div>
  );
}
