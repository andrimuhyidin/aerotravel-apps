import { Metadata, Viewport } from 'next';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

import { LicensesListClient } from './licenses-list-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E3A8A',
};

export const metadata: Metadata = {
  title: 'Daftar Izin Usaha | Admin Console',
  description: 'Kelola semua izin usaha (NIB, SKDN, SISUPAR, TDUP, ASITA, CHSE) perusahaan.',
};

export default function LicensesPage() {
  return (
    <Section>
      <Container>
        <LicensesListClient />
      </Container>
    </Section>
  );
}

