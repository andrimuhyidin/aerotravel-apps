/**
 * External References Component
 * For credible citations and E-E-A-T signals
 */

import { ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ExternalReferenceProps } from '@/lib/seo/types';

/**
 * Single External Reference
 */
export function ExternalReference({
  title,
  url,
  source,
  date,
}: ExternalReferenceProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2 text-sm text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
    >
      <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-60 group-hover:opacity-100" />
      <span>
        <span className="underline-offset-2 group-hover:underline">{title}</span>
        <span className="text-slate-400 dark:text-slate-500">
          {' '}
          — {source}
          {date && `, ${date}`}
        </span>
      </span>
    </a>
  );
}

/**
 * References Section - list of external references
 */
export function ReferencesSection({
  title = 'Sumber & Referensi',
  references,
  className,
}: {
  title?: string;
  references: ExternalReferenceProps[];
  className?: string;
}) {
  if (references.length === 0) return null;

  return (
    <section
      className={cn(
        'rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      aria-label={title}
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <div className="space-y-2">
        {references.map((ref, index) => (
          <ExternalReference key={index} {...ref} />
        ))}
      </div>
    </section>
  );
}

/**
 * Citation Inline - for inline citations
 */
export function CitationInline({
  number,
  url,
  source,
}: {
  number: number;
  url: string;
  source: string;
}) {
  return (
    <sup>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-600 hover:underline dark:text-teal-400"
        title={source}
      >
        [{number}]
      </a>
    </sup>
  );
}

/**
 * Partner Logos - for credibility
 */
export function PartnerLogos({
  title = 'Dipercaya Oleh',
  partners,
  className,
}: {
  title?: string;
  partners: { name: string; logo: string; url?: string }[];
  className?: string;
}) {
  return (
    <section className={cn('py-6', className)} aria-label={title}>
      <p className="mb-4 text-center text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {partners.map((partner, index) =>
          partner.url ? (
            <a
              key={index}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-8 w-auto object-contain"
              />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              src={partner.logo}
              alt={partner.name}
              className="h-8 w-auto object-contain opacity-60 grayscale"
            />
          )
        )}
      </div>
    </section>
  );
}

/**
 * Media Mentions - for press/media credibility
 */
export function MediaMentions({
  mentions,
  className,
}: {
  mentions: { source: string; logo?: string; quote?: string; url?: string }[];
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)} aria-label="Media Mentions">
      <h3 className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Diliput Oleh
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mentions.map((mention, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            {mention.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mention.logo}
                alt={mention.source}
                className="mb-2 h-6 w-auto object-contain"
              />
            )}
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {mention.source}
            </p>
            {mention.quote && (
              <p className="mt-1 text-sm italic text-slate-500 dark:text-slate-400">
                &quot;{mention.quote}&quot;
              </p>
            )}
            {mention.url && (
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-teal-600 hover:underline dark:text-teal-400"
              >
                Baca selengkapnya
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

