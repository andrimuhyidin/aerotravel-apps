'use client';

/**
 * Loyalty Rewards Manager Component
 * Manage loyalty rewards catalog
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/ui/error-state';

type Reward = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  points_cost: number;
  value_in_rupiah: number | null;
  image_url: string | null;
  stock: number | null;
  valid_until: string | null;
  terms: string[];
  is_active: boolean;
  display_order: number;
};

export function RewardsManager() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: rewardsData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ rewards: Reward[] }>({
    queryKey: ['admin', 'loyalty-rewards'],
    queryFn: async () => {
      const res = await fetch('/api/admin/loyalty-rewards');
      if (!res.ok) throw new Error('Failed to fetch rewards');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Reward>) => {
      const res = await fetch('/api/admin/loyalty-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create reward');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'loyalty-rewards'] });
      toast.success('Reward berhasil dibuat');
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Reward> }) => {
      const res = await fetch(`/api/admin/loyalty-rewards/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update reward');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'loyalty-rewards'] });
      toast.success('Reward berhasil diupdate');
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/loyalty-rewards/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete reward');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'loyalty-rewards'] });
      toast.success('Reward berhasil dihapus');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Gagal memuat rewards" onRetry={refetch} />;
  }

  const rewards = rewardsData?.rewards || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reward
        </Button>
      </div>

      {isCreating && (
        <RewardForm
          onSave={(data) => {
            createMutation.mutate(data);
          }}
          onCancel={() => setIsCreating(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rewards.map((reward) =>
          editingId === reward.id ? (
            <RewardForm
              key={reward.id}
              reward={reward}
              onSave={(data) => {
                updateMutation.mutate({ id: reward.id, updates: data });
              }}
              onCancel={() => setEditingId(null)}
              isLoading={updateMutation.isPending}
            />
          ) : (
            <Card key={reward.id}>
              <CardHeader>
                <CardTitle className="text-lg">{reward.name}</CardTitle>
                <CardDescription>{reward.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points Cost:</span>
                    <span className="font-semibold">{reward.points_cost.toLocaleString()}</span>
                  </div>
                  {reward.value_in_rupiah && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Value:</span>
                      <span className="font-semibold">
                        Rp {reward.value_in_rupiah.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {reward.stock !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock:</span>
                      <span className="font-semibold">{reward.stock}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-semibold">{reward.category || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(reward.id)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(reward.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {rewards.length === 0 && (
          <p className="col-span-2 py-8 text-center text-muted-foreground">
            Belum ada rewards.
          </p>
        )}
      </div>
    </div>
  );
}

function RewardForm({
  reward,
  onSave,
  onCancel,
  isLoading,
}: {
  reward?: Reward;
  onSave: (data: Partial<Reward>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Reward>>({
    name: reward?.name || '',
    description: reward?.description || '',
    category: reward?.category || 'voucher',
    points_cost: reward?.points_cost || 0,
    value_in_rupiah: reward?.value_in_rupiah || null,
    image_url: reward?.image_url || null,
    stock: reward?.stock ?? null,
    valid_until: reward?.valid_until || null,
    terms: reward?.terms || [],
    is_active: reward?.is_active ?? true,
    display_order: reward?.display_order || 0,
  });

  const [termsText, setTermsText] = useState(
    Array.isArray(formData.terms) ? formData.terms.join('\n') : ''
  );

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{reward ? 'Edit Reward' : 'Create Reward'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category || 'voucher'}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voucher">Voucher</SelectItem>
                <SelectItem value="discount">Discount</SelectItem>
                <SelectItem value="merchandise">Merchandise</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Points Cost</Label>
            <Input
              type="number"
              value={formData.points_cost}
              onChange={(e) =>
                setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Value (Rp)</Label>
            <Input
              type="number"
              value={formData.value_in_rupiah || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  value_in_rupiah: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Stock (null = unlimited)</Label>
            <Input
              type="number"
              value={formData.stock || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Terms (one per line)</Label>
          <Textarea
            value={termsText}
            onChange={(e) => {
              setTermsText(e.target.value);
              setFormData({
                ...formData,
                terms: e.target.value.split('\n').filter((t) => t.trim()),
              });
            }}
            rows={3}
            placeholder="Term 1&#10;Term 2&#10;Term 3"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Active</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={() => onSave(formData)} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

