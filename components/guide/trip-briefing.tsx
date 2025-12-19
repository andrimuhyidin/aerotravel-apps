'use client';

/**
 * Trip Briefing Component
 * Display AI-generated briefing points untuk guide
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Edit2, Loader2, Megaphone, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';

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
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';

type BriefingPoint = {
  title: string;
  points: string[];
  priority: 'high' | 'medium' | 'low';
};

type Briefing = {
  sections: BriefingPoint[];
  estimatedDuration: number;
  targetAudience: string;
  summary: string;
};

type TripBriefingProps = {
  tripId: string;
  locale: string;
};

export function TripBriefing({ tripId, locale }: TripBriefingProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editedPoints, setEditedPoints] = useState<string>('');
  const [printMode, setPrintMode] = useState(false);
  const queryClient = useQueryClient();

  // Fetch briefing
  const {
    data: briefingData,
    isLoading,
    error,
  } = useQuery<{
    briefing: Briefing | null;
    generatedAt: string | null;
    updatedAt: string | null;
  }>({
    queryKey: queryKeys.guide.tripsBriefing(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/briefing`);
      if (!res.ok) {
        throw new Error('Failed to fetch briefing');
      }
      return res.json();
    },
  });

  // Generate briefing mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/briefing`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate briefing');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.tripsBriefing(tripId) });
    },
  });

  // Update briefing mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedBriefing: Briefing) => {
      const res = await fetch(`/api/guide/trips/${tripId}/briefing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBriefing),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update briefing');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.tripsBriefing(tripId) });
      setEditDialogOpen(false);
      setEditingSection(null);
    },
  });

  const handleEditSection = (sectionIndex: number) => {
    if (!briefingData?.briefing) return;
    const section = briefingData.briefing.sections[sectionIndex];
    if (!section) return;
    setEditingSection(sectionIndex);
    setEditedPoints(section.points.join('\n'));
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!briefingData?.briefing || editingSection === null) return;

    const updatedSections = [...briefingData.briefing.sections];
    updatedSections[editingSection] = {
      ...updatedSections[editingSection]!,
      points: editedPoints.split('\n').filter((p) => p.trim().length > 0),
    };

    const updatedBriefing: Briefing = {
      ...briefingData.briefing,
      sections: updatedSections,
    };

    updateMutation.mutate(updatedBriefing);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Megaphone className="h-5 w-5 text-emerald-600" />
            Briefing Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Megaphone className="h-5 w-5 text-emerald-600" />
            Briefing Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message="Gagal memuat briefing" />
        </CardContent>
      </Card>
    );
  }

  const briefing = briefingData?.briefing;

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .briefing-print-content,
          .briefing-print-content * {
            visibility: visible;
          }
          .briefing-print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Card className="border-0 shadow-sm briefing-print-content">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Megaphone className="h-5 w-5 text-emerald-600" />
              Briefing Points
            </CardTitle>
            <div className="flex gap-2 no-print">
              {briefing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  title="Regenerate Briefing"
                  className="gap-2"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Regenerate</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Briefing</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!briefing ? (
            <EmptyState
              icon={Megaphone}
              title="Belum ada briefing"
              description="Generate briefing points berdasarkan profil rombongan untuk membantu persiapan trip."
            />
          ) : (
            <>
              {/* Summary */}
              {briefing.summary && (
                <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                  <p className="text-sm text-emerald-900">{briefing.summary}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-emerald-700">
                    <span>Durasi: ~{briefing.estimatedDuration} menit</span>
                    <span>Target: {briefing.targetAudience}</span>
                  </div>
                </div>
              )}

              {/* Sections */}
              <div className="space-y-3">
                {briefing.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-4 ${getPriorityColor(section.priority)}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        {getPriorityIcon(section.priority)}
                        {section.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSection(idx)}
                        className="h-7 w-7 p-0 no-print"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <ul className="space-y-1.5">
                      {section.points.map((point, pointIdx) => (
                        <li key={pointIdx} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Metadata */}
              {briefingData.generatedAt && (
                <div className="text-xs text-slate-500 pt-2 border-t">
                  Generated: {new Date(briefingData.generatedAt).toLocaleString('id-ID')}
                  {briefingData.updatedAt &&
                    briefingData.updatedAt !== briefingData.generatedAt && (
                      <> • Updated: {new Date(briefingData.updatedAt).toLocaleString('id-ID')}</>
                    )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Print Header (only visible when printing) */}
      {briefing && (
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold mb-2">Trip Briefing</h1>
          <p className="text-sm text-slate-600">
            Generated: {briefingData?.generatedAt ? new Date(briefingData.generatedAt).toLocaleString('id-ID') : 'N/A'}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {briefing && editingSection !== null
                ? briefing.sections[editingSection!]?.title
                : 'Section'}
            </DialogTitle>
            <DialogDescription>
              Edit poin-poin briefing. Satu poin per baris.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editedPoints}
              onChange={(e) => setEditedPoints(e.target.value)}
              rows={8}
              placeholder="Masukkan poin-poin briefing, satu per baris..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editedPoints.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
