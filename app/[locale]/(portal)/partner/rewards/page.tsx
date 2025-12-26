/**
 * Partner Rewards Page
 * Display reward points balance, history, milestones, and redemption
 */

import { Metadata, Viewport } from 'next';
import { RewardsClient } from './rewards-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Reward Points | Partner Portal',
  description: 'Kelola reward points dan lihat milestone achievements',
};

export default function RewardsPage() {
  return <RewardsClient />;
}

