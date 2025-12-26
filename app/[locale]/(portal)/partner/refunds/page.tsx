import { RefundsClient } from './refunds-client';

export default async function RefundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RefundsClient locale={locale} />;
}

