/**
 * Season Calendar Management Page
 * Manage seasonal pricing periods
 */

import { Metadata } from 'next';

import { SeasonsClient } from './seasons-client';

export const metadata: Metadata = {
  title: 'Season Calendar | Admin Console',
  description: 'Kelola periode musiman dan harga dinamis',
};

export default function SeasonsPage() {
  return <SeasonsClient />;
}

