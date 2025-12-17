/**
 * Guide Trip Detail
 * Trip details for guide with documentation upload
 * 
 * Route: /guide/trips/[id]
 * Access: Protected (Guide role, assigned to trip only)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
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
    title: `Detail Trip #${id} - Guide - Aero Travel`,
  };
}

export default async function GuideTripDetailPage({ params }: Props) {
  const { id } = await params;
  
  // TODO: Fetch trip data
  // TODO: Verify guide is assigned to this trip
  // TODO: Show trip info, manifest, checklist
  // TODO: Upload documentation (photo, receipt) - PRD 4.5.B requirement
  
  return (
    <Section>
      <Container className="max-w-md mx-auto">
        <div className="py-4">
          <h1 className="text-2xl font-bold mb-4">Detail Trip #{id}</h1>
          
          {/* TODO: Trip information */}
          {/* TODO: Documentation upload form */}
          {/* TODO: Expense receipt upload */}
          {/* TODO: Photo upload */}
          
          <div className="bg-muted p-6 rounded-lg">
            <p className="text-muted-foreground text-sm">
              Guide trip details will be displayed here.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

