/**
 * Integrations Settings Page
 * Manage third-party API integrations
 */

import { Metadata } from 'next';

import { IntegrationsClient } from './integrations-client';

export const metadata: Metadata = {
  title: 'Integrasi | Admin Console',
  description: 'Kelola integrasi pihak ketiga',
};

export default function IntegrationsPage() {
  return <IntegrationsClient />;
}

