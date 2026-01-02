/**
 * Related Content Component
 * For internal linking and pillar-cluster SEO strategy
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { RelatedContentProps } from '@/lib/seo/types';

/**
 * Related Content List - simple text links
 */
export function RelatedContent({ title = 'Baca Juga', links, className }: RelatedContentProps) {
  if (links.length === 0) return null;

  return (
    <section
      className={cn(
        'rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      aria-label={title}
    >
      <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">{title}</h3>
      <nav aria-label="Related content">
        <ul className="space-y-2">
          {links.map((link, index) => (
            <li key={index}>
              <Link
                href={link.href}
                className="group flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
              >
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                <span className="underline-offset-2 group-hover:underline">{link.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

/**
 * Related Content Cards - with images
 */
export function RelatedContentCards({
  title = 'Artikel Terkait',
  items,
  className,
}: {
  title?: string;
  items: {
    title: string;
    href: string;
    description?: string;
    image?: string;
    category?: string;
  }[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className={cn('py-8', className)} aria-label={title}>
      <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="group rounded-lg border border-slate-200 bg-white overflow-hidden transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            {item.image && (
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-4">
              {item.category && (
                <span className="text-xs font-medium uppercase tracking-wide text-teal-600 dark:text-teal-400">
                  {item.category}
                </span>
              )}
              <h3 className="mt-1 font-medium text-slate-900 line-clamp-2 group-hover:text-teal-600 dark:text-white dark:group-hover:text-teal-400">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-1 text-sm text-slate-600 line-clamp-2 dark:text-slate-400">
                  {item.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Breadcrumb Navigation
 */
export function Breadcrumb({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav
      className={cn('flex items-center gap-1 text-sm', className)}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-white" aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Pillar Page Links - for topic clusters
 */
export function PillarPageLinks({
  pillar,
  clusters,
  className,
}: {
  pillar: { title: string; href: string };
  clusters: { title: string; href: string }[];
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-teal-200 bg-teal-50 p-6 dark:border-teal-800 dark:bg-teal-950/50',
        className
      )}
      aria-label="Topic cluster"
    >
      {/* Pillar Page */}
      <Link
        href={pillar.href}
        className="group flex items-center justify-between rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900"
      >
        <span className="font-semibold text-slate-900 dark:text-white">
          {pillar.title}
        </span>
        <ArrowRight className="h-5 w-5 text-teal-600 transition-transform group-hover:translate-x-1" />
      </Link>

      {/* Cluster Pages */}
      {clusters.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
            Topik Terkait
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {clusters.map((cluster, index) => (
              <li key={index}>
                <Link
                  href={cluster.href}
                  className="flex items-center gap-1 text-sm text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>{cluster.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/**
 * See Also Box - compact related links
 */
export function SeeAlso({
  links,
  className,
}: {
  links: { title: string; href: string }[];
  className?: string;
}) {
  if (links.length === 0) return null;

  return (
    <aside
      className={cn(
        'rounded border-l-4 border-teal-500 bg-teal-50 p-4 dark:bg-teal-950/50',
        className
      )}
    >
      <p className="text-sm font-medium text-teal-800 dark:text-teal-200">Lihat juga:</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              href={link.href}
              className="text-sm text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

