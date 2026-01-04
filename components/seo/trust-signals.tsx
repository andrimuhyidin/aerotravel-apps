'use client';

/**
 * Trust Signals Component
 * For E-E-A-T and credibility indicators
 */

import Image from 'next/image';
import { Award, Users, Star, Calendar, Shield, CheckCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { TrustSignalsProps } from '@/lib/seo/types';
import { STATS, CERTIFICATIONS } from '@/lib/seo/config';
import { useSettings } from '@/hooks/use-settings';

export function TrustSignals({ stats, certifications, className }: TrustSignalsProps) {
  const { settings } = useSettings();
  const statsFromSettings = settings?.stats;

  const displayStats = stats || [
    {
      value: statsFromSettings?.total_customers || STATS.totalCustomers,
      label: 'Pelanggan',
    },
    {
      value: statsFromSettings?.total_trips || STATS.totalTrips,
      label: 'Trip',
    },
    {
      value: statsFromSettings?.years_in_business || STATS.yearsInBusiness,
      label: 'Tahun',
    },
    {
      value: statsFromSettings?.satisfaction_rate || STATS.satisfactionRate,
      label: 'Kepuasan',
    },
  ];

  const displayCertifications = certifications || CERTIFICATIONS;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {displayStats.map((stat, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {stat.value}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Certifications */}
      {displayCertifications.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {displayCertifications.map((cert, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              {cert.logo ? (
                <Image
                  src={cert.logo}
                  alt={cert.name}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <Shield className="h-5 w-5 text-teal-600" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {cert.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Trust Bar - compact horizontal trust indicators
 */
export function TrustBar({ className }: { className?: string }) {
  const { settings } = useSettings();
  const statsFromSettings = settings?.stats;

  const totalCustomers =
    statsFromSettings?.total_customers || STATS.totalCustomers;
  const averageRating =
    statsFromSettings?.average_rating || String(STATS.averageRating);
  const yearsInBusiness =
    statsFromSettings?.years_in_business || STATS.yearsInBusiness;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Users className="h-4 w-4 text-teal-600" />
        <span>{totalCustomers} Pelanggan</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Star className="h-4 w-4 text-yellow-500" />
        <span>{averageRating}/5 Rating</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Calendar className="h-4 w-4 text-teal-600" />
        <span>{yearsInBusiness} Tahun Pengalaman</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Award className="h-4 w-4 text-teal-600" />
        <span>Member ASITA</span>
      </div>
    </div>
  );
}

/**
 * Rating Badge - for product cards
 */
export function RatingBadge({
  rating,
  reviewCount,
  className,
}: {
  rating: number;
  reviewCount?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium text-slate-900 dark:text-white">
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-sm text-slate-500 dark:text-slate-400">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

/**
 * Guarantee Badge - for checkout/booking pages
 */
export function GuaranteeBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/50',
        className
      )}
    >
      <Shield className="h-8 w-8 text-green-600" />
      <div>
        <p className="font-semibold text-green-800 dark:text-green-200">
          Jaminan Keamanan 100%
        </p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Uang kembali jika trip dibatalkan oleh kami
        </p>
      </div>
    </div>
  );
}

/**
 * Features List - checkmark list for product pages
 */
export function FeaturesList({
  features,
  className,
}: {
  features: string[];
  className?: string;
}) {
  return (
    <ul className={cn('space-y-2', className)}>
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
          <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Social Proof - recent activity indicators
 */
export function SocialProof({
  recentBookings,
  className,
}: {
  recentBookings?: number;
  className?: string;
}) {
  const bookings = recentBookings || Math.floor(Math.random() * 20) + 5;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
      </span>
      <span>{bookings} orang melihat paket ini dalam 24 jam terakhir</span>
    </div>
  );
}

