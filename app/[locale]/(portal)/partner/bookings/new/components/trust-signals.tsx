/**
 * Trust Signals Component
 * Displays trust-building elements like ratings, bookings today, commission
 */

'use client';

import { Star, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/partner/package-utils';

type TrustSignalsProps = {
  ratings?: {
    average: number;
    count: number;
  };
  bookingCountToday?: number;
  commission?: number;
};

export function TrustSignals({
  ratings,
  bookingCountToday = 0,
  commission = 0,
}: TrustSignalsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Ratings */}
      {ratings && ratings.count > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-bold text-yellow-800">{ratings.average.toFixed(1)}</span>
          </div>
          <p className="text-[10px] text-yellow-700">{ratings.count} ulasan</p>
        </div>
      )}

      {/* Bookings Today */}
      {bookingCountToday > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-blue-800">{bookingCountToday}</span>
          </div>
          <p className="text-[10px] text-blue-700">booking hari ini</p>
        </div>
      )}

      {/* Commission */}
      {commission > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-bold text-green-800 text-xs">
              {formatCurrency(commission)}
            </span>
          </div>
          <p className="text-[10px] text-green-700">komisi/pax</p>
        </div>
      )}
    </div>
  );
}
