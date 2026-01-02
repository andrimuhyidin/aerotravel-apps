/**
 * Guide Shell - Layout wrapper untuk Guide App
 * Mobile-First Wrapper - layaknya native app
 * Tema: Emerald/Green untuk membedakan dari Customer App
 */

import { GuideBottomNavigation } from './guide-bottom-navigation';
import { GuideHeader } from './guide-header';
import { VoiceCommandFAB } from '@/components/guide/voice-command-fab';

type GuideShellProps = {
  children: React.ReactNode;
  locale: string;
  user?: {
    name?: string;
    avatar?: string;
  } | null;
  showHeader?: boolean;
  showBottomNav?: boolean;
};

export function GuideShell({
  children,
  locale,
  user,
  showHeader = true,
  showBottomNav = true,
}: GuideShellProps) {
  return (
    // Outer wrapper - gray background for desktop
    <div className="min-h-screen bg-gray-200">
      {/* Mobile-First Container - max-w-md centered, like native app */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50 shadow-xl">
        {/* Header - sticky */}
        {showHeader && <GuideHeader locale={locale} user={user} />}

        {/* Main Content - scrollable area */}
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>

        {/* Bottom Navigation - fixed at bottom within container */}
        {showBottomNav && (
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2">
            <GuideBottomNavigation locale={locale} />
          </div>
        )}

        {/* Voice Command FAB - Global floating button */}
        <VoiceCommandFAB locale={locale} />
      </div>
    </div>
  );
}
