/**
 * Travel Circle List Page
 * List semua travel circles (active, completed, cancelled)
 */

import { Metadata, Viewport } from 'next';
import { TravelCircleClient } from './travel-circle-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Travel Circle | Partner Portal',
  description: 'Kelola travel circle / arisan untuk group savings',
};

export default function TravelCirclePage() {
  return <TravelCircleClient />;
}

