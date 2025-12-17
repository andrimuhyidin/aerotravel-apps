import type { Metadata } from 'next';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { QueryProvider } from '@/lib/providers/query-provider';
import { PostHogProvider } from '@/lib/analytics/posthog';
import { OrganizationSchema } from '@/lib/seo/structured-data';
import { ErrorBoundary } from '@/components/error-boundary';
import { env } from '@/lib/env';
import { fontVariables } from '@/lib/fonts';

const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'MyAeroTravel ID - Integrated Travel Ecosystem',
    template: '%s | MyAeroTravel ID',
  },
  description: 'ERP & Super App for Travel Management - Integrated Travel Ecosystem dengan AI-powered automation',
  keywords: ['travel', 'wisata', 'booking', 'ERP', 'travel management'],
  authors: [{ name: 'Aero Travel Indonesia' }],
  creator: 'Aero Travel Indonesia',
  publisher: 'Aero Travel Indonesia',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: appUrl,
    siteName: 'MyAeroTravel ID',
    title: 'MyAeroTravel ID - Integrated Travel Ecosystem',
    description: 'ERP & Super App for Travel Management',
    images: [
      {
        url: `${appUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'MyAeroTravel ID',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyAeroTravel ID - Integrated Travel Ecosystem',
    description: 'ERP & Super App for Travel Management',
    images: [`${appUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: appUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={fontVariables} suppressHydrationWarning>
      <head>
        <OrganizationSchema />
      </head>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <PostHogProvider>{children}</PostHogProvider>
          </QueryProvider>
        </ErrorBoundary>
        {env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA4_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}

