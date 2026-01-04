/**
 * AI Summary Component
 * Optimized for AI/LLM extraction and featured snippets
 */

import { cn } from '@/lib/utils';
import type { AISummaryProps } from '@/lib/seo/types';

export function AISummary({ summary, bulletPoints, className }: AISummaryProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 dark:border-teal-800 dark:from-teal-950/50 dark:to-cyan-950/50',
        className
      )}
      role="region"
      aria-label="Ringkasan"
    >
      {/* Main summary - optimized for AI extraction */}
      <p
        className="text-base leading-relaxed text-slate-700 dark:text-slate-300"
        data-seo-summary="true"
      >
        {summary}
      </p>

      {/* Bullet points for quick scanning */}
      {bulletPoints && bulletPoints.length > 0 && (
        <ul className="mt-4 space-y-2" data-seo-key-points="true">
          {bulletPoints.map((point, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Compact AI Summary for cards
 */
export function AISummaryCompact({
  summary,
  className,
}: {
  summary: string;
  className?: string;
}) {
  // Truncate to ~100 characters for compact display
  const truncated =
    summary.length > 100 ? `${summary.substring(0, 100).trim()}...` : summary;

  return (
    <p
      className={cn(
        'text-sm leading-relaxed text-slate-600 dark:text-slate-400',
        className
      )}
      data-seo-summary="true"
    >
      {truncated}
    </p>
  );
}

/**
 * AI Summary with title
 */
export function AISummaryWithTitle({
  title,
  summary,
  bulletPoints,
  className,
}: AISummaryProps & { title: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      role="region"
      aria-label={title}
    >
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>

      <AISummary summary={summary} bulletPoints={bulletPoints} />
    </div>
  );
}

