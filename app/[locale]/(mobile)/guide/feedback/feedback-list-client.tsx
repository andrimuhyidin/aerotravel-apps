/**
 * Guide Feedback List Client
 * Display list of feedbacks with ability to create new
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

import { FeedbackAiAnalyzer } from './feedback-ai-analyzer';

type Feedback = {
  id: string;
  feedback_type: string;
  title: string;
  message: string;
  rating?: number;
  status: string;
  admin_response?: string;
  created_at: string;
  responded_at?: string;
};

type FeedbackListClientProps = {
  locale: string;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu Review', className: 'bg-yellow-100 text-yellow-700' },
  reviewed: { label: 'Sudah Direview', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Sedang Diproses', className: 'bg-purple-100 text-purple-700' },
  resolved: { label: 'Terselesaikan', className: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Ditutup', className: 'bg-slate-100 text-slate-600' },
} as const;

const getStatusInfo = (status: string): { label: string; className: string } => {
  return (statusLabels[status] || statusLabels.pending) as { label: string; className: string };
};

const typeLabels: Record<string, string> = {
  general: 'Umum',
  app_improvement: 'Perbaikan App',
  work_environment: 'Lingkungan Kerja',
  compensation: 'Kompensasi',
  training: 'Pelatihan',
  safety: 'Keselamatan',
  suggestion: 'Saran',
};

export function FeedbackListClient({ locale }: FeedbackListClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery<{
    feedbacks: Feedback[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: queryKeys.guide.feedback.list({ status: statusFilter !== 'all' ? statusFilter : undefined }),
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

  if (isLoading) {
    return <LoadingState message="Memuat feedback..." />;
  }

  if (error) {
    return <ErrorState message="Gagal memuat feedback" onRetry={() => { refetch(); }} />;
  }

  const feedbacks = data?.feedbacks || [];

  return (
    <div className="space-y-4">
      {/* AI Feedback Trends Analyzer */}
      {feedbacks.length > 0 && (
        <FeedbackAiAnalyzer
          guideId={undefined}
          onAnalysisComplete={(analysis) => {
            // Could show trends summary
            console.log('Feedback analysis:', analysis);
          }}
        />
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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

        <Button asChild>
          <Link href={`/${locale}/guide/feedback/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Feedback Baru
          </Link>
        </Button>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Belum ada feedback"
          description="Mulai berikan feedback untuk perbaikan perusahaan"
          action={
            <Button asChild>
              <Link href={`/${locale}/guide/feedback/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Feedback
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {feedbacks.map((feedback) => {
            const statusInfo = getStatusInfo(feedback.status);
            const typeLabel = typeLabels[feedback.feedback_type] || feedback.feedback_type;

            return (
              <Link
                key={feedback.id}
                href={`/${locale}/guide/feedback/${feedback.id}`}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{feedback.title}</CardTitle>
                        <p className="mt-1 text-xs text-slate-500">{typeLabel}</p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs font-medium',
                          statusInfo.className
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-slate-600">{feedback.message}</p>
                    {feedback.rating && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-sm font-medium text-amber-600">
                          ⭐ {feedback.rating}/10
                        </span>
                      </div>
                    )}
                    {feedback.admin_response && (
                      <div className="mt-3 rounded-md bg-emerald-50 p-2">
                        <p className="text-xs font-medium text-emerald-900">Response Admin:</p>
                        <p className="mt-1 text-xs text-emerald-700 line-clamp-2">
                          {feedback.admin_response}
                        </p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(feedback.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
