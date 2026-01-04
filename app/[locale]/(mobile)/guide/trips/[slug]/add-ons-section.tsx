'use client';

/**
 * Add-ons Section Component
 * Menampilkan add-ons yang dipesan untuk trip (selalu ditampilkan walaupun kosong)
 */

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type AddOnsSectionProps = {
  tripId: string;
  locale: string;
};

export function AddOnsSection({ tripId, locale: _locale }: AddOnsSectionProps) {
  const { data, isLoading } = useQuery<{
    addOns: Array<{ name: string; quantity?: number; description?: string }>;
  }>({
    queryKey: ['guide', 'trip-package-info', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/package-info`);
      if (!res.ok) throw new Error('Failed to fetch add-ons');
      const data = await res.json();
      return {
        addOns: data.addOns || [],
      };
    },
    staleTime: 300000,
  });

  const addOns = data?.addOns || [];
  const hasAddOns = addOns && addOns.length > 0;

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Plus className="h-5 w-5 text-blue-600" />
            Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Plus className="h-5 w-5 text-blue-600" />
          Add-ons
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAddOns ? (
          <div className="space-y-3">
            {addOns.map((addon, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-white p-3"
              >
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Plus className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{addon.name}</span>
                    {addon.quantity && addon.quantity > 1 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {addon.quantity}x
                      </span>
                    )}
                  </div>
                  {addon.description && (
                    <p className="mt-1 text-xs text-slate-600">{addon.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-500">
              Belum ada add-ons yang dipesan untuk trip ini.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
