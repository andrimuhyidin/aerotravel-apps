import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';

import { ForgotPasswordForm } from './forgot-password-form';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Lupa Password - Aero Travel',
  description: 'Reset password akun Anda',
};

export default async function ForgotPasswordPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 text-4xl">🔐</div>
        <h1 className="text-2xl font-bold">Lupa Password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Masukkan email Anda untuk reset password
        </p>
      </div>

      <ForgotPasswordForm locale={locale} />
    </div>
  );
}
