/**
 * Global Error Page (Route-level Error Boundary)
 * Next.js App Router error handling
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { logger } from '@/lib/utils/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error using structured logger
    logger.error('Route error boundary caught an error', error, {
      digest: error.digest,
      boundary: 'RouteErrorBoundary',
    });

    // Also log to Sentry if available
    if (typeof window !== 'undefined') {
      const windowWithSentry = window as unknown as { Sentry?: { captureException: (error: Error, context: unknown) => void } };
      if (windowWithSentry.Sentry) {
        windowWithSentry.Sentry.captureException(error, {
          tags: {
            errorBoundary: 'RouteErrorBoundary',
          },
          extra: {
            digest: error.digest,
          },
        });
      }
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-sm">
        <CardContent className="p-6">
          <ErrorState
            icon={AlertTriangle}
            title="Terjadi Kesalahan"
            message="Maaf, halaman ini mengalami masalah. Silakan coba lagi."
            onRetry={reset}
            variant="default"
            showDetails={process.env.NODE_ENV === 'development'}
            details={
              error.digest
                ? `${error.message}\n\nDigest: ${error.digest}`
                : error.message
            }
            actions={[
              {
                label: 'Kembali ke Beranda',
                onClick: () => {
                  window.location.href = '/';
                },
                variant: 'outline' as const,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

