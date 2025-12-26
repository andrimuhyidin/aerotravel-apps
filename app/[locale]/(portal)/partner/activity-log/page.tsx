import { ActivityLogClient } from './activity-log-client';

export default async function ActivityLogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ActivityLogClient locale={locale} />;
}

