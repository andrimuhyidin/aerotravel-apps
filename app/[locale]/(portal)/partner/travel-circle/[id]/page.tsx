/**
 * Travel Circle Detail Page
 */

import { Metadata, Viewport } from 'next';
import { TravelCircleDetailClient } from './travel-circle-detail-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Travel Circle Detail | Partner Portal',
  description: 'Detail travel circle dengan members dan contributions',
};

export default function TravelCircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TravelCircleDetailClient params={params} />;
}

