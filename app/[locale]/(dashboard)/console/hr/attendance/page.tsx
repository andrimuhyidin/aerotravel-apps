import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AttendanceListClient } from './attendance-list-client';

export const metadata: Metadata = {
  title: 'Attendance | Admin Console',
  description: 'Employee attendance management',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AttendancePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AttendanceListClient locale={locale} />;
}

