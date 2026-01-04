/**
 * Trainer Feedback Form Component
 * Allow guides to submit feedback about training sessions
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type TrainerFeedbackFormProps = {
  trainingId: string;
  onComplete?: () => void;
};

const RATING_LABELS = {
  1: 'Sangat Buruk',
  2: 'Buruk',
  3: 'Cukup',
  4: 'Baik',
  5: 'Sangat Baik',
};

export function TrainerFeedbackForm({ trainingId, onComplete }: TrainerFeedbackFormProps) {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [contentQuality, setContentQuality] = useState<number>(0);
  const [trainerEffectiveness, setTrainerEffectiveness] = useState<number>(0);
  const [materialClarity, setMaterialClarity] = useState<number>(0);
  const [practicalApplicability, setPracticalApplicability] = useState<number>(0);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const queryClient = useQueryClient();

  // Check if feedback already submitted
  const { data, isLoading } = useQuery<{
    feedback: unknown[];
    hasSubmitted: boolean;
  }>({
    queryKey: queryKeys.guide.training.feedback(trainingId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/training/${trainingId}/feedback`);
      if (!res.ok) throw new Error('Failed to fetch feedback');
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/guide/training/${trainingId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallRating,
          contentQuality: contentQuality || undefined,
          trainerEffectiveness: trainerEffectiveness || undefined,
          materialClarity: materialClarity || undefined,
          practicalApplicability: practicalApplicability || undefined,
          strengths: strengths || undefined,
          improvements: improvements || undefined,
          suggestions: suggestions || undefined,
          additionalComments: additionalComments || undefined,
          isAnonymous,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Feedback berhasil dikirim. Terima kasih!');
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.training.feedback(trainingId) });
      onComplete?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengirim feedback');
    },
  });

  const handleSubmit = () => {
    if (overallRating === 0) {
      toast.error('Harap berikan rating keseluruhan');
      return;
    }

    submitMutation.mutate();
  };

  const RatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              value >= rating
                ? 'text-amber-500 bg-amber-50'
                : 'text-slate-300 hover:text-amber-400'
            )}
          >
            <Star className={cn('h-6 w-6', value >= rating && 'fill-current')} />
          </button>
        ))}
        {value > 0 && (
          <span className="text-sm text-slate-600 ml-2">
            {RATING_LABELS[value as keyof typeof RATING_LABELS]}
          </span>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (data?.hasSubmitted) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Star}
            title="Feedback Sudah Dikirim"
            description="Terima kasih! Feedback Anda sudah tercatat."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Training</CardTitle>
        <p className="text-sm text-slate-600">
          Bantu kami meningkatkan kualitas training dengan memberikan feedback Anda
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating (Required) */}
        <RatingInput
          label="Rating Keseluruhan *"
          value={overallRating}
          onChange={setOverallRating}
        />

        {/* Detailed Ratings (Optional) */}
        <div className="space-y-4">
          <RatingInput
            label="Kualitas Konten"
            value={contentQuality}
            onChange={setContentQuality}
          />
          <RatingInput
            label="Efektivitas Trainer"
            value={trainerEffectiveness}
            onChange={setTrainerEffectiveness}
          />
          <RatingInput
            label="Kejelasan Materi"
            value={materialClarity}
            onChange={setMaterialClarity}
          />
          <RatingInput
            label="Aplikasi Praktis"
            value={practicalApplicability}
            onChange={setPracticalApplicability}
          />
        </div>

        {/* Text Feedback */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="strengths">Kelebihan / Yang Berjalan Baik</Label>
            <Textarea
              id="strengths"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Apa yang Anda sukai dari training ini?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="improvements">Area Perbaikan</Label>
            <Textarea
              id="improvements"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Apa yang bisa diperbaiki?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="suggestions">Saran untuk Training Selanjutnya</Label>
            <Textarea
              id="suggestions"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Saran atau ide untuk training di masa depan"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="comments">Komentar Tambahan</Label>
            <Textarea
              id="comments"
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="Komentar atau masukan lainnya..."
              rows={3}
            />
          </div>
        </div>

        {/* Anonymous Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(checked === true)}
          />
          <Label htmlFor="anonymous" className="text-sm cursor-pointer">
            Kirim sebagai feedback anonim
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={overallRating === 0 || submitMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {submitMutation.isPending ? 'Mengirim...' : 'Kirim Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}

