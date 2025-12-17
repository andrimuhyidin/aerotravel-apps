/**
 * Public Route Group Layout
 * Customer-facing pages: Marketing, Booking, Packages
 * Features: Header, Footer, Mobile Navigation
 * Mobile-First PWA Wrapper (Instagram/Astro style)
 */

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

type PublicLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Mobile-First Container */}
      <div className="relative mx-auto w-full max-w-md bg-background shadow-xl">
        <Header locale={locale} />
        <main className="min-h-screen pb-20">{children}</main>
        <Footer locale={locale} />
      </div>
      {/* Fixed Bottom Nav - Centered to match container */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto w-full max-w-md">
          <MobileNav locale={locale} />
        </div>
      </div>
    </div>
  );
}
