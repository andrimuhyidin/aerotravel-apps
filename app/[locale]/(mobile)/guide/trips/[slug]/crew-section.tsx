'use client';

/**
 * Trip Crew Section Component
 * Displays crew members for a trip with role-based permissions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Plus, Shield, Users } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import queryKeys from '@/lib/queries/query-keys';

type CrewMember = {
  id: string;
  guide_id: string;
  role: 'lead' | 'support';
  status: string;
  assigned_at: string;
  confirmed_at: string | null;
  assignment_notes: string | null;
  guide: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
};

type TripCrewResponse = {
  crew: CrewMember[];
  currentUserRole: 'lead' | 'support' | null;
  currentUserId?: string; // Current user ID for matching
  isLeadGuide: boolean;
  isSupportGuide: boolean;
  isCrewMember: boolean;
  isOpsAdmin: boolean;
};

type CrewSectionProps = {
  tripId: string;
  locale: string;
};

export function CrewSection({ tripId, locale }: CrewSectionProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'lead' | 'support'>('support');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<TripCrewResponse>({
    queryKey: queryKeys.guide.team.tripTeam(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/crew/trip/${tripId}`);
      if (!res.ok) {
        throw new Error('Gagal memuat crew');
      }
      return (await res.json()) as TripCrewResponse;
    },
  });

  // Check if current member can confirm (must be assigned to this trip)
  // Find member where guide_id matches current user ID
  const currentMember = data?.crew.find(c => 
    data?.currentUserId ? c.guide_id === data.currentUserId : c.role === data?.currentUserRole
  );

  const assignMutation = useMutation({
    mutationFn: async (payload: { guide_id: string; role: 'lead' | 'support' }) => {
      const res = await fetch(`/api/guide/crew/trip/${tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal assign crew');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.team.tripTeam(tripId) });
      setAssignDialogOpen(false);
      setSelectedGuideId('');
      setSelectedRole('support');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (crewId: string) => {
      const res = await fetch(`/api/guide/crew/trip/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crew_id: crewId, status: 'confirmed' }),
      });
      if (!res.ok) {
        throw new Error('Gagal konfirmasi assignment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.team.tripTeam(tripId) });
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
            message={error instanceof Error ? error.message : 'Gagal memuat crew'}
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const crew = data?.crew ?? [];
  const isLeadGuide = data?.isLeadGuide ?? false;
  const isOpsAdmin = data?.isOpsAdmin ?? false;
  const canManageCrew = isOpsAdmin; // Only ops/admin can assign/remove

  const leadGuide = crew.find((c) => c.role === 'lead');
  const supportGuides = crew.filter((c) => c.role === 'support');

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-5 w-5 text-emerald-600" />
              Trip Crew
            </CardTitle>
            {canManageCrew && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setAssignDialogOpen(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah Crew
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lead Guide */}
          {leadGuide ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase">Lead Guide</span>
              </div>
              <div className="flex items-center gap-3">
                {leadGuide.guide?.avatar_url ? (
                  <img
                    src={leadGuide.guide.avatar_url}
                    alt={leadGuide.guide.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Users className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{leadGuide.guide?.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {leadGuide.status === 'confirmed' ? '✓ Dikonfirmasi' : 'Menunggu konfirmasi'}
                  </p>
                </div>
                {currentMember && leadGuide.id === currentMember.id && leadGuide.status !== 'confirmed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => confirmMutation.mutate(leadGuide.id)}
                    disabled={confirmMutation.isPending}
                  >
                    Konfirmasi
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-center">
              <p className="text-xs text-amber-700">Belum ada Lead Guide</p>
            </div>
          )}

          {/* Support Guides - Always shown */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase">
                Support Guides {supportGuides.length > 0 && `(${supportGuides.length})`}
              </span>
            </div>
            {supportGuides.length > 0 ? (
              <div className="space-y-2">
                {supportGuides.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    {member.guide?.avatar_url ? (
                      <img
                        src={member.guide.avatar_url}
                        alt={member.guide.full_name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Users className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {member.guide?.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.status === 'confirmed' ? '✓ Dikonfirmasi' : 'Menunggu konfirmasi'}
                      </p>
                    </div>
                    {currentMember && member.id === currentMember.id && member.status !== 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => confirmMutation.mutate(member.id)}
                        disabled={confirmMutation.isPending}
                      >
                        Konfirmasi
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-center">
                <p className="text-xs text-slate-500">Belum ada Support Guide</p>
              </div>
            )}
          </div>

          {crew.length === 0 && (
            <EmptyState
              icon={Users}
              title="Belum ada crew"
              description="Crew akan muncul setelah admin assign guide ke trip ini"
              variant="subtle"
            />
          )}
        </CardContent>
      </Card>

      {/* Assign Crew Dialog (Admin only) */}
      {canManageCrew && (
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Crew Member</DialogTitle>
              <DialogDescription>
                Pilih guide dan role untuk ditambahkan ke trip ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Guide ID</label>
                <Input
                  placeholder="Masukkan Guide ID atau cari di directory"
                  value={selectedGuideId}
                  onChange={(e) => setSelectedGuideId(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Note: Fitur pencarian guide akan ditambahkan di update berikutnya
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'lead' | 'support')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead Guide</SelectItem>
                    <SelectItem value="support">Support Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAssignDialogOpen(false);
                  setSelectedGuideId('');
                }}
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  if (selectedGuideId) {
                    assignMutation.mutate({
                      guide_id: selectedGuideId,
                      role: selectedRole,
                    });
                  }
                }}
                disabled={!selectedGuideId || assignMutation.isPending}
              >
                {assignMutation.isPending ? 'Menambahkan...' : 'Tambah'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
