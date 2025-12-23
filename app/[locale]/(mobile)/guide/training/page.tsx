/**
 * Guide Training Modules Page - REDIRECT
 * Route: /[locale]/guide/training
 *
 * Training has been merged into Learning Hub.
 * This page redirects to Learning Hub for backward compatibility.
 */

import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GuideTrainingPage({ params }: PageProps) {
  const { locale } = await params;

  // Redirect to Learning Hub (training is now integrated there)
  redirect(`/${locale}/guide/learning`);
}
