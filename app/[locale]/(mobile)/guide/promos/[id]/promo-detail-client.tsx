/**
 * Promo & Update Detail Client Component
 * Display full detail of a promo, update, or announcement
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Megaphone, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PromoDetailClientProps = {
  locale: string;
  promoId: string;
};

type PromoDetail = {
  id: string;
  type: 'promo' | 'update' | 'announcement';
  title: string;
  subtitle?: string;
  description?: string;
  link?: string;
  badge?: string;
  gradient?: string;
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
};

export function PromoDetailClient({ locale, promoId }: PromoDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch promo detail
  const {
    data: promoData,
    isLoading,
    error,
  } = useQuery<{ promo: PromoDetail & { isRead?: boolean } }>({
    queryKey: ['guide', 'promos', 'updates', promoId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/promos-updates/${promoId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Promo not found');
        }
        throw new Error('Failed to fetch promo');
      }
      return await res.json();
    },
    staleTime: 300000, // 5 minutes
  });

  const promo = promoData?.promo;

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/guide/promos-updates/${promoId}/read`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh read status
      void queryClient.invalidateQueries({ queryKey: ['guide', 'promos', 'updates', promoId] });
      void queryClient.invalidateQueries({ queryKey: ['guide', 'promos', 'updates', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['guide', 'promos', 'updates', 'widget'] });
      void queryClient.invalidateQueries({ queryKey: ['guide', 'notifications'] });
    },
  });

  // Auto-mark as read when promo is loaded and not yet read
  useEffect(() => {
    if (promo && !promo.isRead) {
      markReadMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promo?.id, promo?.isRead]);

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Tanggal tidak tersedia';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tanggal tidak valid';
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Tanggal tidak valid';
    }
  };

  // Format date short for display
  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return 'Tanggal tidak tersedia';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tanggal tidak valid';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Tanggal tidak valid';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Penting';
      case 'medium':
        return 'Sedang';
      case 'low':
        return 'Info';
      default:
        return 'Info';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promo':
        return Sparkles;
      case 'update':
      case 'announcement':
        return Megaphone;
      default:
        return Megaphone;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'promo':
        return 'Promo';
      case 'update':
        return 'Update';
      case 'announcement':
        return 'Pengumuman';
      default:
        return 'Info';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <ErrorState
          message={
            error instanceof Error && error.message === 'Promo not found'
              ? 'Promo tidak ditemukan'
              : 'Gagal memuat detail promo'
          }
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <EmptyState
          icon={Megaphone}
          title="Promo tidak ditemukan"
          description="Promo yang Anda cari tidak tersedia atau telah dihapus."
        />
      </div>
    );
  }

  const TypeIcon = getTypeIcon(promo.type);
  const gradientClass = promo.gradient || 'from-slate-500 to-slate-600';

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Button>

      {/* Promo Header Card */}
      <Card
        className={cn(
          'border-0 shadow-md overflow-hidden',
          `bg-gradient-to-br ${gradientClass}`,
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              {promo.badge && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold shadow-sm border border-white/10 mb-3">
                  <TypeIcon className="h-3.5 w-3.5" />
                  {promo.badge}
                </div>
              )}
              <h1 className="text-2xl font-bold leading-tight text-white mb-2">
                {promo.title}
              </h1>
              {promo.subtitle && (
                <p className="text-base font-medium text-white/90">
                  {promo.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border',
                getPriorityColor(promo.priority),
              )}
            >
              {getPriorityLabel(promo.priority)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/80">
              <TypeIcon className="h-3.5 w-3.5" />
              {getTypeLabel(promo.type)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Description Card */}
      {promo.description && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Detail
            </h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {promo.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Information Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Informasi Waktu
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-600 mb-1">
                  Tanggal Mulai
                </div>
                <div className="text-base text-slate-900">
                  {formatDate(promo.startDate)}
                </div>
              </div>
            </div>
            {promo.endDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-600 mb-1">
                    Tanggal Berakhir
                  </div>
                  <div className="text-base text-slate-900">
                    {formatDate(promo.endDate)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link Action */}
      {promo.link && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Link href={promo.link}>
              <Button className="w-full" size="lg">
                Lihat Lebih Lanjut
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

