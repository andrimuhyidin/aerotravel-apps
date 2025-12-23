/**
 * Photo Gallery - Social Proof Gating
 * PRD 5.3.C - Social Proof Gating
 *
 * Route: /gallery/[tripId]
 * Access: Protected (Trip participants only)
 */

import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

type Props = {
  params: Promise<{ tripId: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tripId } = await params;
  return {
    title: `Trip Photo Gallery #${tripId} - Aero Travel`,
  };
}

export default async function GalleryPage({ params }: Props) {
  const { tripId } = await params;

  // TODO: Fetch trip photos
  // TODO: Check if user is participant
  // TODO: Check if review submitted (unlock condition)
  // TODO: Show blurred photos if review not submitted
  // TODO: Show review form if not submitted
  // TODO: Unlock photos after review submission

  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl md:text-3xl">
            Trip Photo Gallery #{tripId}
          </h1>

          {/* TODO: Review form (if not submitted) */}
          {/* TODO: Photo grid (blurred if no review) */}
          {/* TODO: Download HD button (after unlock) */}

          <div className="rounded-lg bg-muted p-8">
            <p className="text-muted-foreground">
              Photo gallery will be displayed here. Review is required to unlock
              photos.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
