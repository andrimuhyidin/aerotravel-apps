'use client';

/**
 * Mentorship Client Component
 * Display and manage mentor-mentee relationships
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  MessageCircle,
  Plus,
  Star,
  Target,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type MentorshipClientProps = {
  locale: string;
};

type Mentor = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  guide_profiles?: Array<{
    experience_years: number;
    specializations: string[];
    is_senior_guide: boolean;
    average_rating: number;
    total_trips: number;
  }>;
};

type Mentorship = {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string | null;
  goals: string[];
  notes: string | null;
  progress_percentage: number;
  created_at: string;
  mentor?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  mentee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
};

type MentorshipData = {
  as_mentor: Mentorship[];
  as_mentee: Mentorship[];
  available_mentors: Mentor[];
  can_be_mentor: boolean;
  total_mentorships: number;
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  active: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  completed: { label: 'Selesai', color: 'bg-blue-100 text-blue-800', icon: Award },
  cancelled: { label: 'Dibatalkan', color: 'bg-slate-100 text-slate-800', icon: XCircle },
};

export function MentorshipClient({ locale: _locale }: MentorshipClientProps) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [goals, setGoals] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<MentorshipData>({
    queryKey: [...queryKeys.guide.all, 'mentorship'],
    queryFn: async () => {
      const res = await fetch('/api/guide/mentorship');
      if (!res.ok) throw new Error('Failed to fetch mentorship data');
      return res.json();
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (payload: { mentor_id: string; goals: string[]; notes: string }) => {
      const res = await fetch('/api/guide/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentor_id: payload.mentor_id,
          mentee_id: 'current-user', // Will be set by API from auth
          goals: payload.goals,
          notes: payload.notes,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to request mentorship');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Permintaan mentorship berhasil dikirim!');
      setShowRequestDialog(false);
      setSelectedMentor(null);
      setGoals('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.guide.all, 'mentorship'] });
    },
    onError: (error: Error) => {
      logger.error('Failed to request mentorship', error);
      toast.error(error.message || 'Gagal mengirim permintaan mentorship');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/guide/mentorship/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update mentorship');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Status mentorship berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.guide.all, 'mentorship'] });
    },
  });

  const handleRequestMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowRequestDialog(true);
  };

  const handleSubmitRequest = () => {
    if (!selectedMentor) return;

    const goalList = goals.split('\n').filter((g) => g.trim());
    requestMutation.mutate({
      mentor_id: selectedMentor.id,
      goals: goalList,
      notes,
    });
  };

  if (isLoading) {
    return <LoadingState message="Memuat data mentorship..." />;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6 text-center text-red-700">
          Gagal memuat data mentorship. Silakan coba lagi.
        </CardContent>
      </Card>
    );
  }

  const asMentor = data?.as_mentor || [];
  const asMentee = data?.as_mentee || [];
  const availableMentors = data?.available_mentors || [];
  const canBeMentor = data?.can_be_mentor || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mentorship</h1>
        <p className="text-sm text-slate-600">
          Program pengembangan guide melalui bimbingan senior
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{asMentee.length}</p>
                <p className="text-xs text-slate-500">Sebagai Mentee</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{asMentor.length}</p>
                <p className="text-xs text-slate-500">Sebagai Mentor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mentee" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mentee">
            <BookOpen className="mr-1 h-4 w-4" />
            Belajar
          </TabsTrigger>
          <TabsTrigger value="mentor" disabled={!canBeMentor}>
            <Users className="mr-1 h-4 w-4" />
            Mengajar
          </TabsTrigger>
          <TabsTrigger value="find">
            <Target className="mr-1 h-4 w-4" />
            Cari Mentor
          </TabsTrigger>
        </TabsList>

        {/* As Mentee Tab */}
        <TabsContent value="mentee" className="mt-4 space-y-4">
          {asMentee.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Belum ada mentor"
              description="Cari mentor untuk membantu pengembangan karir Anda sebagai guide"
              action={{
                label: 'Cari Mentor',
                onClick: () => document.querySelector('[data-value="find"]')?.dispatchEvent(new Event('click')),
              }}
            />
          ) : (
            asMentee.map((mentorship) => (
              <MentorshipCard
                key={mentorship.id}
                mentorship={mentorship}
                role="mentee"
                onUpdateStatus={(status) => updateMutation.mutate({ id: mentorship.id, status })}
              />
            ))
          )}
        </TabsContent>

        {/* As Mentor Tab */}
        <TabsContent value="mentor" className="mt-4 space-y-4">
          {!canBeMentor ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-6 text-center">
                <Award className="mx-auto h-12 w-12 text-amber-500" />
                <p className="mt-2 font-medium text-amber-900">Belum memenuhi syarat</p>
                <p className="mt-1 text-sm text-amber-700">
                  Anda perlu minimal 2 tahun pengalaman dan 20 trip untuk menjadi mentor
                </p>
              </CardContent>
            </Card>
          ) : asMentor.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada mentee"
              description="Anda belum memiliki mentee yang dibimbing"
            />
          ) : (
            asMentor.map((mentorship) => (
              <MentorshipCard
                key={mentorship.id}
                mentorship={mentorship}
                role="mentor"
                onUpdateStatus={(status) => updateMutation.mutate({ id: mentorship.id, status })}
              />
            ))
          )}
        </TabsContent>

        {/* Find Mentor Tab */}
        <TabsContent value="find" className="mt-4 space-y-4">
          {availableMentors.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Tidak ada mentor tersedia"
              description="Saat ini tidak ada senior guide yang tersedia untuk mentorship"
            />
          ) : (
            availableMentors.map((mentor) => (
              <Card key={mentor.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={mentor.avatar_url || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {mentor.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{mentor.full_name}</h3>
                        <Badge variant="secondary" className="text-[10px]">
                          <Star className="mr-0.5 h-3 w-3 text-amber-500" />
                          {mentor.guide_profiles?.[0]?.average_rating?.toFixed(1) || '4.5'}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{mentor.guide_profiles?.[0]?.experience_years || 0} tahun pengalaman</span>
                        <span>•</span>
                        <span>{mentor.guide_profiles?.[0]?.total_trips || 0} trips</span>
                      </div>
                      {mentor.guide_profiles?.[0]?.specializations && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {mentor.guide_profiles[0].specializations.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRequestMentor(mentor)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Request Mentor Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              Ajukan permintaan mentorship kepada {selectedMentor?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedMentor && (
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <Avatar>
                  <AvatarImage src={selectedMentor.avatar_url || undefined} />
                  <AvatarFallback>{selectedMentor.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">{selectedMentor.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {selectedMentor.guide_profiles?.[0]?.experience_years || 0} tahun pengalaman
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tujuan Mentorship</Label>
              <Textarea
                placeholder="Tulis tujuan Anda (satu per baris)&#10;Contoh:&#10;- Meningkatkan skill handling tamu&#10;- Belajar navigasi laut"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan Tambahan</Label>
              <Textarea
                placeholder="Informasi tambahan untuk mentor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={requestMutation.isPending || !goals.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim Permintaan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mentorship Card Component
function MentorshipCard({
  mentorship,
  role,
  onUpdateStatus,
}: {
  mentorship: Mentorship;
  role: 'mentor' | 'mentee';
  onUpdateStatus: (status: string) => void;
}) {
  const config = STATUS_CONFIG[mentorship.status];
  const StatusIcon = config.icon;
  const person = role === 'mentee' ? mentorship.mentor : mentorship.mentee;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={person?.avatar_url || undefined} />
            <AvatarFallback className="bg-slate-100 text-slate-700">
              {person?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {person?.full_name || 'Unknown'}
                </h3>
                <p className="text-xs text-slate-500">
                  {role === 'mentee' ? 'Mentor Anda' : 'Mentee Anda'}
                </p>
              </div>
              <Badge className={cn('text-[10px]', config.color)}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
            </div>

            {/* Progress */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium text-slate-900">
                  {mentorship.progress_percentage}%
                </span>
              </div>
              <Progress value={mentorship.progress_percentage} className="h-2" />
            </div>

            {/* Goals */}
            {mentorship.goals && mentorship.goals.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-700">Tujuan:</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {mentorship.goals.slice(0, 2).map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <Target className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-600" />
                      {goal}
                    </li>
                  ))}
                  {mentorship.goals.length > 2 && (
                    <li className="text-slate-400">+{mentorship.goals.length - 2} lainnya</li>
                  )}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              {mentorship.status === 'pending' && role === 'mentor' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50"
                    onClick={() => onUpdateStatus('cancelled')}
                  >
                    Tolak
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onUpdateStatus('active')}
                  >
                    Terima
                  </Button>
                </>
              )}
              {mentorship.status === 'active' && (
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

