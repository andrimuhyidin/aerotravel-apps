/**
 * Global Error Page (Route-level Error Boundary)
 * Next.js App Router error handling
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Terjadi Kesalahan</CardTitle>
          <CardDescription>
            Maaf, halaman ini mengalami masalah. Silakan coba lagi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">Error:</p>
              <pre className="mt-2 overflow-auto">{error.message}</pre>
              {error.digest && (
                <p className="mt-2 text-xs">Digest: {error.digest}</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              Coba Lagi
            </Button>
            <Button onClick={() => (window.location.href = '/')} variant="outline">
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

