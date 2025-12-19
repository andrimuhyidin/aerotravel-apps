/**
 * Guide Broadcasts Page
 * Route: /[locale]/guide/broadcasts
 * 
 * NOTE: Broadcasts sekarang digabung dengan notifications
 * Redirect ke notifications dengan filter broadcast untuk backward compatibility
 */

import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export default async function BroadcastsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Redirect ke notifications dengan filter broadcast
  redirect(`/${locale}/guide/notifications?filter=broadcast`);
}
