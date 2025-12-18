/**
 * Guide Layout
 * Layout untuk Guide App dengan tema emerald/green
 */

import { GuideShell } from '@/components/layout';
import { getCurrentUser } from '@/lib/supabase/server';

type GuideLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function GuideLayout({ children, params }: GuideLayoutProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  return (
    <GuideShell
      locale={locale}
      user={
        user
          ? {
              name: user.profile?.full_name || user.email?.split('@')[0],
              avatar: user.profile?.avatar_url ?? undefined,
            }
          : null
      }
    >
      {children}
    </GuideShell>
  );
}
