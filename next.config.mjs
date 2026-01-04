import withSerwistInit from '@serwist/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withSerwist = withSerwistInit({
  swSrc: 'public/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

// next-intl plugin
const withNextIntl = createNextIntlPlugin('./i18n.ts');

// Bundle analyzer (optional, only if ANALYZE=true)
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  const { default: analyzer } = await import('@next/bundle-analyzer');
  withBundleAnalyzer = analyzer({
    enabled: true,
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Docker compatibility
  poweredByHeader: false, // Hide "X-Powered-By" header

  // TypeScript - ignore errors during build (for faster deployment)
  // Note: Fix errors in development, but don't block production builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration removed - use next lint command instead
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  // i18n configuration (handled by next-intl middleware)
  // Locales: id (default), en

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Security Headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // Izinkan kamera & mikrofon hanya untuk origin sendiri, dan
            // geolocation juga untuk origin sendiri (dibutuhkan untuk Guide App).
            // Format baru Permissions-Policy (Chrome): feature=(self) atau =().
            value: 'camera=(self), microphone=(self), geolocation=(self)',
          },

          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://www.google-analytics.com https://*.supabase.co https://*.supabase.in https://*.posthog.com",
              "frame-src 'self' https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // ISR Configuration untuk SEO pages (PRD 2.8.A)
  // /p/[city]/[slug] akan menggunakan ISR dengan revalidate di page.tsx

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // SVGR Configuration (SVG as React Components)
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

export default withBundleAnalyzer(withNextIntl(withSerwist(nextConfig)));
