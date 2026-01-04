/**
 * Guide App - MRA-TP Certifications Page
 * Path: /mobile/guide/certifications/mra-tp
 * Purpose: Display and manage MRA-TP certifications for guides
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { MRATPCertificationsList } from '@/components/guide/mra-tp-certifications-list';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Sertifikasi MRA-TP | Guide App',
  description: 'Kelola sertifikasi MRA-TP dan kompetensi guide',
};

export default async function MRATPCertificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Section>
      <Container>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Sertifikasi MRA-TP</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ASEAN Mutual Recognition Arrangement on Tourism Professionals
            </p>
          </div>

          {/* Certifications List */}
          <Suspense fallback={<div className="text-sm">Memuat...</div>}>
            <MRATPCertificationsList userId={user.id} />
          </Suspense>
        </div>
      </Container>
    </Section>
  );
}

