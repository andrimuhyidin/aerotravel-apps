import { Container } from '@/components/layout/container';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { AttendanceHistoryClient } from './attendance-history-client';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function AttendanceHistoryPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Riwayat Absensi</h1>
        <p className="mt-1 text-sm text-slate-600">Riwayat lengkap check-in dan check-out Anda</p>
      </div>

      <AttendanceHistoryClient guideId={user.id} locale={locale} />
    </Container>
  );
}
