/**
 * Feedback Detail Client
 * Display feedback detail with admin response
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Feedback = {
  id: string;
  feedback_type: string;
  title: string;
  message: string;
  rating?: number;
  status: string;
  admin_response?: string;
  responded_at?: string;
  created_at: string;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_type: string;
  }>;
};

type FeedbackDetailClientProps = {
  feedbackId: string;
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

export function FeedbackDetailClient({ feedbackId, locale }: FeedbackDetailClientProps) {
  const { data, isLoading, error } = useQuery<{ feedback: Feedback; attachments: unknown[] }>({
    queryKey: queryKeys.guide.feedback.detail(feedbackId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/feedback/${feedbackId}`);
      if (!res.ok) throw new Error('Failed to fetch feedback');
      return res.json();
    },
  });

  if (isLoading) {
    return <LoadingState message="Memuat feedback..." />;
  }

  if (error || !data) {
    return <ErrorState message="Gagal memuat feedback" />;
  }

  const { feedback, attachments } = data;
  const statusInfo = getStatusInfo(feedback.status);
  const typeLabel = typeLabels[feedback.feedback_type] || feedback.feedback_type;

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">Detail Feedback</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/guide/feedback`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      {/* Feedback Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>{feedback.title}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">{typeLabel}</p>
            </div>
            <span
              className={cn('rounded-full px-3 py-1 text-xs font-medium', statusInfo.className)}
            >
              {statusInfo.label}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rating */}
          {feedback.rating && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-600">⭐ {feedback.rating}/10</span>
              <span className="text-sm text-slate-500">Rating</span>
            </div>
          )}

          {/* Message */}
          <div>
            <p className="text-sm font-medium text-slate-700">Pesan:</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{feedback.message}</p>
          </div>

          {/* Attachments */}
          {attachments && Array.isArray(attachments) && attachments.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Lampiran:</p>
              <div className="space-y-2">
                {(attachments as Array<{ id: string; file_url: string; file_type: string }>).map((att) => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md border p-2 text-sm text-emerald-600 hover:bg-emerald-50"
                  >
                    📎 {att.file_type} - Lihat file
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Response */}
          {feedback.admin_response && (
            <div className="rounded-lg bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-700" />
                <p className="text-sm font-medium text-emerald-900">Response Admin:</p>
              </div>
              <p className="whitespace-pre-wrap text-sm text-emerald-700">
                {feedback.admin_response}
              </p>
              {feedback.responded_at && (
                <p className="mt-2 text-xs text-emerald-600">
                  Direspons pada{' '}
                  {new Date(feedback.responded_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          )}

          {/* Created Date */}
          <div className="border-t pt-4">
            <p className="text-xs text-slate-400">
              Dikirim pada{' '}
              {new Date(feedback.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
