/**
 * Partner Team Management Client Component
 * REDESIGNED - Clean cards, Role badges, Invite form
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader, StatusBadge } from '@/components/partner';
import { logger } from '@/lib/utils/logger';
import { Users, Plus, Mail, Shield, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import type { TeamMember } from '@/lib/partner/profile-service';

export function TeamManagementClient({ 
  locale,
  initialMembers 
}: { 
  locale: string;
  initialMembers: TeamMember[];
}) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);

  const handleRemove = async (memberId: string) => {
    if (!confirm('Yakin ingin menghapus anggota tim ini?')) return;

    try {
      const res = await fetch(`/api/partner/team/${memberId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove member');

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Anggota berhasil dihapus');
    } catch (error) {
      logger.error('Failed to remove member', error);
      toast.error('Gagal menghapus anggota');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'staff':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Manajemen Tim"
        description="Kelola akses tim Anda"
        action={
          <Button asChild>
            <Link href={`/${locale}/partner/team/invite`}>
              <Plus className="mr-2 h-4 w-4" />
              Undang
            </Link>
          </Button>
        }
      />

      <div className="space-y-2 px-4 pb-20">
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada anggota tim"
            description="Undang anggota tim untuk mulai berkolaborasi"
            action={
              <Button asChild>
                <Link href={`/${locale}/partner/team/invite`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Undang Anggota
                </Link>
              </Button>
            }
          />
        ) : (
          members.map((member) => (
            <Card key={member.id} className="hover:shadow-md">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{member.name}</h3>
                      <StatusBadge status={member.status as any} variant="pill" />
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(member.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between border-t pt-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span
                      className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${getRoleBadgeColor(member.role)}`}
                    >
                      {member.role.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Bergabung {new Date(member.joinedAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
