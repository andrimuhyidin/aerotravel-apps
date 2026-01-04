'use client';

/**
 * Feedback Section Wrapper
 * Client component wrapper for FeedbackListClient to be used in server components
 */

import { FeedbackListClient } from '@/app/[locale]/(mobile)/guide/feedback/feedback-list-client';

type FeedbackSectionWrapperProps = {
  locale: string;
};

export function FeedbackSectionWrapper({ locale }: FeedbackSectionWrapperProps) {
  return (
    <div className="space-y-4">
      <FeedbackListClient locale={locale} />
    </div>
  );
}
