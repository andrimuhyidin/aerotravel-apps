/**
 * Travel Circle Detail Client Component
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Target, Users, Calendar, TrendingUp, Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { ContributionTracker } from '@/components/partner/contribution-tracker';
import { Badge } from '@/components/ui/badge';

type TravelCircleDetail = {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  packageId?: string;
  preferredDestination?: string;
  status: 'active' | 'completed' | 'cancelled';
  currentAmount: number;
  contributionCount: number;
  createdBy: string;
  createdAt: string;
  members: Array<{
    id: string;
    memberName: string;
    memberEmail?: string;
    memberPhone?: string;
    targetContribution: number;
    currentContribution: number;
    status: string;
    joinedAt: string;
  }>;
  contributions: Array<{
    id: string;
    memberName: string;
    amount: number;
    paymentMethod: string;
    status: string;
    contributedAt: string;
  }>;
  progress: {
    percentage: number;
    remaining: number;
    daysRemaining: number;
  };
};

export function TravelCircleDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [circleId, setCircleId] = useState<string | null>(null);
  const [circle, setCircle] = useState<TravelCircleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => {
      setCircleId(p.id);
      loadCircleDetail(p.id);
    });
  }, [params]);

  const loadCircleDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/partner/travel-circle/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Travel circle tidak ditemukan');
        } else {
          throw new Error('Failed to load travel circle');
        }
        return;
      }

      const data = await response.json();
      setCircle(data.circle);
    } catch (error) {
      logger.error('Failed to load travel circle detail', error);
      setError('Gagal memuat detail travel circle');
      toast.error('Gagal memuat detail travel circle');
    } finally {
      setLoading(false);
    }
  };

  const handleContributionSuccess = () => {
    if (circleId) {
      loadCircleDetail(circleId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6 px-4">
        <LoadingState variant="skeleton-card" lines={5} />
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="space-y-4 py-6 px-4">
        <ErrorState
          message={error || 'Travel circle tidak ditemukan'}
          onRetry={circleId ? () => loadCircleDetail(circleId) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 px-4">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Travel Circle', href: '/partner/travel-circle' },
          { label: circle.name },
        ]}
        homeHref="/partner/dashboard"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/partner/travel-circle">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{circle.name}</h1>
            {circle.description && (
              <p className="text-sm text-muted-foreground mt-1">{circle.description}</p>
            )}
          </div>
        </div>
        <Badge variant={circle.status === 'active' ? 'default' : 'secondary'}>
          {circle.status === 'active' && 'Aktif'}
          {circle.status === 'completed' && 'Selesai'}
          {circle.status === 'cancelled' && 'Dibatalkan'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Target Amount</span>
                  <span className="font-semibold">{formatCurrency(circle.targetAmount)}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, circle.progress.percentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(circle.currentAmount)} terkumpul
                  </span>
                  <span className="font-semibold">
                    {circle.progress.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Sisa: {formatCurrency(circle.progress.remaining)}</span>
                  <span>
                    {circle.progress.daysRemaining > 0
                      ? `${circle.progress.daysRemaining} hari lagi`
                      : 'Target date sudah lewat'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Target Date</p>
                  <p className="font-semibold">
                    {new Date(circle.targetDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contributions</p>
                  <p className="font-semibold">{circle.contributionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({circle.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {circle.members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada members
                </p>
              ) : (
                <div className="space-y-3">
                  {circle.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{member.memberName}</p>
                        {member.memberEmail && (
                          <p className="text-sm text-muted-foreground">{member.memberEmail}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {formatCurrency(member.currentContribution)} /{' '}
                            {formatCurrency(member.targetContribution)}
                          </span>
                          <span>
                            {member.targetContribution > 0
                              ? `${((member.currentContribution / member.targetContribution) * 100).toFixed(1)}%`
                              : '0%'}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{
                              width: `${
                                member.targetContribution > 0
                                  ? Math.min(
                                      100,
                                      (member.currentContribution / member.targetContribution) * 100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <Badge variant="outline">{member.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contributions History */}
          <Card>
            <CardHeader>
              <CardTitle>Contribution History</CardTitle>
            </CardHeader>
            <CardContent>
              {circle.contributions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada contributions
                </p>
              ) : (
                <div className="space-y-2">
                  {circle.contributions.map((contrib) => (
                    <div
                      key={contrib.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{contrib.memberName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(contrib.contributedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(contrib.amount)}</p>
                        <Badge variant="outline" className="text-xs">
                          {contrib.paymentMethod}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contribution Tracker */}
          {circle.status === 'active' && (
            <ContributionTracker
              circleId={circle.id}
              onContributionSuccess={handleContributionSuccess}
            />
          )}

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {circle.preferredDestination && (
                <div>
                  <p className="text-muted-foreground">Destination</p>
                  <p className="font-medium">{circle.preferredDestination}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(circle.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

