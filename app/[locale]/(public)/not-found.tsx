import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Container } from '@/components/layout/container';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Container className="py-16">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 text-center">
            {/* 404 Illustration */}
            <div className="mb-6">
              <span className="text-8xl font-bold text-primary/20">404</span>
            </div>
            
            <h1 className="mb-2 text-xl font-semibold text-foreground">
              Halaman Tidak Ditemukan
            </h1>
            
            <p className="mb-6 text-sm text-muted-foreground">
              Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="default" className="gap-2">
                <Link href="/" aria-label="Kembali ke halaman utama">
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Ke Beranda
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="gap-2">
                <Link href="/packages" aria-label="Cari paket wisata">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Cari Paket
                </Link>
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Mungkin Anda tertarik dengan:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link 
                  href="/packages" 
                  className="text-xs text-primary hover:underline"
                >
                  Semua Paket
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link 
                  href="/about" 
                  className="text-xs text-primary hover:underline"
                >
                  Tentang Kami
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link 
                  href="/contact" 
                  className="text-xs text-primary hover:underline"
                >
                  Kontak
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}

