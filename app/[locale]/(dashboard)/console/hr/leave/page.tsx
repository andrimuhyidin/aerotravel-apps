import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LeaveRequestsClient } from './leave-requests-client';

export const metadata: Metadata = {
  title: 'Leave Requests | Admin Console',
  description: 'Employee leave request management',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LeaveRequestsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LeaveRequestsClient locale={locale} />;
}

