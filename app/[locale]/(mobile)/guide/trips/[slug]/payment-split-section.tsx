'use client';

/**
 * Payment Split Section
 * Display payment split calculation (60% lead / 40% support)
 */

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type PaymentSplitSectionProps = {
  tripId: string;
  locale: string;
};

type SplitEntry = {
  id: string;
  guide_id: string;
  role: 'lead' | 'support';
  fee_amount: number;
  split_percentage: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  guide?: {
    id: string;
    full_name: string;
  };
};

export function PaymentSplitSection({ tripId, locale: _locale }: PaymentSplitSectionProps) {
  const { data: splitData, isLoading } = useQuery<{ split: SplitEntry[]; total: number }>({
    queryKey: queryKeys.guide.trips.paymentSplit(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/payment-split`);
      if (!res.ok) throw new Error('Failed to fetch payment split');
      return res.json();
    },
  });

  if (isLoading) {
    return <LoadingState message="Memuat payment split..." />;
  }

  const split = splitData?.split || [];
  const total = splitData?.total || 0;

  if (split.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Belum ada payment split"
        description="Payment split akan dihitung setelah trip selesai"
      />
    );
  }

  const leadGuides = split.filter((s) => s.role === 'lead');
  const supportGuides = split.filter((s) => s.role === 'support');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Payment Split</h3>
        <p className="text-sm text-slate-600">Pembagian fee untuk multi-guide trip</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5" />
            Total Fee: Rp {total.toLocaleString('id-ID')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lead Guides (60%) */}
          {leadGuides.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Lead Guide ({leadGuides.length})
                </span>
                <span className="text-xs text-slate-500">60% dari total</span>
              </div>
              <div className="space-y-2">
                {leadGuides.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {entry.guide?.full_name || 'Unknown Guide'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.split_percentage.toFixed(2)}% per guide
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        Rp {entry.fee_amount.toLocaleString('id-ID')}
                      </p>
                      <span
                        className={cn(
                          'text-xs',
                          entry.payment_status === 'paid' && 'text-emerald-600',
                          entry.payment_status === 'pending' && 'text-amber-600',
                          entry.payment_status === 'cancelled' && 'text-red-600',
                        )}
                      >
                        {entry.payment_status === 'paid' && 'Lunas'}
                        {entry.payment_status === 'pending' && 'Pending'}
                        {entry.payment_status === 'cancelled' && 'Dibatalkan'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Guides (40%) */}
          {supportGuides.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Support Guide ({supportGuides.length})
                </span>
                <span className="text-xs text-slate-500">40% dari total</span>
              </div>
              <div className="space-y-2">
                {supportGuides.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {entry.guide?.full_name || 'Unknown Guide'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.split_percentage.toFixed(2)}% per guide
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        Rp {entry.fee_amount.toLocaleString('id-ID')}
                      </p>
                      <span
                        className={cn(
                          'text-xs',
                          entry.payment_status === 'paid' && 'text-emerald-600',
                          entry.payment_status === 'pending' && 'text-amber-600',
                          entry.payment_status === 'cancelled' && 'text-red-600',
                        )}
                      >
                        {entry.payment_status === 'paid' && 'Lunas'}
                        {entry.payment_status === 'pending' && 'Pending'}
                        {entry.payment_status === 'cancelled' && 'Dibatalkan'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
