import { FaqClient } from './faq-client';

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <FaqClient locale={locale} />;
}

