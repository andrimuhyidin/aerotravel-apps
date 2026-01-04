/**
 * App Shell - Master layout wrapper
 * Combines header + content + bottom nav
 */

import { AppHeader } from './app-header';
import { BottomNavigation } from './bottom-navigation';

type AppShellProps = {
  children: React.ReactNode;
  locale: string;
  user?: {
    name?: string;
    avatar?: string;
    role?: string;
  } | null;
  showHeader?: boolean;
  showBottomNav?: boolean;
  headerVariant?: 'default' | 'transparent';
};

export function AppShell({
  children,
  locale,
  user,
  showHeader = true,
  showBottomNav = true,
  headerVariant = 'default',
}: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header */}
      {showHeader && (
        <AppHeader locale={locale} user={user} variant={headerVariant} />
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      {showBottomNav && (
        <div className="lg:hidden">
          <BottomNavigation locale={locale} />
        </div>
      )}
    </div>
  );
}
