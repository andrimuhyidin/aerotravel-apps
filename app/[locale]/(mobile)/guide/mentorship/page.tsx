/**
 * Guide Mentorship Page
 * View and manage mentor-mentee relationships
 */

import { Metadata } from 'next';

import { Container } from '@/components/layout/container';
import { MentorshipClient } from './mentorship-client';

export const metadata: Metadata = {
  title: 'Mentorship | Guide App',
  description: 'Mentor-mentee pairing for guide development',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MentorshipPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <Container className="py-4">
      <MentorshipClient locale={locale} />
    </Container>
  );
}

