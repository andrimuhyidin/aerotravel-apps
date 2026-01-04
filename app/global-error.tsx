/**
 * Root Error Boundary (Catches errors in root layout)
 * Next.js App Router global error handling
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import { logger } from '@/lib/utils/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error using structured logger
    logger.error('Global error boundary caught an error', error, {
      digest: error.digest,
      boundary: 'GlobalErrorBoundary',
    });

    // Also log to Sentry if available
    if (typeof window !== 'undefined') {
      const windowWithSentry = window as unknown as { Sentry?: { captureException: (error: Error, context: unknown) => void } };
      if (windowWithSentry.Sentry) {
        windowWithSentry.Sentry.captureException(error, {
          tags: {
            errorBoundary: 'GlobalErrorBoundary',
          },
          extra: {
            digest: error.digest,
          },
        });
      }
    }
  }, [error]);

  return (
    <html lang="id">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Terjadi Kesalahan Sistem</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Maaf, terjadi kesalahan yang tidak terduga. Silakan refresh halaman.
                </p>
                {process.env.NODE_ENV === 'development' && error.message && (
                  <div className="mt-4 rounded-md bg-red-50 p-3 text-left text-xs text-red-800">
                    <p className="font-semibold">Error Details:</p>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap">{error.message}</pre>
                    {error.digest && (
                      <p className="mt-2 text-xs">Digest: {error.digest}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={reset}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-95"
                >
                  Refresh Halaman
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-95"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

