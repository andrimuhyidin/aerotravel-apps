/**
 * Partner Team List Client Component
 * Displays team members with role assignment and performance
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/partner/page-header';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { Plus, Trash2, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  permissions: string[];
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

type TeamMemberWithPerformance = TeamMember & {
  performance?: {
    bookingCount: number;
    totalRevenue: number;
    totalCommission: number;
  };
};

export function TeamListClient({ locale }: { locale: string }) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent',
  });
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/partner/team');

        if (!response.ok) {
          throw new Error('Failed to load team members');
        }

        const data = (await response.json()) as { teamMembers: TeamMember[] };
        const members = data.teamMembers || [];

        // Load performance for each agent
        const membersWithPerformance = await Promise.all(
          members.map(async (member) => {
            if (member.role === 'agent') {
              try {
                const perfResponse = await fetch(`/api/partner/team/${member.id}`);
                if (perfResponse.ok) {
                  const perfData = (await perfResponse.json()) as {
                    performance?: {
                      bookingCount: number;
                      totalRevenue: number;
                      totalCommission: number;
                    };
                  };
                  return { ...member, performance: perfData.performance };
                }
              } catch (error) {
                logger.warn('Failed to load performance', {
                  memberId: member.id,
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }
            return member;
          })
        );

        if (mounted) {
          setTeamMembers(membersWithPerformance);
        }
      } catch (error) {
        logger.error('Failed to load team members', error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Gagal memuat daftar team';
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/partner/team');

      if (!response.ok) {
        throw new Error('Failed to load team members');
      }

      const data = (await response.json()) as { teamMembers: TeamMember[] };
      const members = data.teamMembers || [];

      // Load performance for each agent
      const membersWithPerformance = await Promise.all(
        members.map(async (member) => {
          if (member.role === 'agent') {
            try {
              const perfResponse = await fetch(`/api/partner/team/${member.id}`);
              if (perfResponse.ok) {
                const perfData = (await perfResponse.json()) as {
                  performance?: {
                    bookingCount: number;
                    totalRevenue: number;
                    totalCommission: number;
                  };
                };
                return { ...member, performance: perfData.performance };
              }
            } catch (error) {
              logger.warn('Failed to load performance', {
                memberId: member.id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
          return member;
        })
      );

      setTeamMembers(membersWithPerformance);
    } catch (error) {
      logger.error('Failed to load team members', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat daftar team';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      const response = await fetch('/api/partner/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite team member');
      }

      toast.success('Team member berhasil ditambahkan', {
        duration: 3000,
      });
      setShowInviteDialog(false);
      setInviteForm({ name: '', email: '', phone: '', role: 'agent' });
      await loadTeamMembers();
    } catch (error) {
      logger.error('Failed to invite team member', error);
      toast.error(
        error instanceof Error ? error.message : 'Gagal menambahkan team member'
      );
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteMemberId) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/partner/team/${deleteMemberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete team member');
      }

      toast.success('Team member berhasil dihapus', {
        duration: 3000,
      });
      setDeleteMemberId(null);
      await loadTeamMembers();
    } catch (error) {
      logger.error('Failed to delete team member', error);
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus team member'
      );
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      owner: { label: 'Owner', className: 'bg-purple-100 text-purple-800' },
      finance: { label: 'Finance', className: 'bg-blue-100 text-blue-800' },
      agent: { label: 'Agent', className: 'bg-green-100 text-green-800' },
    };

    const badge = badges[role] || {
      label: role,
      className: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6 px-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <LoadingState variant="skeleton-card" lines={3} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-6 px-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <ErrorState
              message={error}
              onRetry={loadTeamMembers}
              variant="card"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="space-y-4 py-6 px-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <EmptyState
              icon={Users}
              title="Belum ada team members"
              description="Tambahkan anggota team pertama Anda untuk mulai mengelola tim dan permissions."
              action={
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Team Member
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 px-4">
      {/* Header */}
      <PageHeader
        title="Kelola Team"
        description="Kelola anggota team dan permissions"
        action={
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Team Member
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Tambahkan anggota team baru dengan role dan permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={inviteForm.phone}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) =>
                    setInviteForm({ ...inviteForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} className="w-full">
                Invite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        }
      />

      {/* Team List */}
      <div className="space-y-4">
        {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{member.name}</span>
                          {getRoleBadge(member.role)}
                          {!member.is_active && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        {member.phone && (
                          <p className="text-sm text-muted-foreground">{member.phone}</p>
                        )}
                      </div>
                    </div>

                    {member.performance && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Bookings</div>
                          <div className="font-semibold">
                            {member.performance.bookingCount}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                          <div className="font-semibold">
                            {formatCurrency(member.performance.totalRevenue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Commission</div>
                          <div className="font-semibold">
                            {formatCurrency(member.performance.totalCommission)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteMemberId(member.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMemberId} onOpenChange={(open: boolean) => !open && setDeleteMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus team member ini? Tindakan ini tidak dapat dibatalkan.
              Team member akan kehilangan akses ke Partner Portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

