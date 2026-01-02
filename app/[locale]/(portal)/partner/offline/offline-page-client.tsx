/**
 * Offline Page Client Component
 * Shows when user has no internet connection
 */

'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type OfflinePageClientProps = {
  locale: string;
};

export function OfflinePageClient({ locale }: OfflinePageClientProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to dashboard after coming back online
      setTimeout(() => {
        router.push('/partner/dashboard');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = async () => {
    setIsChecking(true);
    // Try to fetch something to check connection
    try {
      await fetch('/api/health', { cache: 'no-store' });
      setIsOnline(true);
      router.push('/partner/dashboard');
    } catch {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div
            className={cn(
              'mb-6 flex h-20 w-20 items-center justify-center rounded-full',
              isOnline ? 'bg-green-100' : 'bg-orange-100'
            )}
          >
            {isOnline ? (
              <Wifi className="h-10 w-10 text-green-600" />
            ) : (
              <WifiOff className="h-10 w-10 text-orange-600" />
            )}
          </div>

          <h1 className="mb-2 text-2xl font-bold">
            {isOnline ? 'Terhubung Kembali!' : 'Anda Sedang Offline'}
          </h1>

          <p className="mb-6 text-muted-foreground">
            {isOnline
              ? 'Koneksi internet telah pulih. Anda akan dialihkan ke dashboard...'
              : 'Tidak ada koneksi internet. Beberapa fitur mungkin tidak tersedia.'}
          </p>

          {!isOnline && (
            <>
              <Button
                onClick={handleRetry}
                disabled={isChecking}
                className="mb-4 w-full"
              >
                <RefreshCw
                  className={cn('mr-2 h-4 w-4', isChecking && 'animate-spin')}
                />
                {isChecking ? 'Memeriksa...' : 'Coba Lagi'}
              </Button>

              <div className="w-full space-y-3 rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">Fitur Tersedia Offline:</p>
                <ul className="space-y-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CloudOff className="h-4 w-4" />
                    Lihat booking yang sudah di-cache
                  </li>
                  <li className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Draf akan disimpan dan sync otomatis
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        MyAeroTravel Partner Portal
      </p>
    </div>
  );
}

