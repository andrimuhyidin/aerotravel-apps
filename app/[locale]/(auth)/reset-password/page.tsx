import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';

import { ResetPasswordForm } from './reset-password-form';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Reset Password - Aero Travel',
  description: 'Buat password baru untuk akun Anda',
};

export default async function ResetPasswordPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 text-4xl">🔑</div>
        <h1 className="text-2xl font-bold">Buat Password Baru</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Masukkan password baru untuk akun Anda
        </p>
      </div>

      <ResetPasswordForm locale={locale} />
    </div>
  );
}
