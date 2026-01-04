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
  // Additional paths to include
  additionalPaths: async (config) => {
    const result = [];

    // Add blog categories
    const blogCategories = [
      'tips-perjalanan',
      'destinasi',
      'packing-list',
      'pengalaman',
      'berita',
    ];
    blogCategories.forEach((cat) => {
      result.push({
        loc: `/blog/category/${cat}`,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: new Date().toISOString(),
      });
    });

    // Add destinations
    const destinations = [
      'pahawang',
      'kiluan',
      'labuan-bajo',
      'raja-ampat',
      'karimunjawa',
      'tanjung-lesung',
    ];
    destinations.forEach((dest) => {
      result.push({
        loc: `/destinations/${dest}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    });

    // Add sample blog articles (in production, fetch from database)
    const blogArticles = [
      'tips-perjalanan-pahawang-pertama-kali',
      'packing-list-snorkeling',
    ];
    blogArticles.forEach((slug) => {
      result.push({
        loc: `/blog/${slug}`,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      });
    });

    return result;
  },
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
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id'}/sitemap-images.xml`,
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

