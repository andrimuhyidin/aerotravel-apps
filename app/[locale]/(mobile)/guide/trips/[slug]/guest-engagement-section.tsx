'use client';

/**
 * Guest Engagement Section
 * Quiz (AI-generated), Leaderboard, Music playlists (reference only)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Camera, Loader2, Music, RefreshCw, Trophy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type GuestEngagementSectionProps = {
  tripId: string;
  locale: string;
};

type QuizQuestion = {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'open_ended';
  options?: Array<{ text: string; is_correct: boolean }>;
  correct_answer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  explanation?: string;
};

type MusicReference = {
  id: string;
  name: string;
  category: string;
  description?: string;
  genre?: string;
  mood?: string;
  suitable_for?: string[];
};

export function GuestEngagementSection({
  tripId,
  locale: _locale,
}: GuestEngagementSectionProps) {
  const [activeTab, setActiveTab] = useState<
    'quiz' | 'music' | 'photo' | 'leaderboard'
  >('quiz');
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const queryClient = useQueryClient();

  // Fetch quiz questions
  const {
    data: quizData,
    isLoading: quizLoading,
    refetch: refetchQuiz,
  } = useQuery<{
    questions: QuizQuestion[];
  }>({
    queryKey: queryKeys.guide.trips.engagement.quiz(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/engagement/quiz`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      return res.json();
    },
  });

  // Generate quiz with AI
  const generateQuizMutation = useMutation({
    mutationFn: async (count: number = 5) => {
      const res = await fetch(`/api/guide/trips/${tripId}/engagement/quiz`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate quiz');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Quiz berhasil di-generate');
      queryClient.invalidateQueries({
        queryKey: queryKeys.guide.trips.engagement.quiz(tripId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal generate quiz');
    },
  });

  // Fetch music references (AI-generated)
  const {
    data: musicData,
    isLoading: musicLoading,
    refetch: refetchMusic,
  } = useQuery<{
    playlists: MusicReference[];
    generated_at?: string;
    note?: string;
  }>({
    queryKey: queryKeys.guide.trips.engagement.music(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/engagement/music`);
      if (!res.ok) throw new Error('Failed to fetch music references');
      return res.json();
    },
  });

  // Fetch photo challenges
  const { data: photoData, isLoading: photoLoading } = useQuery<{
    challenges: Array<{
      type: string;
      title: string;
      description: string;
      points: number;
    }>;
    submissions: Array<{
      id: string;
      passengerName: string;
      photoUrl: string;
      challengeType: string;
      points: number;
      submittedAt: string;
    }>;
  }>({
    queryKey: ['photo-challenges', tripId],
    queryFn: async () => {
      const res = await fetch(
        `/api/guide/trips/${tripId}/engagement/photo-challenge`
      );
      if (!res.ok) throw new Error('Failed to fetch photo challenges');
      return res.json();
    },
  });

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<{
    leaderboard: Array<{
      rank: number;
      total_points: number;
      quiz_points: number;
      photo_challenge_points: number;
      passenger: { name: string };
    }>;
  }>({
    queryKey: queryKeys.guide.trips.engagement.leaderboard(tripId),
    queryFn: async () => {
      const res = await fetch(
        `/api/guide/trips/${tripId}/engagement/leaderboard`
      );
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
  });

  const handleSubmitAnswer = async (
    questionId: string,
    question: QuizQuestion
  ) => {
    const answer = selectedAnswers[questionId];
    if (!answer) {
      toast.error('Pilih jawaban terlebih dahulu');
      return;
    }

    try {
      const res = await fetch(`/api/guide/trips/${tripId}/engagement/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          passenger_id: 'current-passenger', // TODO: Get from context when passenger selection is implemented
          answer,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit answer');

      const data = await res.json();
      if (data.is_correct) {
        toast.success(`Benar! +${data.points_earned} poin`);
      } else {
        toast.error('Jawaban salah');
      }

      // Clear selected answer
      setSelectedAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    } catch (_error) {
      toast.error('Gagal submit jawaban');
    }
  };

  const handleGenerateQuiz = () => {
    generateQuizMutation.mutate(5);
  };

  const questions = quizData?.questions || [];
  const musicReferences = musicData?.playlists || [];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <Card className="border-0 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="text-base font-semibold text-slate-900">
              Guest Engagement
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        <Button
          variant={activeTab === 'quiz' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('quiz')}
          size="sm"
          className="flex-shrink-0"
        >
          <Trophy className="mr-2 h-4 w-4" />
          Quiz
        </Button>
        <Button
          variant={activeTab === 'photo' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('photo')}
          size="sm"
          className="flex-shrink-0"
        >
          <Camera className="mr-2 h-4 w-4" />
          Photo Challenge
        </Button>
        <Button
          variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('leaderboard')}
          size="sm"
          className="flex-shrink-0"
        >
          <Trophy className="mr-2 h-4 w-4" />
          Leaderboard
        </Button>
        <Button
          variant={activeTab === 'music' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('music')}
          size="sm"
          className="flex-shrink-0"
        >
          <Music className="mr-2 h-4 w-4" />
          Music
        </Button>
      </div>

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {/* Generate Quiz Button */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Bot className="h-4 w-4 text-blue-600" />
                    Generate Quiz dengan AI
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    AI akan membuat pertanyaan quiz berdasarkan informasi trip
                    ini
                  </p>
                </div>
                <Button
                  onClick={handleGenerateQuiz}
                  disabled={generateQuizMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {generateQuizMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Questions */}
          {quizLoading ? (
            <LoadingState message="Memuat quiz..." />
          ) : questions.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Belum ada quiz"
              description="Klik tombol Generate untuk membuat quiz dengan AI atau admin akan menambahkan quiz manual"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {questions.length} pertanyaan tersedia
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchQuiz()}
                  className="text-xs"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>

              {questions.map((question, idx) => (
                <Card key={question.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex-1 text-sm font-semibold text-slate-900">
                        {idx + 1}. {question.question_text}
                      </CardTitle>
                      {question.category && (
                        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {question.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          question.difficulty === 'easy' &&
                            'bg-green-100 text-green-700',
                          question.difficulty === 'medium' &&
                            'bg-yellow-100 text-yellow-700',
                          question.difficulty === 'hard' &&
                            'bg-red-100 text-red-700'
                        )}
                      >
                        {question.difficulty}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {question.question_type === 'multiple_choice' &&
                      question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optIdx) => (
                            <Button
                              key={optIdx}
                              variant={
                                selectedAnswers[question.id] === option.text
                                  ? 'default'
                                  : 'outline'
                              }
                              onClick={() =>
                                setSelectedAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: option.text,
                                }))
                              }
                              className="h-auto w-full justify-start px-3 py-2.5 text-left"
                            >
                              <span className="mr-2 font-medium">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="flex-1">{option.text}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    {question.question_type === 'true_false' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={
                            selectedAnswers[question.id] === 'True'
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [question.id]: 'True',
                            }))
                          }
                          className="w-full"
                        >
                          Benar
                        </Button>
                        <Button
                          variant={
                            selectedAnswers[question.id] === 'False'
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [question.id]: 'False',
                            }))
                          }
                          className="w-full"
                        >
                          Salah
                        </Button>
                      </div>
                    )}
                    <Button
                      onClick={() => handleSubmitAnswer(question.id, question)}
                      disabled={!selectedAnswers[question.id]}
                      className="w-full"
                      size="sm"
                    >
                      Submit Jawaban
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Music Tab - AI-Generated Reference */}
      {activeTab === 'music' && (
        <div className="space-y-4">
          {/* Generate Music Reference Button */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Bot className="h-4 w-4 text-purple-600" />
                    Generate Referensi Musik dengan AI
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    AI akan membuat referensi playlist musik berdasarkan
                    informasi trip ini
                  </p>
                </div>
                <Button
                  onClick={() => refetchMusic()}
                  disabled={musicLoading}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {musicLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Music className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Music References */}
          {musicLoading ? (
            <LoadingState message="Memuat referensi musik..." />
          ) : musicReferences.length === 0 ? (
            <EmptyState
              icon={Music}
              title="Belum ada referensi musik"
              description="Klik tombol Generate untuk membuat referensi musik dengan AI"
            />
          ) : (
            <div className="space-y-3">
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Catatan:</strong> Referensi musik berikut
                    di-generate oleh AI dan hanya sebagai panduan. Guide dapat
                    memutar musik sesuai preferensi dengan aplikasi musik yang
                    tersedia.
                  </p>
                  {musicData?.generated_at && (
                    <p className="mt-2 text-xs text-amber-700">
                      Generated:{' '}
                      {new Date(musicData.generated_at).toLocaleString('id-ID')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {musicReferences.map((ref) => (
                <Card key={ref.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                            <Music className="h-4 w-4 text-slate-600" />
                            {ref.name}
                          </h3>
                          {ref.category && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                              {ref.category}
                            </span>
                          )}
                        </div>
                        {ref.description && (
                          <p className="mt-2 text-sm text-slate-600">
                            {ref.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ref.genre && (
                            <span className="text-xs text-slate-500">
                              Genre: {ref.genre}
                            </span>
                          )}
                          {ref.mood && (
                            <span className="text-xs text-slate-500">
                              Mood: {ref.mood}
                            </span>
                          )}
                        </div>
                        {ref.suitable_for && ref.suitable_for.length > 0 && (
                          <div className="mt-2">
                            <p className="mb-1 text-xs font-medium text-slate-700">
                              Cocok untuk:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {ref.suitable_for.map((suitable, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                                >
                                  {suitable}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo Challenge Tab */}
      {activeTab === 'photo' && (
        <div className="space-y-4">
          {photoLoading ? (
            <LoadingState message="Memuat photo challenges..." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {photoData?.challenges.map((challenge) => (
                  <Card key={challenge.type} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">
                          {challenge.title}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {challenge.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-emerald-600">
                            +{challenge.points} poin
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {photoData?.submissions && photoData.submissions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Submissions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {photoData.submissions.map((submission) => (
                      <Card key={submission.id} className="border-0 shadow-sm">
                        <CardContent className="p-3">
                          <img
                            src={submission.photoUrl}
                            alt={submission.challengeType}
                            className="mb-2 h-32 w-full rounded-lg object-cover"
                          />
                          <p className="text-xs font-medium">
                            {submission.passengerName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {submission.challengeType}
                          </p>
                          <p className="text-xs font-semibold text-emerald-600">
                            +{submission.points} poin
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {leaderboardLoading ? (
            <LoadingState message="Memuat leaderboard..." />
          ) : leaderboardData?.leaderboard &&
            leaderboardData.leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboardData.leaderboard.map((entry, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    'border-0 shadow-sm',
                    entry.rank === 1 &&
                      'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                            entry.rank === 1
                              ? 'bg-amber-500 text-white'
                              : entry.rank === 2
                                ? 'bg-slate-400 text-white'
                                : entry.rank === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {entry.rank}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {entry.passenger.name}
                          </p>
                          <div className="flex gap-3 text-xs text-slate-600">
                            <span>Quiz: {entry.quiz_points}</span>
                            <span>Photo: {entry.photo_challenge_points}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {entry.total_points}
                        </p>
                        <p className="text-xs text-slate-500">poin</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="Belum ada leaderboard"
              description="Belum ada peserta yang mengikuti aktivitas engagement"
            />
          )}
        </div>
      )}
    </div>
  );
}
