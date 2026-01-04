/**
 * WebApplication Schema Generator
 * For PWA discoverability and rich results
 */

export function generateWebApplicationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MyAeroTravel',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Works best with modern browsers',
    url: baseUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
    },
    screenshot: `${baseUrl}/screenshots/app-preview.jpg`,
    featureList: [
      'Booking wisata bahari online',
      'Pembayaran aman dengan berbagai metode',
      'Tracking real-time lokasi trip',
      'AI Travel Assistant untuk rekomendasi',
      'Offline support untuk akses tanpa internet',
      'Review dan rating dari traveler lain',
      'Loyalty program dengan reward points',
      'Split bill untuk pembayaran grup',
    ],
    softwareVersion: '1.0.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1000',
      reviewCount: '850',
    },
    author: {
      '@type': 'Organization',
      name: 'Aero Travel',
      url: baseUrl,
    },
  };
}

