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

