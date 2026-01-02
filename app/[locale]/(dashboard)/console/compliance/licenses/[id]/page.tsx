import { Metadata, Viewport } from 'next';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

import { LicenseDetailClient } from './license-detail-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E3A8A',
};

export const metadata: Metadata = {
  title: 'Detail Izin Usaha | Admin Console',
  description: 'Lihat detail izin usaha.',
};

export default function LicenseDetailPage() {
  return (
    <Section>
      <Container>
        <LicenseDetailClient />
      </Container>
    </Section>
  );
}

