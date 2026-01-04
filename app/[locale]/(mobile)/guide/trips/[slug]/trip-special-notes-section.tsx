'use client';

/**
 * Trip Special Notes Section
 * Menampilkan catatan khusus untuk trip (selalu ditampilkan walaupun kosong)
 */

import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type TripSpecialNotesSectionProps = {
  tripId: string;
  locale: string;
};

export function TripSpecialNotesSection({ tripId, locale: _locale }: TripSpecialNotesSectionProps) {
  const { data, isLoading } = useQuery<{
    specialNotes: string | null;
  }>({
    queryKey: ['guide', 'trip-special-notes', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/package-info`);
      if (!res.ok) throw new Error('Failed to fetch special notes');
      const data = await res.json();
      return {
        specialNotes: data.specialNotes || null,
      };
    },
    staleTime: 300000,
  });

  const notes = data?.specialNotes || null;
  const hasNotes = notes && notes.trim().length > 0;

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <FileText className="h-5 w-5 text-purple-600" />
            Catatan Khusus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <FileText className="h-5 w-5 text-purple-600" />
          Catatan Khusus
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasNotes ? (
          <div className="rounded-lg bg-white border border-purple-200 p-4">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-500">
              Tidak ada catatan khusus untuk trip ini.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
