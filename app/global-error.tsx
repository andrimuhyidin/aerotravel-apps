/**
 * Root Error Boundary (Catches errors in root layout)
 * Next.js App Router global error handling
 */

'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Terjadi Kesalahan Sistem</h1>
            <p className="text-gray-600 mb-4">
              Maaf, terjadi kesalahan yang tidak terduga. Silakan refresh halaman.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

