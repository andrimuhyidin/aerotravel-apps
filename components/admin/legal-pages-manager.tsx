'use client';

/**
 * Legal Pages Manager Component
 * Manage legal pages (Terms, Privacy, DPO) with rich text editor
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, Save } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/ui/error-state';
import { sanitizeHtml } from '@/lib/templates/utils';

type LegalPage = {
  id: string;
  page_type: 'terms' | 'privacy' | 'dpo';
  title: string;
  content_html: string;
  last_updated: string;
  is_active: boolean;
};

export function LegalPagesManager() {
  const [selectedType, setSelectedType] = useState<'terms' | 'privacy' | 'dpo'>('terms');
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const queryClient = useQueryClient();

  const {
    data: pagesData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ pages: LegalPage[] }>({
    queryKey: ['admin', 'legal-pages'],
    queryFn: async () => {
      const res = await fetch('/api/admin/legal-pages');
      if (!res.ok) throw new Error('Failed to fetch legal pages');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { type: string; content_html: string; title?: string }) => {
      const res = await fetch(`/api/admin/legal-pages/${data.type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_html: data.content_html,
          ...(data.title && { title: data.title }),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update page');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'legal-pages'] });
      toast.success('Legal page berhasil diupdate');
      setEditedContent({});
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal update page');
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
    return <ErrorState message="Gagal memuat legal pages" onRetry={refetch} />;
  }

  const pages = pagesData?.pages || [];
  const currentPage = pages.find((p) => p.page_type === selectedType);
  const editedHtml = editedContent[selectedType] ?? currentPage?.content_html ?? '';

  return (
    <div className="space-y-4">
      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
        <TabsList>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="dpo">DPO</TabsTrigger>
        </TabsList>

        {['terms', 'privacy', 'dpo'].map((type) => {
          const page = pages.find((p) => p.page_type === type);
          const content = editedContent[type] ?? page?.content_html ?? '';

          return (
            <TabsContent key={type} value={type} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{page?.title || `${type} Page`}</CardTitle>
                  <CardDescription>
                    Last updated:{' '}
                    {page?.last_updated
                      ? new Date(page.last_updated).toLocaleString('id-ID')
                      : 'Never'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>HTML Content</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewMode(previewMode === 'code' ? 'preview' : 'code')
                        }
                      >
                        {previewMode === 'code' ? (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Code
                          </>
                        )}
                      </Button>
                    </div>

                    {previewMode === 'code' ? (
                      <Textarea
                        value={content}
                        onChange={(e) =>
                          setEditedContent({ ...editedContent, [type]: e.target.value })
                        }
                        className="font-mono text-sm"
                        rows={20}
                        placeholder="Enter HTML content..."
                      />
                    ) : (
                      <div
                        className="min-h-[400px] rounded-md border p-4 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(content),
                        }}
                      />
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        updateMutation.mutate({
                          type,
                          content_html: editedContent[type] || page?.content_html || '',
                          title: page?.title,
                        });
                      }}
                      disabled={!editedContent[type] || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

