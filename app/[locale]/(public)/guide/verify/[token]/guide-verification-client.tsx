/**
 * Guide Verification Client
 * Public page to verify guide ID card
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, MapPin, Star, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';

type VerificationData = {
  verified: boolean;
  guide_info?: {
    name: string;
    photo?: string;
    card_number: string;
    status: string;
    expiry_date: string;
    branch_name: string;
    verified_badge: boolean;
    ratings_summary: {
      average_rating: number;
      total_ratings: number;
    };
  };
  status?: string;
  message?: string;
};

type GuideVerificationClientProps = {
  token: string;
  locale: string;
};

export function GuideVerificationClient({ token, locale }: GuideVerificationClientProps) {
  const { data, isLoading, error } = useQuery<VerificationData>({
    queryKey: ['guide-verification', token],
    queryFn: async () => {
      const res = await fetch(`/api/public/guide/verify/${token}`);
      if (!res.ok) {
        const error = await res.json();
        return error;
      }
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return <LoadingState message="Memverifikasi ID Card..." />;
  }

  if (error || !data) {
    return <ErrorState message="Gagal memverifikasi ID Card" />;
  }

  if (!data.verified) {
    return (
      <div className="py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <XCircle className="h-16 w-16 text-red-600" />
              <div>
                <h2 className="text-xl font-bold text-red-900">ID Card Tidak Valid</h2>
                <p className="mt-2 text-sm text-red-700">
                  {data.message || 'ID Card tidak dapat diverifikasi atau telah kedaluwarsa'}
                </p>
                {data.status && (
                  <p className="mt-1 text-xs text-red-600">Status: {data.status}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { guide_info } = data;
  const expiryDate = new Date(guide_info!.expiry_date);
  const isExpired = expiryDate < new Date();

  return (
    <div className="py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Verification Badge */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="rounded-full bg-emerald-600 p-3">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-900">ID Card Terverifikasi</h2>
                <p className="mt-1 text-sm text-emerald-700">
                  Guide AeroTravel yang terverifikasi dan aktif
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guide Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo & Name */}
            <div className="flex items-center gap-4">
              {guide_info!.photo ? (
                <img
                  src={guide_info!.photo}
                  alt={guide_info!.name}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">
                  {guide_info!.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900">{guide_info!.name}</h3>
                <p className="text-sm text-slate-500">AeroTravel Guide</p>
              </div>
            </div>

            {/* Card Number */}
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Nomor Kartu</p>
              <p className="text-lg font-bold text-emerald-600">{guide_info!.card_number}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Cabang</p>
                  <p className="text-sm font-medium text-slate-900">{guide_info!.branch_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Kedaluwarsa</p>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isExpired ? 'text-red-600' : 'text-slate-900'
                    )}
                  >
                    {expiryDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Ratings */}
              {guide_info!.ratings_summary.total_ratings > 0 && (
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="text-xs text-slate-500">Rating</p>
                    <p className="text-sm font-medium text-slate-900">
                      ⭐ {guide_info!.ratings_summary.average_rating.toFixed(1)} (
                      {guide_info!.ratings_summary.total_ratings} review)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-900">
                Status: {guide_info!.status === 'active' ? 'Aktif' : guide_info!.status}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Diverifikasi oleh AeroTravel • {new Date().toLocaleDateString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
