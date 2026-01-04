/**
 * Guide Challenges Page - REDIRECT
 * Route: /[locale]/guide/challenges
 *
 * Challenges has been merged into Performance Insight.
 * This page redirects to Performance Insight for backward compatibility.
 */

import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GuideChallengesPage({ params }: PageProps) {
  const { locale } = await params;

  // Redirect to Performance Insight (challenges are now integrated there)
  redirect(`/${locale}/guide/performance`);
}
