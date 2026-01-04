/**
 * Dashboard Skeleton - Loading state untuk dashboard
 * Shimmer loading pattern untuk better perceived performance
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <section className="bg-gradient-to-br from-primary via-primary to-blue-700 px-4 pb-6 pt-4">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="mb-2 h-8 w-48 bg-white/20" />
            <Skeleton className="h-4 w-36 bg-white/20" />
          </div>
          <Skeleton className="h-9 w-9 rounded-md bg-white/20" />
        </div>
        
        <Skeleton className="mb-4 h-14 w-full rounded-xl bg-white/20" />
        <Skeleton className="h-12 w-full rounded-xl bg-white/20" />
      </section>

      {/* Main Content Skeleton */}
      <div className="space-y-6 px-4 py-6">
        {/* Featured Packages */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="w-64 flex-shrink-0">
                <Skeleton className="h-36 w-full rounded-t-xl" />
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-10 w-full" />
                  <div className="mb-3 space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Active Orders */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </section>

        {/* Monthly Performance */}
        <section>
          <Skeleton className="mb-3 h-7 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </section>

        {/* Recent Bookings */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

