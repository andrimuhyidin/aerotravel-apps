import { InboxClient } from './inbox-client';

export default async function InboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <InboxClient locale={locale} />;
}

