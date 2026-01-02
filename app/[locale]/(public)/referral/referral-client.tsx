/**
 * Referral Page Client Component
 * Member-Get-Member referral program UI
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowRight,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Gift,
  Loader2,
  MessageCircle,
  Share2,
  Twitter,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

type ReferralCodeResponse = {
  code: string;
  totalReferrals: number;
  totalBookings: number;
  totalCommission: number;
  isActive: boolean;
  shareLinks: {
    whatsapp: string;
    twitter: string;
    text: string;
  };
};

type ReferralStatsResponse = {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  totalPointsValue: number;
  referrals: Array<{
    id: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    pointsEarned: number;
  }>;
};

type ReferralClientProps = {
  locale: string;
};

export function ReferralClient({ locale }: ReferralClientProps) {
  const [copied, setCopied] = useState(false);

  // Fetch referral code
  const {
    data: codeData,
    isLoading: codeLoading,
    error: codeError,
  } = useQuery<ReferralCodeResponse>({
    queryKey: ['referral', 'code'],
    queryFn: async () => {
      const response = await apiClient.get('/api/user/referral/code');
      return response.data as ReferralCodeResponse;
    },
  });

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } =
    useQuery<ReferralStatsResponse>({
      queryKey: ['referral', 'stats'],
      queryFn: async () => {
        const response = await apiClient.get('/api/user/referral/stats');
        return response.data as ReferralStatsResponse;
      },
      enabled: !!codeData,
    });

  const handleCopyCode = async () => {
    if (!codeData?.code) return;

    try {
      await navigator.clipboard.writeText(codeData.code);
      setCopied(true);
      toast.success('Kode referral disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin kode');
    }
  };

  const handleShare = async () => {
    if (!codeData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kode Referral Aero Travel',
          text: codeData.shareLinks.text,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyCode();
    }
  };

  if (codeError) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground mb-4">
          Silakan login untuk mengakses program referral
        </p>
        <Button asChild>
          <Link href={`/${locale}/auth/login?redirect=/referral`}>Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Share Card */}
      <Card className="border-none bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white shadow-xl overflow-hidden">
        <CardContent className="pt-6 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-white" />
            <div className="absolute bottom-4 left-4 h-32 w-32 rounded-full bg-white" />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-4">
              <div className="h-14 w-14 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                <Gift className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold">Ajak Teman, Dapat Bonus!</h2>
              <p className="text-sm opacity-90">
                Dapat 10,000 poin untuk setiap teman yang booking
              </p>
            </div>

            {/* Referral Code */}
            <div className="bg-white rounded-xl p-4 mb-4">
              {codeLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Kode Referral Anda</p>
                    <p className="text-2xl font-bold text-foreground tracking-wide">
                      {codeData?.code}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="h-10 w-10 shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={codeData?.shareLinks.whatsapp || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={codeData?.shareLinks.twitter || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-black/80 hover:bg-black rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
              <Button
                variant="secondary"
                onClick={handleShare}
                className="rounded-xl"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Bagikan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cara Kerja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 font-bold text-blue-600">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Bagikan Kode Anda</p>
                <p className="text-xs text-muted-foreground">
                  Salin dan bagikan kode referral ke teman-teman Anda
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 font-bold text-green-600">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Teman Mendaftar & Booking</p>
                <p className="text-xs text-muted-foreground">
                  Teman dapat diskon Rp 50.000 untuk booking pertama
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 font-bold text-amber-600">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Anda Dapat Bonus</p>
                <p className="text-xs text-muted-foreground">
                  Setelah trip teman selesai, Anda dapat 10.000 poin
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Statistik Referral
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {statsData?.totalReferrals || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Referral</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {statsData?.successfulReferrals || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Berhasil</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {(statsData?.totalPointsEarned || 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-muted-foreground">Poin Didapat</p>
                </div>
              </div>

              {/* Referral History */}
              {statsData?.referrals && statsData.referrals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Riwayat Referral
                  </p>
                  {statsData.referrals.slice(0, 5).map((ref) => (
                    <div
                      key={ref.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {ref.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {ref.status === 'completed' ? 'Selesai' : 'Menunggu'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ref.createdAt), 'd MMM yyyy', {
                              locale: id,
                            })}
                          </p>
                        </div>
                      </div>
                      {ref.pointsEarned > 0 && (
                        <p className="text-sm font-bold text-green-600">
                          +{ref.pointsEarned.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(!statsData?.referrals || statsData.referrals.length === 0) && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Belum ada referral. Mulai ajak teman sekarang!
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="py-6 text-center">
          <p className="font-medium mb-2">
            Punya teman yang suka traveling?
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Bagikan kode referral dan nikmati bonus bersama!
          </p>
          <Button onClick={handleShare} className="w-full">
            Bagikan Sekarang
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

