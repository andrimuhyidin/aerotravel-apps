import { Metadata, Viewport } from 'next';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

import { CreateLicenseClient } from './create-license-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E3A8A',
};

export const metadata: Metadata = {
  title: 'Tambah Izin Usaha | Admin Console',
  description: 'Tambahkan izin usaha baru (NIB, SKDN, SISUPAR, TDUP, ASITA, CHSE).',
};

export default function NewLicensePage() {
  return (
    <Section>
      <Container>
        <CreateLicenseClient />
      </Container>
    </Section>
  );
}

