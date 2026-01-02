/**
 * Travel Circle Detail Client Component
 * Shows circle details, members, and contribution history
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Loader2,
  MapPin,
  Settings,
  Share2,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type Member = {
  id: string;
  name: string;
  email: string | null;
  targetContribution: number;
  currentContribution: number;
  progress: number;
  status: string;
  isCurrentUser: boolean;
};

type Contribution = {
  id: string;
  memberName: string;
  amount: number;
  paymentMethod: string;
  contributedAt: string;
};

type CircleData = {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  contributionCount: number;
  status: string;
  progress: number;
  isAdmin: boolean;
  isMember: boolean;
  joinCode: string;
  package: {
    id: string;
    name: string;
    destination: string;
    slug: string;
    duration: string;
  } | null;
  members: Member[];
  recentContributions: Contribution[];
};

type TravelCircleDetailClientProps = {
  circleId: string;
  locale: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function TravelCircleDetailClient({ circleId, locale }: TravelCircleDetailClientProps) {
  const [data, setData] = useState<CircleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/travel-circle/${circleId}`);
      if (!response.ok) {
        throw new Error('Circle not found');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      logger.error('Failed to fetch circle', err);
      setError('Circle tidak ditemukan');
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyCode = async () => {
    if (data?.joinCode) {
      await navigator.clipboard.writeText(data.joinCode);
      toast.success('Kode berhasil disalin!');
    }
  };

  const handleShare = async () => {
    if (navigator.share && data) {
      try {
        await navigator.share({
          title: `Join ${data.name}`,
          text: `Yuk gabung Travel Circle "${data.name}"! Kode: ${data.joinCode}`,
          url: window.location.href,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleContribute = async () => {
    const amount = Number(contributionAmount);
    if (!amount || amount <= 0) {
      toast.error('Masukkan nominal yang valid');
      return;
    }

    setContributing(true);
    try {
      const response = await fetch(`/api/public/travel-circle/${circleId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: 'transfer',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to contribute');
      }

      toast.success('Kontribusi berhasil!');
      setContributeOpen(false);
      setContributionAmount('');
      fetchData();
    } catch (error) {
      logger.error('Failed to contribute', error);
      toast.error('Gagal melakukan kontribusi');
    } finally {
      setContributing(false);
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
        <p className="text-muted-foreground">{error}</p>
        <Link href={`/${locale}/travel-circle`}>
          <Button variant="outline" className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  const currentMember = data.members.find((m) => m.isCurrentUser);
  const remainingContribution = currentMember 
    ? currentMember.targetContribution - currentMember.currentContribution 
    : 0;

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/travel-circle`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">{data.name}</h1>
          <p className="text-xs text-muted-foreground">
            Kode: {data.joinCode}
          </p>
        </div>
        {data.isAdmin && (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Package Info */}
      {data.package && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                🏝️
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-sm">{data.package.name}</h2>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {data.package.destination}
                  </span>
                  <span>{data.package.duration}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Progress Dana</CardTitle>
            <Badge variant={data.status === 'completed' ? 'default' : 'secondary'}>
              {data.status === 'completed' ? 'Tercapai!' : 'Berjalan'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-2xl font-bold text-primary">
              {data.progress.toFixed(0)}%
            </span>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(data.currentAmount)}</p>
              <p className="text-xs text-muted-foreground">
                dari {formatCurrency(data.targetAmount)}
              </p>
            </div>
          </div>
          <Progress value={data.progress} className="h-3" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Target: {format(new Date(data.targetDate), 'd MMMM yyyy', { locale: localeId })}
          </div>
        </CardContent>
      </Card>

      {/* My Contribution */}
      {data.isMember && currentMember && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Kontribusi Anda</p>
                <p className="text-lg font-bold">{formatCurrency(currentMember.currentContribution)}</p>
                <p className="text-xs text-muted-foreground">
                  Target: {formatCurrency(currentMember.targetContribution)}
                </p>
              </div>
              <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
                <DialogTrigger asChild>
                  <Button disabled={remainingContribution <= 0}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Setor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Setor Kontribusi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nominal</Label>
                      <Input
                        type="number"
                        placeholder={remainingContribution.toString()}
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sisa target: {formatCurrency(remainingContribution)}
                      </p>
                    </div>
                    <Button onClick={handleContribute} disabled={contributing} className="w-full">
                      {contributing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Bayar Sekarang
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Progress value={currentMember.progress} className="mt-3 h-2" />
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Anggota ({data.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.members.map((member) => (
            <div
              key={member.id}
              className={cn(
                'flex items-center gap-3 rounded-xl p-3',
                member.status === 'completed' ? 'bg-green-50' : 'bg-muted/50'
              )}
            >
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold',
                member.status === 'completed' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              )}>
                {member.status === 'completed' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{member.name}</p>
                  {member.isCurrentUser && (
                    <Badge variant="outline" className="text-[10px]">Anda</Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={member.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {member.progress.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold">{formatCurrency(member.currentContribution)}</p>
                <p className="text-[10px] text-muted-foreground">
                  / {formatCurrency(member.targetContribution)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Contributions */}
      {data.recentContributions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kontribusi Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentContributions.map((contribution) => (
              <div key={contribution.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{contribution.memberName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(contribution.contributedAt), 'd MMM, HH:mm', { locale: localeId })}
                  </p>
                </div>
                <span className="font-semibold text-green-600">
                  +{formatCurrency(contribution.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Share Section */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Ajak Teman Bergabung</p>
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted p-3">
            <code className="flex-1 text-center font-mono text-lg font-bold tracking-widest">
              {data.joinCode}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCopyCode}>
              <Copy className="mr-2 h-4 w-4" />
              Salin Kode
            </Button>
            <Button className="flex-1" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Bagikan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

