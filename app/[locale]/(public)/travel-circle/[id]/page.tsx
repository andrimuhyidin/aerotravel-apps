/**
 * Travel Circle Detail
 * Circle details and member management
 * 
 * Route: /travel-circle/[id]
 * Access: Protected (Circle members only)
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
    title: `Travel Circle #${id} - Aero Travel`,
  };
}

export default async function TravelCircleDetailPage({ params }: Props) {
  const { id } = await params;
  
  // TODO: Fetch circle data
  // TODO: Verify user is member
  // TODO: Show circle dashboard
  
  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-6">Travel Circle #{id}</h1>
          
          {/* TODO: Circle info card */}
          {/* TODO: Balance progress */}
          {/* TODO: Member list */}
          {/* TODO: Payment history */}
          {/* TODO: Admin controls (if user is admin) */}
          
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-muted-foreground">
              Travel Circle details will be displayed here.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

