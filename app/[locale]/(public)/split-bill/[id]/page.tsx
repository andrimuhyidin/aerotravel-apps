/**
 * Split Bill Page - Digital Group Payment
 * PRD 5.1.A - Split Bill (Digital Group Payment)
 * 
 * Route: /split-bill/[id]
 * Access: Public (via unique link) or Protected (if logged in)
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
    title: `Split Bill Trip #${id} - Aero Travel`,
  };
}

export default async function SplitBillPage({ params }: Props) {
  const { id } = await params;
  
  // TODO: Fetch split bill data
  // TODO: Show group leader info */}
  // TODO: Show payment status per person (real-time tracking) */}
  // TODO: Show countdown timer (24 hours) */}
  // TODO: Payment link per person */}
  // TODO: Group leader actions (pay remainder, cancel) */}
  
  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-6">Split Bill Trip #{id}</h1>
          
          {/* TODO: Group info */}
          {/* TODO: Payment status grid (who paid, who hasn't) */}
          {/* TODO: Individual payment links */}
          {/* TODO: Timer countdown */}
          {/* TODO: Group leader controls */}
          
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-muted-foreground">
              Split bill page will be implemented here.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

