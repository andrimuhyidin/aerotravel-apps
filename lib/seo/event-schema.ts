/**
 * Event Schema Generator
 * For special trips, holiday packages, and seasonal events
 */

export type EventSchemaInput = {
  name: string;
  description: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  location: string;
  organizer?: string;
  price?: number;
  availability?: 'InStock' | 'SoldOut' | 'PreOrder';
  image?: string;
  url?: string;
};

export function generateEventSchema(event: EventSchemaInput) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'ID',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizer || 'Aero Travel',
      url: baseUrl,
    },
    offers: event.price
      ? {
          '@type': 'Offer',
          price: event.price,
          priceCurrency: 'IDR',
          availability: `https://schema.org/${event.availability || 'InStock'}`,
          validFrom: new Date().toISOString(),
          url: event.url || baseUrl,
        }
      : undefined,
    image: event.image,
  };
}

/**
 * Check if a package/trip should have Event schema
 * based on trip date, special tags, or KOL involvement
 */
export function isSpecialEvent(packageData: {
  tags?: string[];
  tripDate?: string;
  isKOLTrip?: boolean;
  specialOffer?: boolean;
}): boolean {
  // Check for holiday tags
  const holidayKeywords = [
    'lebaran',
    'idul-fitri',
    'natal',
    'christmas',
    'tahun-baru',
    'new-year',
    'long-weekend',
    'liburan-sekolah',
    'summer',
  ];
  const hasHolidayTag =
    packageData.tags?.some((tag) =>
      holidayKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
    ) || false;

  // KOL trips are special events
  if (packageData.isKOLTrip === true) {
    return true;
  }

  // Special offers with specific dates
  if (packageData.specialOffer === true && packageData.tripDate) {
    return true;
  }

  return hasHolidayTag;
}

