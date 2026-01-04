import { Metadata } from 'next';
import { WatchClient } from './watch-client';

export const metadata: Metadata = {
  title: 'Watch Companion',
  description: 'Smart watch companion app for guide',
};

export default async function WatchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <WatchClient locale={locale} />;
}

