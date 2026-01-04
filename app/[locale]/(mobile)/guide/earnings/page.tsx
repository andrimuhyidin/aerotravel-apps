/**
 * Guide Earnings Page
 * Redirects to Wallet page (permanent redirect)
 */

import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export default async function EarningsPage({ params }: PageProps) {
  const { locale } = await params;
  // Permanent redirect to wallet page
  redirect(`/${locale}/guide/wallet`);
}
