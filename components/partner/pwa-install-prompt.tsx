/**
 * PWA Install Prompt Component
 * Shows install banner for partner portal PWA
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';

type PwaInstallPromptProps = {
  className?: string;
};

export function PwaInstallPrompt({ className }: PwaInstallPromptProps) {
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall, dismissPrompt } =
    usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Check if user has dismissed before
  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = Date.now();
      // Show again after 7 days
      if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    dismissPrompt();
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      await promptInstall();
    }
  };

  // Don't show if already installed, dismissed, or running in standalone mode
  if (isInstalled || dismissed || isStandalone) {
    return null;
  }

  // Only show if installable (has deferred prompt) or is iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <Card className={cn('fixed bottom-20 left-4 right-4 z-50 shadow-lg', className)}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <Smartphone className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Install Aero Partner</p>
            <p className="text-sm text-muted-foreground">
              Akses lebih cepat langsung dari home screen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleInstall}>
              <Download className="mr-1 h-4 w-4" />
              Install
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <Card
            className="w-full max-w-md animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Install di iOS</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowIOSInstructions(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Tap tombol Share</p>
                    <p className="text-sm text-muted-foreground">
                      Di bagian bawah Safari, tap ikon{' '}
                      <Share className="inline h-4 w-4" />
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Scroll ke bawah</p>
                    <p className="text-sm text-muted-foreground">
                      Cari opsi "Add to Home Screen"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Tap "Add"</p>
                    <p className="text-sm text-muted-foreground">
                      App akan muncul di home screen Anda
                    </p>
                  </div>
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={() => setShowIOSInstructions(false)}>
                Mengerti
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

