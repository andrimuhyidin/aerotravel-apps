/**
 * Split Bill Client Component
 * Displays split bill details with real-time payment tracking
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Check,
  Clock,
  Copy,
  Loader2,
  MapPin,
  Share2,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type Participant = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  payment_url: string | null;
};

type SplitBillData = {
  id: string;
  bookingId: string;
  creatorName: string;
  creatorPhone: string;
  totalAmount: number;
  splitCount: number;
  amountPerPerson: number;
  status: string;
  paidCount: number;
  expiresAt: string;
  remainingMs: number;
  isExpired: boolean;
  participants: Participant[];
  booking: {
    id: string;
    bookingCode: string;
    customerName: string;
    totalAmount: number;
    status: string;
    package: {
      name: string;
      destination: string;
      duration: string;
    } | null;
  } | null;
};

type SplitBillClientProps = {
  splitBillId: string;
  locale: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function CountdownTimer({ expiresAt, isExpired }: { expiresAt: string; isExpired: boolean }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (isExpired) {
      setTimeLeft('Waktu habis');
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Waktu habis');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isExpired]);

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-xl px-3 py-2',
      isExpired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
    )}>
      <Clock className="h-4 w-4" />
      <span className="font-mono text-sm font-semibold">{timeLeft}</span>
    </div>
  );
}

export function SplitBillClient({ splitBillId, locale }: SplitBillClientProps) {
  const [data, setData] = useState<SplitBillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/split-bill/${splitBillId}`);
      
      if (!response.ok) {
        throw new Error('Split bill not found');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      logger.error('Failed to fetch split bill', err);
      setError('Split bill tidak ditemukan');
    } finally {
      setLoading(false);
    }
  }, [splitBillId]);

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link berhasil disalin!');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Split Bill - ${data?.booking?.package?.name || 'Trip'}`,
          text: `Yuk bayar patungan trip kita! Total ${formatCurrency(data?.amountPerPerson || 0)}/orang`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">{error || 'Terjadi kesalahan'}</p>
        <Link href={`/${locale}`}>
          <Button variant="outline" className="mt-4">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    );
  }

  const progressPercent = (data.paidCount / data.splitCount) * 100;
  const paidAmount = data.paidCount * data.amountPerPerson;
  const remainingAmount = data.totalAmount - paidAmount;

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Split Bill</h1>
          <p className="text-xs text-muted-foreground">
            #{data.booking?.bookingCode}
          </p>
        </div>
        <CountdownTimer expiresAt={data.expiresAt} isExpired={data.isExpired} />
      </div>

      {/* Trip Info */}
      {data.booking?.package && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                🏝️
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{data.booking.package.name}</h2>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {data.booking.package.destination}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {data.booking.package.duration}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Progress Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {data.paidCount} dari {data.splitCount} sudah bayar
            </span>
            <Badge variant={data.status === 'completed' ? 'default' : 'secondary'}>
              {data.status === 'completed' ? 'Lunas' : 'Menunggu'}
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between text-xs">
            <span className="text-green-600">Terbayar: {formatCurrency(paidAmount)}</span>
            <span className="text-muted-foreground">Sisa: {formatCurrency(remainingAmount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Amount Per Person */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Nominal per orang</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(data.amountPerPerson)}
          </p>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Peserta ({data.splitCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.participants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                'flex items-center gap-3 rounded-xl p-3',
                participant.is_paid ? 'bg-green-50' : 'bg-muted/50'
              )}
            >
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold',
                participant.is_paid ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              )}>
                {participant.is_paid ? (
                  <Check className="h-5 w-5" />
                ) : (
                  participant.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{participant.name}</p>
                {participant.is_paid ? (
                  <p className="text-xs text-green-600">
                    Sudah bayar • {participant.paid_at && format(new Date(participant.paid_at), 'd MMM HH:mm', { locale: localeId })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Belum bayar</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatCurrency(participant.amount)}</p>
                {!participant.is_paid && participant.payment_url && (
                  <Link href={participant.payment_url}>
                    <Button size="sm" variant="outline" className="mt-1 h-7 text-xs">
                      <Wallet className="mr-1 h-3 w-3" />
                      Bayar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Share Section */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Bagikan ke teman</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopyLink}
            >
              <Copy className="mr-2 h-4 w-4" />
              Salin Link
            </Button>
            <Button
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Bagikan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Creator Info */}
      <div className="rounded-xl bg-muted/50 p-4 text-center">
        <p className="text-xs text-muted-foreground">Dibuat oleh</p>
        <p className="font-medium">{data.creatorName}</p>
        <a
          href={`tel:${data.creatorPhone}`}
          className="text-xs text-primary underline"
        >
          {data.creatorPhone}
        </a>
      </div>
    </div>
  );
}

