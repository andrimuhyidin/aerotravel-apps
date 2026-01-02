/**
 * Author Bio Component
 * For E-E-A-T SEO signals
 */

import Image from 'next/image';
import { Linkedin, Twitter, Mail, BadgeCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AuthorBioProps } from '@/lib/seo/types';
import { generateAuthorSchema } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/seo/json-ld';

export function AuthorBio({
  name,
  role,
  image,
  bio,
  linkedIn,
  twitter,
  email,
  verified = false,
  className,
}: AuthorBioProps) {
  const authorSchema = generateAuthorSchema({
    name,
    jobTitle: role,
    description: bio,
    image,
    sameAs: [linkedIn, twitter].filter(Boolean) as string[],
    worksFor: {
      name: 'MyAeroTravel',
      url: 'https://aerotravel.co.id',
    },
  });

  return (
    <div
      className={cn(
        'flex gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      itemScope
      itemType="https://schema.org/Person"
    >
      <JsonLd data={authorSchema} />

      {/* Author Image */}
      <div className="flex-shrink-0">
        {image ? (
          <Image
            src={image}
            alt={name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
            itemProp="image"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Author Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-slate-900 dark:text-white" itemProp="name">
            {name}
          </h4>
          {verified && (
            <BadgeCheck className="h-4 w-4 text-blue-500" aria-label="Verified" />
          )}
        </div>

        <p
          className="text-sm text-slate-600 dark:text-slate-400"
          itemProp="jobTitle"
        >
          {role}
        </p>

        {bio && (
          <p
            className="mt-2 text-sm text-slate-600 line-clamp-2 dark:text-slate-400"
            itemProp="description"
          >
            {bio}
          </p>
        )}

        {/* Social Links */}
        <div className="mt-3 flex items-center gap-3">
          {linkedIn && (
            <a
              href={linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400"
              aria-label={`LinkedIn ${name}`}
              itemProp="sameAs"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {twitter && (
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 transition-colors hover:text-sky-500 dark:text-slate-400"
              aria-label={`Twitter ${name}`}
              itemProp="sameAs"
            >
              <Twitter className="h-4 w-4" />
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-slate-500 transition-colors hover:text-teal-600 dark:text-slate-400"
              aria-label={`Email ${name}`}
              itemProp="email"
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Author Card - for article bylines
 */
export function AuthorByline({
  name,
  role,
  image,
  date,
  className,
}: {
  name: string;
  role?: string;
  image?: string;
  date?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {image ? (
        <Image
          src={image}
          alt={name}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
          {name.charAt(0)}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {role}
          {date && role && ' · '}
          {date}
        </p>
      </div>
    </div>
  );
}

/**
 * Author Card - for team pages
 */
export function AuthorCard({
  name,
  role,
  image,
  bio,
  linkedIn,
  twitter,
  verified,
  className,
}: AuthorBioProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900',
        className
      )}
    >
      {/* Author Image */}
      <div className="mx-auto mb-4">
        {image ? (
          <Image
            src={image}
            alt={name}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover mx-auto"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-100 text-3xl font-semibold text-teal-700 mx-auto dark:bg-teal-900 dark:text-teal-300">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Name with verification badge */}
      <div className="flex items-center justify-center gap-1">
        <h3 className="font-semibold text-slate-900 dark:text-white">{name}</h3>
        {verified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">{role}</p>

      {bio && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-3 dark:text-slate-400">
          {bio}
        </p>
      )}

      {/* Social Links */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {linkedIn && (
          <a
            href={linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 transition-colors hover:text-blue-600"
            aria-label={`LinkedIn ${name}`}
          >
            <Linkedin className="h-5 w-5" />
          </a>
        )}
        {twitter && (
          <a
            href={twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 transition-colors hover:text-sky-500"
            aria-label={`Twitter ${name}`}
          >
            <Twitter className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}

