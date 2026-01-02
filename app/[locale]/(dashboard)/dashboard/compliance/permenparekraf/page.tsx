/**
 * Dashboard - Permenparekraf Self-Assessment Page
 * Path: /dashboard/compliance/permenparekraf
 * Purpose: Admin page for Permenparekraf No.4/2021 self-assessment
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { PermenparekrafDashboard } from '@/components/admin/permenparekraf-dashboard';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Self-Assessment Permenparekraf | Dashboard',
  description: 'Self-Assessment Standar Usaha Pariwisata (Permenparekraf No.4/2021)',
};

export default async function PermenparekrafAssessmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || !['super_admin', 'ops_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  return (
    <Section>
      <Container>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Self-Assessment Standar Usaha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Permenparekraf No.4 Tahun 2021 tentang Standar Usaha Pariwisata
            </p>
          </div>

          {/* Dashboard */}
          <Suspense fallback={<div className="text-sm">Memuat...</div>}>
            <PermenparekrafDashboard userId={user.id} />
          </Suspense>
        </div>
      </Container>
    </Section>
  );
}

