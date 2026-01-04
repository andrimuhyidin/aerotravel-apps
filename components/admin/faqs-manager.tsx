'use client';

/**
 * FAQs Manager Component
 * Manage FAQs with filters
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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

type FAQ = {
  id: string;
  app_type: string | null;
  package_id: string | null;
  category: string | null;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
};

export function FAQsManager() {
  const [selectedAppType, setSelectedAppType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: faqsData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ faqs: FAQ[] }>({
    queryKey: ['admin', 'faqs', selectedAppType, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedAppType !== 'all') params.append('app_type', selectedAppType);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      const res = await fetch(`/api/admin/faqs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch FAQs');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<FAQ>) => {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create FAQ');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      toast.success('FAQ berhasil dibuat');
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<FAQ> }) => {
      const res = await fetch(`/api/admin/faqs/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update FAQ');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      toast.success('FAQ berhasil diupdate');
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete FAQ');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      toast.success('FAQ berhasil dihapus');
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
    return <ErrorState message="Gagal memuat FAQs" onRetry={refetch} />;
  }

  const faqs = faqsData?.faqs || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={selectedAppType} onValueChange={setSelectedAppType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="App Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Apps</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="guide">Guide</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="package">Package</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="cancellation">Cancellation</SelectItem>
              <SelectItem value="itinerary">Itinerary</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      {isCreating && (
        <FAQForm
          onSave={(data) => {
            createMutation.mutate(data);
          }}
          onCancel={() => setIsCreating(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="space-y-2">
        {faqs.map((faq) =>
          editingId === faq.id ? (
            <FAQForm
              key={faq.id}
              faq={faq}
              onSave={(data) => {
                updateMutation.mutate({ id: faq.id, updates: data });
              }}
              onCancel={() => setEditingId(null)}
              isLoading={updateMutation.isPending}
            />
          ) : (
            <Card key={faq.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{faq.question}</h3>
                    <span className="text-xs text-muted-foreground">
                      ({faq.app_type || 'all'} / {faq.category || 'general'})
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(faq.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(faq.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {faqs.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">Belum ada FAQs.</p>
        )}
      </div>
    </div>
  );
}

function FAQForm({
  faq,
  onSave,
  onCancel,
  isLoading,
}: {
  faq?: FAQ;
  onSave: (data: Partial<FAQ>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<FAQ>>({
    app_type: faq?.app_type || 'public',
    category: faq?.category || 'general',
    question: faq?.question || '',
    answer: faq?.answer || '',
    display_order: faq?.display_order || 0,
    is_active: faq?.is_active ?? true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{faq ? 'Edit FAQ' : 'Create FAQ'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>App Type</Label>
            <Select
              value={formData.app_type || 'public'}
              onValueChange={(v) => setFormData({ ...formData, app_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="package">Package</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category || 'general'}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="cancellation">Cancellation</SelectItem>
                <SelectItem value="itinerary">Itinerary</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Question</Label>
          <Input
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Answer</Label>
          <Textarea
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            rows={4}
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

