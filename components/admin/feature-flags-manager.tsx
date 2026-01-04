'use client';

/**
 * Feature Flags Manager Component
 * Toggle and configure feature flags from admin console
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Flag,
  Loader2,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ErrorState } from '@/components/ui/error-state';
import { logger } from '@/lib/utils/logger';

type FeatureFlag = {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_roles: string[] | null;
  target_users: string[] | null;
  target_branches: string[] | null;
  created_at: string;
  updated_at: string;
};

export function FeatureFlagsManager() {
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [editedFlag, setEditedFlag] = useState<Partial<FeatureFlag>>({});
  const [showAddNew, setShowAddNew] = useState(false);
  const [newFlag, setNewFlag] = useState({ flag_key: '', flag_name: '', description: '' });
  const queryClient = useQueryClient();

  const {
    data: flagsData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ flags: FeatureFlag[] }>({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/feature-flags');
      if (!res.ok) throw new Error('Failed to fetch feature flags');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; updates: Partial<FeatureFlag> }) => {
      const res = await fetch(`/api/admin/feature-flags/${data.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update feature flag');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast.success('Feature flag berhasil diupdate');
      setEditedFlag({});
    },
    onError: (error) => {
      logger.error('Failed to update feature flag', error);
      toast.error(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newFlag) => {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create feature flag');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast.success('Feature flag berhasil dibuat');
      setShowAddNew(false);
      setNewFlag({ flag_key: '', flag_name: '', description: '' });
    },
    onError: (error) => {
      logger.error('Failed to create feature flag', error);
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`/api/admin/feature-flags/${key}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete feature flag');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast.success('Feature flag berhasil dihapus');
      setSelectedFlag(null);
    },
    onError: (error) => {
      logger.error('Failed to delete feature flag', error);
      toast.error('Gagal menghapus feature flag');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/feature-flags/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: enabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle feature flag');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
    },
    onError: (error) => {
      logger.error('Failed to toggle feature flag', error);
      toast.error('Gagal mengubah status feature flag');
    },
  });

  const handleSave = () => {
    if (!selectedFlag) return;
    updateMutation.mutate({ key: selectedFlag, updates: editedFlag });
  };

  const hasChanges = Object.keys(editedFlag).length > 0;

  const flags = flagsData?.flags || [];
  const currentFlag = flags.find((f) => f.flag_key === selectedFlag);

  const getValue = (field: keyof FeatureFlag) => {
    if (editedFlag[field] !== undefined) {
      return editedFlag[field];
    }
    return currentFlag?.[field] ?? '';
  };

  const handleChange = (field: keyof FeatureFlag, value: unknown) => {
    setEditedFlag((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Gagal memuat feature flags" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          <h3 className="font-semibold">Feature Flags</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddNew(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Flag
          </Button>
        </div>
      </div>

      {/* Add New Flag Form */}
      {showAddNew && (
        <Card className="border-dashed border-primary">
          <CardHeader>
            <CardTitle className="text-base">Create New Feature Flag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Flag Key</Label>
                <Input
                  placeholder="my-new-feature"
                  value={newFlag.flag_key}
                  onChange={(e) => setNewFlag((p) => ({ ...p, flag_key: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase, use hyphens or underscores
                </p>
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  placeholder="My New Feature"
                  value={newFlag.flag_name}
                  onChange={(e) => setNewFlag((p) => ({ ...p, flag_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="What this feature does..."
                value={newFlag.description}
                onChange={(e) => setNewFlag((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddNew(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newFlag)}
                disabled={!newFlag.flag_key || !newFlag.flag_name || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flags List */}
      <div className="grid gap-4 lg:grid-cols-2">
        {flags.map((flag) => (
          <Card
            key={flag.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedFlag === flag.flag_key ? 'border-primary ring-1 ring-primary' : ''
            }`}
            onClick={() => {
              setSelectedFlag(flag.flag_key);
              setEditedFlag({});
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{flag.flag_name}</h4>
                    {flag.is_enabled ? (
                      <Badge className="bg-green-500">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{flag.flag_key}</p>
                  {flag.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{flag.description}</p>
                  )}
                  {flag.rollout_percentage > 0 && flag.rollout_percentage < 100 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Percent className="h-3 w-3" />
                      {flag.rollout_percentage}% rollout
                    </div>
                  )}
                  {(flag.target_roles?.length ?? 0) > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {flag.target_roles?.join(', ')}
                    </div>
                  )}
                </div>
                <Switch
                  checked={flag.is_enabled}
                  onCheckedChange={(checked) => {
                    toggleMutation.mutate({ key: flag.flag_key, enabled: checked });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {flags.length === 0 && (
          <Card className="col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              Belum ada feature flags. Klik &quot;Add Flag&quot; untuk membuat.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Flag Editor */}
      {currentFlag && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Edit: {currentFlag.flag_name}</CardTitle>
                <CardDescription>{currentFlag.flag_key}</CardDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Yakin ingin menghapus feature flag ini?')) {
                    deleteMutation.mutate(currentFlag.flag_key);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name & Description */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={getValue('flag_name') as string}
                  onChange={(e) => handleChange('flag_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={(getValue('description') as string) || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>

            {/* Rollout Percentage */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Rollout Percentage</Label>
                <span className="text-sm font-medium">
                  {getValue('rollout_percentage')}%
                </span>
              </div>
              <Slider
                value={[getValue('rollout_percentage') as number]}
                onValueChange={([value]) => handleChange('rollout_percentage', value)}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Fitur akan aktif untuk persentase pengguna yang ditentukan (jika is_enabled = true).
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className={hasChanges ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : hasChanges ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Tersimpan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

