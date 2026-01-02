'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { logger } from '@/lib/utils/logger';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('Public app error', error, { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Container className="py-16">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
            </div>
            
            <h1 className="mb-2 text-xl font-semibold text-foreground">
              Terjadi Kesalahan
            </h1>
            
            <p className="mb-6 text-sm text-muted-foreground">
              Maaf, terjadi kesalahan yang tidak terduga. Tim kami sudah diberitahu
              dan sedang bekerja untuk memperbaikinya.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={reset}
                variant="default"
                className="gap-2"
                aria-label="Coba lagi memuat halaman"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Coba Lagi
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="gap-2"
                aria-label="Kembali ke halaman utama"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Ke Beranda
              </Button>
            </div>

            {error.digest && (
              <p className="mt-4 text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}

