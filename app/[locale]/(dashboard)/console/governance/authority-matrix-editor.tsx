/**
 * Authority Matrix Editor Component
 * Full CRUD for authority matrix rules
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Edit2,
  Loader2,
  Plus,
  Save,
  Shield,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';

type AuthorityRule = {
  id: string;
  action_type: string;
  action_name: string;
  description: string | null;
  required_roles: string[];
  min_approvers: number;
  threshold_amount: number | null;
  is_active: boolean;
};

type AvailableRole = {
  id: string;
  name: string;
};

type MatrixResponse = {
  rules: AuthorityRule[];
  availableRoles: AvailableRole[];
  total: number;
};

export function AuthorityMatrixEditor() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AuthorityRule | null>(null);
  const [formData, setFormData] = useState<Partial<AuthorityRule>>({});
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<MatrixResponse>({
    queryKey: [...queryKeys.admin.all, 'governance', 'authority-matrix'],
    queryFn: async () => {
      const res = await fetch('/api/admin/governance/authority-matrix');
      if (!res.ok) throw new Error('Failed to fetch authority matrix');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (rule: Partial<AuthorityRule>) => {
      const res = await fetch('/api/admin/governance/authority-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (!res.ok) throw new Error('Failed to save rule');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Rule berhasil disimpan');
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, 'governance', 'authority-matrix'],
      });
      closeDialog();
    },
    onError: () => {
      toast.error('Gagal menyimpan rule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/governance/authority-matrix?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete rule');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Rule berhasil dihapus');
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, 'governance', 'authority-matrix'],
      });
    },
    onError: () => {
      toast.error('Gagal menghapus rule');
    },
  });

  const openCreateDialog = () => {
    setEditingRule(null);
    setFormData({
      action_type: '',
      action_name: '',
      description: '',
      required_roles: [],
      min_approvers: 1,
      is_active: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (rule: AuthorityRule) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingRule(null);
    setFormData({});
  };

  const toggleRole = (roleId: string) => {
    const currentRoles = formData.required_roles || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter((r) => r !== roleId)
      : [...currentRoles, roleId];
    setFormData({ ...formData, required_roles: newRoles });
  };

  const handleSave = () => {
    if (!formData.action_type || !formData.action_name) {
      toast.error('Action type dan nama wajib diisi');
      return;
    }
    if (!formData.required_roles || formData.required_roles.length === 0) {
      toast.error('Pilih minimal satu role');
      return;
    }

    saveMutation.mutate({
      ...formData,
      id: editingRule?.id,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus rule ini?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Gagal memuat data</p>
        </CardContent>
      </Card>
    );
  }

  const rules = data?.rules || [];
  const availableRoles = data?.availableRoles || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authority Matrix
              </CardTitle>
              <CardDescription>Konfigurasi wewenang berdasarkan role</CardDescription>
            </div>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Aksi</th>
                  <th className="text-left p-3">Roles yang Diizinkan</th>
                  <th className="text-center p-3">Min. Approver</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-center p-3 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{rule.action_name}</p>
                      <p className="text-xs text-muted-foreground">{rule.action_type}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {rule.required_roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {availableRoles.find((r) => r.id === role)?.name || role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">{rule.min_approvers}</td>
                    <td className="p-3 text-center">
                      {rule.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rules.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Belum ada rule yang dikonfigurasi
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Tambah Rule Baru'}</DialogTitle>
            <DialogDescription>Konfigurasi wewenang untuk aksi tertentu</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action Type (ID)</Label>
              <Input
                value={formData.action_type || ''}
                onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                placeholder="Contoh: booking_cancel"
                disabled={!!editingRule}
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Aksi</Label>
              <Input
                value={formData.action_name || ''}
                onChange={(e) => setFormData({ ...formData, action_name: e.target.value })}
                placeholder="Contoh: Batalkan Booking"
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi opsional..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Roles yang Diizinkan</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                {availableRoles.map((role) => (
                  <div key={role.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={formData.required_roles?.includes(role.id) || false}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <label htmlFor={`role-${role.id}`} className="text-sm cursor-pointer">
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Minimum Approvers</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.min_approvers || 1}
                onChange={(e) =>
                  setFormData({ ...formData, min_approvers: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Rule Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

