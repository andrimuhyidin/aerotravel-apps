'use client';

/**
 * About Page Manager Component
 * Manage about page content (story, vision, mission, stats, values, awards)
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/ui/error-state';

type AboutStat = {
  id: string;
  label: string;
  value: string;
  display_order: number;
  is_active: boolean;
};

type AboutValue = {
  id: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
};

type AboutAward = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export function AboutManager() {
  const [activeTab, setActiveTab] = useState('content');
  const queryClient = useQueryClient();

  const {
    data: contentData,
    isLoading: isLoadingContent,
    error: contentError,
  } = useQuery<{ content: any }>({
    queryKey: ['admin', 'about', 'content'],
    queryFn: async () => {
      const res = await fetch('/api/about');
      if (!res.ok) throw new Error('Failed to fetch about content');
      return res.json();
    },
  });

  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<{ stats: AboutStat[] }>({
    queryKey: ['admin', 'about', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/about/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const {
    data: valuesData,
    isLoading: isLoadingValues,
    error: valuesError,
  } = useQuery<{ values: AboutValue[] }>({
    queryKey: ['admin', 'about', 'values'],
    queryFn: async () => {
      const res = await fetch('/api/admin/about/values');
      if (!res.ok) throw new Error('Failed to fetch values');
      return res.json();
    },
  });

  const {
    data: awardsData,
    isLoading: isLoadingAwards,
    error: awardsError,
  } = useQuery<{ awards: AboutAward[] }>({
    queryKey: ['admin', 'about', 'awards'],
    queryFn: async () => {
      const res = await fetch('/api/admin/about/awards');
      if (!res.ok) throw new Error('Failed to fetch awards');
      return res.json();
    },
  });

  if (isLoadingContent || isLoadingStats || isLoadingValues || isLoadingAwards) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (contentError || statsError || valuesError || awardsError) {
    return <ErrorState message="Gagal memuat about content" />;
  }

  const content = contentData?.content;
  const stats = statsData?.stats || [];
  const values = valuesData?.values || [];
  const awards = awardsData?.awards || [];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="content">Story/Vision/Mission</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <AboutContentEditor content={content} />
        </TabsContent>

        <TabsContent value="stats">
          <AboutStatsManager stats={stats} />
        </TabsContent>

        <TabsContent value="values">
          <AboutValuesManager values={values} />
        </TabsContent>

        <TabsContent value="awards">
          <AboutAwardsManager awards={awards} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AboutContentEditor({ content }: { content: any }) {
  const [editedContent, setEditedContent] = useState({
    story: content?.story || '',
    vision: content?.vision || '',
    mission: content?.mission || '',
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `about.${data.key}`, value: data.value, branch_id: null }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about'] });
      toast.success('Content berhasil diupdate');
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={editedContent.story}
            onChange={(e) =>
              setEditedContent({ ...editedContent, story: e.target.value })
            }
            rows={6}
          />
          <Button
            onClick={() =>
              updateMutation.mutate({ key: 'story', value: editedContent.story })
            }
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Story
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={editedContent.vision}
            onChange={(e) =>
              setEditedContent({ ...editedContent, vision: e.target.value })
            }
            rows={3}
          />
          <Button
            onClick={() =>
              updateMutation.mutate({ key: 'vision', value: editedContent.vision })
            }
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Vision
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={editedContent.mission}
            onChange={(e) =>
              setEditedContent({ ...editedContent, mission: e.target.value })
            }
            rows={4}
          />
          <Button
            onClick={() =>
              updateMutation.mutate({ key: 'mission', value: editedContent.mission })
            }
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Mission
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AboutStatsManager({ stats }: { stats: AboutStat[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Partial<AboutStat>) => {
      const res = await fetch('/api/admin/about/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create stat');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'stats'] });
      toast.success('Stat berhasil dibuat');
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<AboutStat> }) => {
      const res = await fetch(`/api/admin/about/stats/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update stat');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'stats'] });
      toast.success('Stat berhasil diupdate');
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/about/stats/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete stat');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'stats'] });
      toast.success('Stat berhasil dihapus');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stat
        </Button>
      </div>

      {isCreating && (
        <StatForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setIsCreating(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) =>
          editingId === stat.id ? (
            <StatForm
              key={stat.id}
              stat={stat}
              onSave={(data) => updateMutation.mutate({ id: stat.id, updates: data })}
              onCancel={() => setEditingId(null)}
              isLoading={updateMutation.isPending}
            />
          ) : (
            <Card key={stat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(stat.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(stat.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}

function StatForm({
  stat,
  onSave,
  onCancel,
  isLoading,
}: {
  stat?: AboutStat;
  onSave: (data: Partial<AboutStat>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<AboutStat>>({
    label: stat?.label || '',
    value: stat?.value || '',
    display_order: stat?.display_order || 0,
    is_active: stat?.is_active ?? true,
  });

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{stat ? 'Edit Stat' : 'Create Stat'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
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
      </CardContent>
    </Card>
  );
}

function AboutValuesManager({ values }: { values: AboutValue[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Partial<AboutValue>) => {
      const res = await fetch('/api/admin/about/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create value');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'values'] });
      toast.success('Value berhasil dibuat');
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<AboutValue> }) => {
      const res = await fetch(`/api/admin/about/values/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update value');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'values'] });
      toast.success('Value berhasil diupdate');
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/about/values/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete value');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'values'] });
      toast.success('Value berhasil dihapus');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Value
        </Button>
      </div>

      {isCreating && (
        <ValueForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setIsCreating(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {values.map((value) =>
          editingId === value.id ? (
            <ValueForm
              key={value.id}
              value={value}
              onSave={(data) => updateMutation.mutate({ id: value.id, updates: data })}
              onCancel={() => setEditingId(null)}
              isLoading={updateMutation.isPending}
            />
          ) : (
            <Card key={value.id}>
              <CardHeader>
                <CardTitle>{value.title}</CardTitle>
                <CardDescription>{value.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(value.id)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(value.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}

function ValueForm({
  value,
  onSave,
  onCancel,
  isLoading,
}: {
  value?: AboutValue;
  onSave: (data: Partial<AboutValue>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<AboutValue>>({
    title: value?.title || '',
    description: value?.description || '',
    icon_name: value?.icon_name || '',
    display_order: value?.display_order || 0,
    is_active: value?.is_active ?? true,
  });

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{value ? 'Edit Value' : 'Create Value'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Icon Name (Lucide)</Label>
            <Input
              value={formData.icon_name || ''}
              onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
              placeholder="Shield, Heart, Award, etc."
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2">
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
      </CardContent>
    </Card>
  );
}

function AboutAwardsManager({ awards }: { awards: AboutAward[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Partial<AboutAward>) => {
      const res = await fetch('/api/admin/about/awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create award');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'awards'] });
      toast.success('Award berhasil dibuat');
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<AboutAward> }) => {
      const res = await fetch(`/api/admin/about/awards/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update award');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'awards'] });
      toast.success('Award berhasil diupdate');
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/about/awards/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete award');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'about', 'awards'] });
      toast.success('Award berhasil dihapus');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Award
        </Button>
      </div>

      {isCreating && (
        <AwardForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setIsCreating(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {awards.map((award) =>
          editingId === award.id ? (
            <AwardForm
              key={award.id}
              award={award}
              onSave={(data) => updateMutation.mutate({ id: award.id, updates: data })}
              onCancel={() => setEditingId(null)}
              isLoading={updateMutation.isPending}
            />
          ) : (
            <Card key={award.id}>
              <CardHeader>
                <CardTitle>{award.name}</CardTitle>
                <CardDescription>{award.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(award.id)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(award.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}

function AwardForm({
  award,
  onSave,
  onCancel,
  isLoading,
}: {
  award?: AboutAward;
  onSave: (data: Partial<AboutAward>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<AboutAward>>({
    name: award?.name || '',
    description: award?.description || '',
    display_order: award?.display_order || 0,
    is_active: award?.is_active ?? true,
  });

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{award ? 'Edit Award' : 'Create Award'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2">
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
      </CardContent>
    </Card>
  );
}

