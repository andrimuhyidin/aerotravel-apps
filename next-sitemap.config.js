/**
 * next-sitemap Configuration
 * Auto-generates sitemap.xml and robots.txt
 */

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/api/*',
    '/console/*',
    '/partner/*',
    '/guide/*',
    '/corporate/*',
    '/_next/*',
    '/admin/*',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/console/', '/partner/', '/guide/', '/corporate/', '/_next/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/console/', '/partner/', '/guide/', '/corporate/'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id'}/sitemap.xml`,
    ],
  },
  // Transform function to add locale prefixes
  transform: async (config, path) => {
    // Add locale variants for each route
    const locales = ['id', 'en'];
    const sitemaps = [];

    for (const locale of locales) {
      sitemaps.push({
        loc: `/${locale}${path === '/' ? '' : path}`,
        changefreq: config.changefreq,
        priority: config.priority,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      });
    }

    return sitemaps;
  },
};

