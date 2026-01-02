/**
 * Structured Data (JSON-LD) Component
 * Untuk SEO dengan Schema.org markup
 */

export type StructuredDataProps = {
  data: Record<string, unknown>;
  type: string;
};

export function StructuredData({ data, type }: StructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Product Schema untuk paket wisata
 */
export function ProductSchema({
  name,
  description,
  price,
  image,
  url,
}: {
  name: string;
  description: string;
  price: number;
  image?: string;
  url: string;
}) {
  return (
    <StructuredData
      type="Product"
      data={{
        name,
        description,
        image,
        offers: {
          '@type': 'Offer',
          price,
          priceCurrency: 'IDR',
          availability: 'https://schema.org/InStock',
          url,
        },
      }}
    />
  );
}

/**
 * Organization Schema
 */
export function OrganizationSchema() {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: 'Aero Travel Indonesia',
        url: 'https://aerotravel.co.id',
        logo: 'https://aerotravel.co.id/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+62-XXX-XXXX-XXXX',
          contactType: 'customer service',
        },
      }}
    />
  );
}

/**
 * TravelAction Schema untuk booking
 */
export function TravelActionSchema({
  name,
  destination,
  origin,
  price,
}: {
  name: string;
  destination: string;
  origin: string;
  price: number;
}) {
  return (
    <StructuredData
      type="TravelAction"
      data={{
        name,
        target: {
          '@type': 'Place',
          name: destination,
        },
        object: {
          '@type': 'Place',
          name: origin,
        },
        price,
        priceCurrency: 'IDR',
      }}
    />
  );
}

/**
 * Generate Package Schema data (non-component version)
 */
export function generatePackageSchema(data: {
  name: string;
  description: string;
  price: number;
  image?: string;
  url: string;
  destination?: string;
  duration?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: data.name,
    description: data.description,
    image: data.image,
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      url: data.url,
    },
    touristType: 'Adventure',
    itinerary: data.destination
      ? {
          '@type': 'Place',
          name: data.destination,
        }
      : undefined,
  };
}

/**
 * Generate Breadcrumb Schema data
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Organization Schema data (non-component version)
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Aero Travel Indonesia',
    url: 'https://aerotravel.co.id',
    logo: 'https://aerotravel.co.id/logo.png',
    description: 'Travel agency terpercaya di Indonesia untuk paket wisata domestik dan internasional',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+62-XXX-XXXX-XXXX',
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English'],
    },
    sameAs: [
      'https://www.facebook.com/aerotravel',
      'https://www.instagram.com/aerotravel',
      'https://twitter.com/aerotravel',
    ],
  };
}

/**
 * Generate Website Schema data (non-component version)
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Aero Travel Indonesia',
    url: 'https://aerotravel.co.id',
    description: 'Platform booking paket wisata online terpercaya di Indonesia',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://aerotravel.co.id/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Aero Travel Indonesia',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aerotravel.co.id/logo.png',
      },
    },
  };
}

/**
 * Generate FAQ Schema data
 */
export type FAQItem = {
  question: string;
  answer: string;
};

export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Author/Person Schema data
 */
export type AuthorSchemaInput = {
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  url?: string;
  email?: string;
  sameAs?: string[];
  worksFor?: {
    name: string;
    url?: string;
  };
};

export function generateAuthorSchema(author: AuthorSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    ...(author.jobTitle && { jobTitle: author.jobTitle }),
    ...(author.description && { description: author.description }),
    ...(author.image && { image: author.image }),
    ...(author.url && { url: author.url }),
    ...(author.email && { email: author.email }),
    ...(author.sameAs && { sameAs: author.sameAs }),
    ...(author.worksFor && {
      worksFor: {
        '@type': 'Organization',
        name: author.worksFor.name,
        ...(author.worksFor.url && { url: author.worksFor.url }),
      },
    }),
  };
}

/**
 * Generate About Page Schema data
 */
export function generateAboutPageSchema(options: {
  name: string;
  description: string;
  url: string;
  foundingDate?: string;
  founders?: AuthorSchemaInput[];
  awards?: string[];
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: options.name,
    description: options.description,
    url: options.url.startsWith('http') ? options.url : `${baseUrl}${options.url}`,
    mainEntity: {
      '@type': 'TravelAgency',
      name: 'MyAeroTravel',
      url: baseUrl,
      ...(options.foundingDate && { foundingDate: options.foundingDate }),
      ...(options.founders && {
        founder: options.founders.map((f) => ({
          '@type': 'Person',
          name: f.name,
          ...(f.jobTitle && { jobTitle: f.jobTitle }),
          ...(f.sameAs && { sameAs: f.sameAs }),
        })),
      }),
      ...(options.awards && { award: options.awards }),
    },
  };
}

/**
 * Generate Contact Page Schema data
 */
export function generateContactPageSchema(options: {
  telephone: string;
  email: string;
  address?: string;
  openingHours?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Hubungi MyAeroTravel',
    url: `${baseUrl}/contact`,
    mainEntity: {
      '@type': 'TravelAgency',
      name: 'MyAeroTravel',
      telephone: options.telephone,
      email: options.email,
      ...(options.address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: options.address,
          addressCountry: 'ID',
        },
      }),
      ...(options.openingHours && { openingHours: options.openingHours }),
    },
  };
}

/**
 * Generate Image Gallery Schema data
 */
export type ImageSchemaInput = {
  url: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  author?: string;
  dateCreated?: string;
  location?: string;
};

export function generateImageGallerySchema(images: ImageSchemaInput[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    image: images.map((img) => ({
      '@type': 'ImageObject',
      url: img.url,
      ...(img.caption && { caption: img.caption }),
      ...(img.alt && { name: img.alt }),
      ...(img.width && { width: img.width }),
      ...(img.height && { height: img.height }),
      ...(img.author && {
        author: {
          '@type': 'Person',
          name: img.author,
        },
      }),
      ...(img.dateCreated && { dateCreated: img.dateCreated }),
      ...(img.location && {
        contentLocation: {
          '@type': 'Place',
          name: img.location,
        },
      }),
    })),
  };
}

