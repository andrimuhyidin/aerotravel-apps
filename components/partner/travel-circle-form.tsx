/**
 * Travel Circle Form Component
 * Create/edit travel circle
 */

'use client';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

type TravelCircleFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function TravelCircleForm({ open, onClose, onSuccess }: TravelCircleFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    preferredDestination: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/partner/travel-circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          targetAmount: parseFloat(formData.targetAmount),
          targetDate: formData.targetDate,
          preferredDestination: formData.preferredDestination || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create travel circle');
      }

      const data = await response.json();
      toast.success(data.message || 'Travel circle berhasil dibuat');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        targetDate: '',
        preferredDestination: '',
      });
      
      onSuccess();
    } catch (error) {
      logger.error('Failed to create travel circle', error);
      toast.error(error instanceof Error ? error.message : 'Gagal membuat travel circle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Travel Circle Baru</DialogTitle>
          <DialogDescription>
            Buat travel circle untuk group savings. Setelah target tercapai, booking akan otomatis dibuat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Travel Circle *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Arisan Pahawang Desember 2025"
              required
              minLength={3}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi travel circle..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (Rp) *</Label>
              <Input
                id="targetAmount"
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="5000000"
                required
                min={100000}
                step="10000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date *</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredDestination">Preferred Destination</Label>
            <Input
              id="preferredDestination"
              value={formData.preferredDestination}
              onChange={(e) => setFormData({ ...formData, preferredDestination: e.target.value })}
              placeholder="e.g., Pahawang Island"
              maxLength={255}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Travel Circle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

