'use client';

/**
 * Trip Summary Section
 * Display payment status, customer reviews, and trip statistics after trip completion
 */

import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type TripSummarySectionProps = {
  tripId: string;
  locale: string;
};

type PaymentStatusResponse = {
  paymentStatus: 'paid' | 'pending' | 'processing' | 'not_processed';
  feeAmount: number;
  transactionId?: string;
  paidAt?: string;
  paymentMethod?: string;
  walletTransaction?: {
    id: string;
    amount: number;
    balanceAfter: number;
    createdAt: string;
    description: string;
  };
};

type Review = {
  id: string;
  bookingId: string;
  reviewerName: string;
  guideRating: number | null;
  overallRating: number;
  reviewText: string | null;
  createdAt: string;
};

type RatingsResponse = {
  reviews: Review[];
  summary: {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: {
      '5': number;
      '4': number;
      '3': number;
      '2': number;
      '1': number;
    };
    recentAverageRating?: number;
    trend?: 'up' | 'down' | 'stable';
  };
};

/**
 * Payment Status Card Component
 */
function PaymentStatusCard({
  paymentData,
  locale,
  tripId,
}: {
  paymentData?: PaymentStatusResponse;
  locale: string;
  tripId: string;
}) {
  if (!paymentData) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <LoadingState message="Memuat status pembayaran..." variant="skeleton" />
        </CardContent>
      </Card>
    );
  }

  const { paymentStatus, feeAmount, paidAt, walletTransaction } = paymentData;

  const statusConfig = {
    paid: {
      label: 'Lunas',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    pending: {
      label: 'Menunggu Pembayaran',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-600',
    },
    processing: {
      label: 'Sedang Diproses',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Clock,
      iconColor: 'text-blue-600',
    },
    not_processed: {
      label: 'Belum Diproses',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Clock,
      iconColor: 'text-slate-600',
    },
  };

  const config = statusConfig[paymentStatus];
  const StatusIcon = config.icon;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          Status Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Fee Trip</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              Rp {feeAmount.toLocaleString('id-ID')}
            </p>
          </div>
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5',
              config.color
            )}
          >
            <StatusIcon className={cn('h-4 w-4', config.iconColor)} />
            <span className="text-xs font-semibold">{config.label}</span>
          </div>
        </div>

        {paidAt && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            <span>
              Dibayar pada{' '}
              {new Date(paidAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        {paymentStatus === 'paid' && walletTransaction && (
          <div className="rounded-lg bg-emerald-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-900">Detail Transaksi</p>
            <div className="space-y-1 text-xs text-emerald-700">
              <div className="flex justify-between">
                <span>Saldo setelah:</span>
                <span className="font-medium">
                  Rp {walletTransaction.balanceAfter.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-xs opacity-75">{walletTransaction.description}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {paymentStatus === 'paid' ? (
            <Link href={`/${locale}/guide/wallet`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <Wallet className="mr-2 h-4 w-4" />
                Lihat di Wallet
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          ) : (
            <Link href={`/${locale}/guide/wallet/pending`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <Clock className="mr-2 h-4 w-4" />
                Lihat Pending Earnings
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Customer Reviews Card Component
 */
function CustomerReviewsCard({
  ratingsData,
  locale,
  tripId,
}: {
  ratingsData?: RatingsResponse;
  locale: string;
  tripId: string;
}) {
  if (!ratingsData) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <LoadingState message="Memuat ulasan..." variant="skeleton" />
        </CardContent>
      </Card>
    );
  }

  const { reviews, summary } = ratingsData;
  const avgRating = summary.averageRating;
  const totalRatings = summary.totalRatings;
  const latestReviews = reviews.slice(0, 2);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-5 w-5 text-amber-600" />
          Ulasan Customer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalRatings === 0 ? (
          <EmptyState
            icon={Star}
            title="Belum ada ulasan"
            description="Ulasan dari customer akan muncul di sini setelah mereka memberikan rating"
            variant="subtle"
          />
        ) : (
          <>
            {/* Rating Summary */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                  <span className="text-3xl font-bold text-slate-900">{avgRating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{totalRatings} ulasan</p>
              </div>
              <div className="flex-1">
                {/* Rating Distribution */}
                <div className="space-y-1">
                  {(['5', '4', '3', '2', '1'] as const).map((star) => {
                    const count = summary.ratingDistribution[star];
                    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-3">{star}</span>
                        <Star className="h-3 w-3 text-amber-400" />
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Latest Reviews Preview */}
            {latestReviews.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                {latestReviews.map((review) => (
                  <div key={review.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-slate-900">
                        {review.reviewerName}
                      </p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-3 w-3',
                              i < (review.guideRating || review.overallRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {review.reviewText && (
                      <p className="text-xs text-slate-600 line-clamp-2">{review.reviewText}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Link to Full Ratings */}
            <Link href={`/${locale}/guide/ratings`}>
              <Button variant="outline" className="w-full" size="sm">
                Lihat Semua Ulasan
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Trip Statistics Card Component
 */
function TripStatisticsCard({
  tripId,
  locale: _locale,
}: {
  tripId: string;
  locale: string;
}) {
  // Fetch trip info untuk statistics
  const { data: tripInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['guide', 'trip', 'info', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/preload`);
      if (!res.ok) return null;
      return (await res.json()) as {
        trip?: {
          trip_code?: string | null;
          trip_date?: string | null;
          package?: { name?: string | null } | null;
        };
        manifest?: Array<{
          id: string;
          name: string;
          phone?: string;
          type: 'adult' | 'child' | 'infant';
          status: 'pending' | 'boarded' | 'returned';
        }>;
        expenses?: Array<{
          amount: number;
        }>;
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <LoadingState message="Memuat statistik trip..." variant="skeleton" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <ErrorState
            message="Gagal memuat statistik trip"
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const manifestArray = tripInfo?.manifest || [];
  const expenses = tripInfo?.expenses || [];
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  // Calculate stats from manifest array (with safe property access)
  const totalPax = manifestArray.length;
  const boardedCount = manifestArray.filter((p) => 
    p && ('status' in p) && (p.status === 'boarded' || p.status === 'returned')
  ).length;
  const returnedCount = manifestArray.filter((p) => 
    p && ('status' in p) && p.status === 'returned'
  ).length;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Ringkasan Trip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Total Passengers */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Users className="h-4 w-4" />
              <span>Total Tamu</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{totalPax}</p>
            <p className="text-xs text-slate-500">
              {boardedCount} boarded • {returnedCount} returned
            </p>
          </div>

          {/* Total Expenses */}
          {totalExpenses > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <DollarSign className="h-4 w-4" />
                <span>Total Pengeluaran</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                Rp {totalExpenses.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-slate-500">{expenses.length} item</p>
            </div>
          )}

          {/* Trip Date */}
          {tripInfo?.trip?.trip_date && (
            <div className="space-y-1 col-span-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>Tanggal Trip</span>
              </div>
              <p className="text-sm font-medium text-slate-900">
                {tripInfo?.trip?.trip_date ? (() => {
                  try {
                    const date = new Date(tripInfo.trip.trip_date);
                    if (isNaN(date.getTime())) return 'N/A';
                    return date.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });
                  } catch {
                    return 'N/A';
                  }
                })() : 'N/A'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main Trip Summary Section Component
 */
export function TripSummarySection({ tripId, locale }: TripSummarySectionProps) {
  // Fetch payment status
  const {
    data: paymentData,
    error: paymentError,
    refetch: refetchPayment,
  } = useQuery<PaymentStatusResponse>({
    queryKey: queryKeys.guide.trips.paymentStatus(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/payment-status`);
      if (!res.ok) throw new Error('Failed to fetch payment status');
      return res.json();
    },
  });

  // Fetch ratings for this trip
  const {
    data: ratingsData,
    error: ratingsError,
  } = useQuery<RatingsResponse>({
    queryKey: queryKeys.guide.ratings.byTrip(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/ratings?trip_id=${tripId}`);
      if (!res.ok) throw new Error('Failed to fetch ratings');
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      {/* Payment Status Card */}
      {paymentError ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <ErrorState
              message="Gagal memuat status pembayaran"
              onRetry={() => void refetchPayment()}
              variant="card"
            />
          </CardContent>
        </Card>
      ) : (
        <PaymentStatusCard paymentData={paymentData} locale={locale} tripId={tripId} />
      )}

      {/* Customer Reviews Card */}
      {ratingsError ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <EmptyState
              icon={Star}
              title="Ulasan tidak tersedia"
              description="Tidak dapat memuat ulasan untuk trip ini"
              variant="subtle"
            />
          </CardContent>
        </Card>
      ) : (
        <CustomerReviewsCard ratingsData={ratingsData} locale={locale} tripId={tripId} />
      )}

      {/* Trip Statistics Card */}
      <TripStatisticsCard tripId={tripId} locale={locale} />
    </div>
  );
}

