/**
 * Feedback Management Client
 * Admin dashboard untuk manage feedback
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Feedback = {
  id: string;
  guide_id: string;
  feedback_type: string;
  title: string;
  message: string;
  rating?: number;
  status: string;
  admin_response?: string;
  created_at: string;
  guide?: {
    full_name?: string;
    email?: string;
  };
};

type FeedbackManagementClientProps = {
  locale: string;
};

const statusLabels: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    label: 'Menunggu Review',
    className: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
  },
  reviewed: {
    label: 'Sudah Direview',
    className: 'bg-blue-100 text-blue-700',
    icon: CheckCircle2,
  },
  in_progress: {
    label: 'Sedang Diproses',
    className: 'bg-purple-100 text-purple-700',
    icon: Clock,
  },
  resolved: {
    label: 'Terselesaikan',
    className: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Ditutup',
    className: 'bg-slate-100 text-slate-600',
    icon: CheckCircle2,
  },
};

export function FeedbackManagementClient({
  locale: _locale,
}: FeedbackManagementClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');

  const queryClient = useQueryClient();

  // Fetch feedbacks
  const { data, isLoading, error } = useQuery<{
    feedbacks: Feedback[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-feedbacks', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/guide/feedback?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch feedbacks');
      return res.json();
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: queryKeys.guide.feedback.stats(),
    queryFn: async () => {
      const res = await fetch('/api/guide/feedback/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  // Update feedback mutation
  const updateFeedback = useMutation({
    mutationFn: async ({
      id,
      status,
      admin_response,
    }: {
      id: string;
      status?: string;
      admin_response?: string;
    }) => {
      const res = await fetch(`/api/guide/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_response }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update feedback');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.guide.feedback.stats(),
      });
      toast.success('Feedback berhasil diupdate');
      setSelectedFeedback(null);
      setResponseText('');
      setNewStatus('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal update feedback');
    },
  });

  if (isLoading) {
    return <LoadingState message="Memuat feedback..." />;
  }

  if (error) {
    return <ErrorState message="Gagal memuat feedback" />;
  }

  const feedbacks = data?.feedbacks || [];

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.admin_response || '');
    setNewStatus(feedback.status);
  };

  const handleSubmitResponse = () => {
    if (!selectedFeedback) return;

    updateFeedback.mutate({
      id: selectedFeedback.id,
      status: newStatus,
      admin_response: responseText,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.by_status?.pending || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.average_rating?.toFixed(1) || '0.0'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                NPS Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {stats.nps_score?.toFixed(0) || '0'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu Review</SelectItem>
            <SelectItem value="reviewed">Sudah Direview</SelectItem>
            <SelectItem value="in_progress">Sedang Diproses</SelectItem>
            <SelectItem value="resolved">Terselesaikan</SelectItem>
            <SelectItem value="closed">Ditutup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">Tidak ada feedback</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((feedback) => {
            const statusInfo =
              statusLabels[feedback.status] || statusLabels.pending;
            const StatusIcon = statusInfo?.icon || Clock;

            return (
              <Card
                key={feedback.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {feedback.title}
                      </CardTitle>
                      <p className="mt-1 text-xs text-slate-500">
                        Dari:{' '}
                        {feedback.guide?.full_name ||
                          feedback.guide?.email ||
                          'Unknown'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                        statusInfo?.className || 'bg-slate-100 text-slate-700'
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo?.label || feedback.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-slate-600">
                    {feedback.message}
                  </p>
                  {feedback.rating && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-sm font-medium text-amber-600">
                        ⭐ {feedback.rating}/10
                      </span>
                    </div>
                  )}
                  {feedback.admin_response && (
                    <div className="mt-3 rounded-md bg-emerald-50 p-2">
                      <p className="text-xs font-medium text-emerald-900">
                        Response:
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-emerald-700">
                        {feedback.admin_response}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(feedback)}
                    >
                      {feedback.admin_response
                        ? 'Edit Response'
                        : 'Beri Response'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog
        open={!!selectedFeedback}
        onOpenChange={(open) => !open && setSelectedFeedback(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Response Feedback</DialogTitle>
            <DialogDescription>
              Berikan response untuk feedback dari guide
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Feedback:</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedFeedback.message}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Status:
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu Review</SelectItem>
                    <SelectItem value="reviewed">Sudah Direview</SelectItem>
                    <SelectItem value="in_progress">Sedang Diproses</SelectItem>
                    <SelectItem value="resolved">Terselesaikan</SelectItem>
                    <SelectItem value="closed">Ditutup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Response:
                </label>
                <Textarea
                  className="mt-1"
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Tulis response untuk guide..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFeedback(null);
                setResponseText('');
                setNewStatus('');
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={updateFeedback.isPending}
            >
              {updateFeedback.isPending ? 'Menyimpan...' : 'Simpan Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
