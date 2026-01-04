'use client';

/**
 * Trainer Feedback Client Component
 * Allows trainer to rate and comment on guide performance after training session
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, MessageSquare, Star, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';

type FeedbackClientProps = {
  sessionId: string;
  locale: string;
};

type Guide = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Attendance = {
  id: string;
  guide_id: string;
  status: string;
  guide?: Guide;
};

type Feedback = {
  id: string;
  guide_id: string;
  rating: 'excellent' | 'good' | 'needs_improvement';
  comment: string | null;
  guide?: Guide;
};

export function FeedbackClient({ sessionId, locale }: FeedbackClientProps) {
  const [feedbacks, setFeedbacks] = useState<Record<string, { rating: string; comment: string }>>({});

  // Fetch attendees
  const { data: attendanceData, isLoading } = useQuery<{ attendees: Attendance[] }>({
    queryKey: ['training-session-attendees', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/guide/training/sessions/${sessionId}/attendees`);
      if (!res.ok) throw new Error('Failed to fetch attendees');
      return res.json();
    },
  });

  // Fetch existing feedbacks
  const { data: feedbacksData } = useQuery<{ feedbacks: Feedback[] }>({
    queryKey: ['training-session-feedbacks', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/guide/training/sessions/${sessionId}/feedback`);
      if (!res.ok) return { feedbacks: [] };
      return res.json();
    },
  });

  // Initialize feedbacks from existing data
  useState(() => {
    if (feedbacksData?.feedbacks) {
      const initialFeedbacks: Record<string, { rating: string; comment: string }> = {};
      feedbacksData.feedbacks.forEach((fb) => {
        initialFeedbacks[fb.guide_id] = {
          rating: fb.rating,
          comment: fb.comment || '',
        };
      });
      setFeedbacks(initialFeedbacks);
    }
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (guideId: string) => {
      const feedback = feedbacks[guideId];
      if (!feedback || !feedback.rating) {
        throw new Error('Please select a rating');
      }

      const res = await fetch(`/api/admin/guide/training/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide_id: guideId,
          rating: feedback.rating,
          comment: feedback.comment || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      return res.json();
    },
    onSuccess: (_, guideId) => {
      toast.success('Feedback submitted successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to submit feedback', error);
      toast.error(error.message || 'Failed to submit feedback');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const attendees = attendanceData?.attendees || [];
  const existingFeedbacks = feedbacksData?.feedbacks || [];

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'bg-green-100 text-green-700';
      case 'good':
        return 'bg-blue-100 text-blue-700';
      case 'needs_improvement':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'needs_improvement':
        return 'Needs Improvement';
      default:
        return 'Not Rated';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Trainer Feedback
          </CardTitle>
          <CardDescription>
            Rate and provide feedback for each guide who attended this training session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {attendees.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No attendees found</div>
          ) : (
            attendees.map((attendee) => {
              const guideName = attendee.guide
                ? `${attendee.guide.first_name || ''} ${attendee.guide.last_name || ''}`.trim() ||
                  attendee.guide.email
                : 'Unknown Guide';
              const existingFeedback = existingFeedbacks.find((fb) => fb.guide_id === attendee.guide_id);
              const currentFeedback = feedbacks[attendee.guide_id] || {
                rating: existingFeedback?.rating || '',
                comment: existingFeedback?.comment || '',
              };

              return (
                <div
                  key={attendee.guide_id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{guideName}</div>
                        <div className="text-sm text-slate-500">{attendee.guide?.email || ''}</div>
                      </div>
                    </div>
                    {existingFeedback && (
                      <Badge className={getRatingColor(existingFeedback.rating)}>
                        {getRatingLabel(existingFeedback.rating)}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
                      <Select
                        value={currentFeedback.rating}
                        onValueChange={(value) =>
                          setFeedbacks((prev) => ({
                            ...prev,
                            [attendee.guide_id]: {
                              rating: value,
                              comment: prev[attendee.guide_id]?.comment || '',
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              Excellent
                            </div>
                          </SelectItem>
                          <SelectItem value="good">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-blue-400 text-blue-400" />
                              Good
                            </div>
                          </SelectItem>
                          <SelectItem value="needs_improvement">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              Needs Improvement
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Comment</label>
                      <Textarea
                        value={currentFeedback.comment}
                        onChange={(e) =>
                          setFeedbacks((prev) => ({
                            ...prev,
                            [attendee.guide_id]: {
                              rating: prev[attendee.guide_id]?.rating || '',
                              comment: e.target.value,
                            },
                          }))
                        }
                        placeholder="Add feedback comment (optional)..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={() => submitFeedbackMutation.mutate(attendee.guide_id)}
                      disabled={submitFeedbackMutation.isPending || !currentFeedback.rating}
                      size="sm"
                      className="w-full"
                    >
                      {submitFeedbackMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : existingFeedback ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Update Feedback
                        </>
                      ) : (
                        'Submit Feedback'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

