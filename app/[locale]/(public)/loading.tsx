import { Loader2 } from 'lucide-react';

import { Container } from '@/components/layout/container';

export default function Loading() {
  return (
    <main 
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-label="Memuat konten"
    >
      <Container className="py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 
              className="h-12 w-12 animate-spin text-primary" 
              aria-hidden="true" 
            />
            <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-primary/20" />
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Memuat...
            </p>
            <p className="text-sm text-muted-foreground">
              Mohon tunggu sebentar
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}

