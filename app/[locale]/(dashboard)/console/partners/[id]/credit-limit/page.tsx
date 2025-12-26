/**
 * Admin: Partner Credit Limit Management
 * Route: /console/partners/[id]/credit-limit
 */

import { Metadata, Viewport } from 'next';
import { CreditLimitClient } from './credit-limit-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Credit Limit Management | Console',
  description: 'Kelola credit limit untuk partner',
};

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function CreditLimitPage({ params }: PageProps) {
  const { id } = await params;
  return <CreditLimitClient partnerId={id} />;
}

