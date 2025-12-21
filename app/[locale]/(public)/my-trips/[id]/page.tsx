/**
 * Trip Detail - Customer View
 * Complete trip details including itinerary, manifest, gallery
 * PRD 5.4 - Interactive Guide Experience (Live Tracking)
 * 
 * Route: /my-trips/[id]
 * Access: Protected (Customer, owner of trip only)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};


type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Trip Detail #${id} - Aero Travel`,
  };
}

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;
  
  // TODO: Fetch trip data from database
  // TODO: Verify user owns this trip (RLS)
  
  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Trip Detail #{id}</h1>
          
          {/* TODO: Trip information card */}
          {/* TODO: Itinerary timeline */}
          {/* TODO: Passenger manifest */}
          {/* TODO: Live tracking (if ON_THE_WAY status - PRD 5.4) */}
          {/* TODO: Photo gallery link (PRD 5.3.C - Social Proof Gating) */}
          {/* TODO: Download ticket button */}
          {/* TODO: Review & rating button (if completed) */}
          
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-muted-foreground">
              Trip details will be displayed here.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

