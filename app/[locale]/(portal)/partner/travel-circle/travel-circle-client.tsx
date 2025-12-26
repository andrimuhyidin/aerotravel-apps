/**
 * Travel Circle Client Component
 * List dan manage travel circles
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/partner/page-header';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Target, Users, Calendar, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { TravelCircleForm } from '@/components/partner/travel-circle-form';

type TravelCircle = {
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
  progress: {
    percentage: number;
    remaining: number;
  };
};

export function TravelCircleClient() {
  const [circles, setCircles] = useState<TravelCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadCircles();
  }, [statusFilter]);

  const loadCircles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/partner/travel-circle?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load travel circles');
      }

      const data = await response.json();
      setCircles(data.circles || []);
    } catch (error) {
      logger.error('Failed to load travel circles', error);
      setError('Gagal memuat travel circles');
      toast.error('Gagal memuat travel circles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    loadCircles();
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6 px-4">
        <LoadingState variant="skeleton-card" lines={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-6 px-4">
        <ErrorState message={error} onRetry={loadCircles} />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 px-4">
      <PageHeader
        title="Travel Circle / Arisan"
        description="Kelola group savings untuk travel bookings"
        action={
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Travel Circle
            </Button>
          </div>
        }
      />

      {circles.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Belum ada Travel Circle"
          description="Buat travel circle pertama Anda untuk mulai group savings"
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Travel Circle
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map((circle) => (
            <Link key={circle.id} href={`/partner/travel-circle/${circle.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{circle.name}</CardTitle>
                    {circle.status === 'active' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Aktif
                      </span>
                    )}
                    {circle.status === 'completed' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        Selesai
                      </span>
                    )}
                    {circle.status === 'cancelled' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        Dibatalkan
                      </span>
                    )}
                  </div>
                  {circle.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {circle.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {circle.progress.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, circle.progress.percentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatCurrency(circle.currentAmount)} / {formatCurrency(circle.targetAmount)}
                      </span>
                      <span>Sisa: {formatCurrency(circle.progress.remaining)}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>Target: {new Date(circle.targetDate).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{circle.contributionCount} contributions</span>
                    </div>
                    {circle.preferredDestination && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{circle.preferredDestination}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <TravelCircleForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

