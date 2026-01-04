'use client';

/**
 * Crew Notes Section Component
 * Lightweight messaging for crew coordination
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type CrewNote = {
  id: string;
  message: string;
  note_type: 'general' | 'task' | 'safety' | 'coordination';
  parent_note_id: string | null;
  created_at: string;
  created_by: string;
  creator: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
};

type CrewNotesResponse = {
  notes: CrewNote[];
};

type CrewNotesSectionProps = {
  tripId: string;
  locale: string;
};

const noteTypeLabels: Record<string, string> = {
  general: 'Umum',
  task: 'Tugas',
  safety: 'Keselamatan',
  coordination: 'Koordinasi',
};

const noteTypeColors: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700',
  task: 'bg-blue-100 text-blue-700',
  safety: 'bg-red-100 text-red-700',
  coordination: 'bg-emerald-100 text-emerald-700',
};

export function CrewNotesSection({ tripId, locale }: CrewNotesSectionProps) {
  const [message, setMessage] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'task' | 'safety' | 'coordination'>('general');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<CrewNotesResponse>({
    queryKey: queryKeys.guide.team.notes.trip(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/crew/notes/${tripId}`);
      if (!res.ok) {
        throw new Error('Gagal memuat notes');
      }
      return (await res.json()) as CrewNotesResponse;
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (payload: { message: string; note_type: string }) => {
      const res = await fetch(`/api/guide/crew/notes/${tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal membuat note');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.team.notes.trip(tripId) });
      setMessage('');
      setNoteType('general');
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <LoadingState variant="skeleton" lines={3} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <ErrorState
            message={error instanceof Error ? error.message : 'Gagal memuat notes'}
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const notes = data?.notes ?? [];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
          Crew Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Note Form */}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Select value={noteType} onValueChange={(v) => setNoteType(v as typeof noteType)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Umum</SelectItem>
              <SelectItem value="task">Tugas</SelectItem>
              <SelectItem value="safety">Keselamatan</SelectItem>
              <SelectItem value="coordination">Koordinasi</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Tulis pesan untuk crew..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{message.length}/1000</p>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                if (message.trim()) {
                  createNoteMutation.mutate({
                    message: message.trim(),
                    note_type: noteType,
                  });
                }
              }}
              disabled={!message.trim() || createNoteMutation.isPending}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Kirim
            </Button>
          </div>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Belum ada notes"
            description="Mulai koordinasi dengan crew melalui notes"
            variant="subtle"
          />
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {note.creator?.avatar_url ? (
                      <img
                        src={note.creator.avatar_url}
                        alt={note.creator.full_name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {note.creator?.full_name || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(note.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      noteTypeColors[note.note_type] || noteTypeColors.general,
                    )}
                  >
                    {noteTypeLabels[note.note_type] || note.note_type}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{note.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
