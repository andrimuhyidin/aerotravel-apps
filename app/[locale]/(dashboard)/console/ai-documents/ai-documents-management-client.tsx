/**
 * AI Documents Management Client
 * Admin dashboard untuk manage AI documents dengan embedding status
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    Edit2,
    FileText,
    Loader2,
    Plus,
    Search,
    Sparkles,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type AiDocument = {
  id: string;
  title: string;
  document_type: 'sop' | 'faq' | 'policy' | 'product_info' | 'training';
  content: string;
  branch_id: string | null;
  metadata: Record<string, unknown> | null;
  is_active: boolean;
  embedding: number[] | null; // Will be null if not generated yet
  created_at: string;
  updated_at: string;
  created_by: string;
};

type AiDocumentsManagementClientProps = {
  locale: string;
};

const documentTypeLabels: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  sop: { label: 'SOP', icon: FileText, color: 'text-red-600 bg-red-50' },
  faq: { label: 'FAQ', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
  policy: { label: 'Policy', icon: FileText, color: 'text-purple-600 bg-purple-50' },
  product_info: { label: 'Product Info', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
  training: { label: 'Training', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
};

export function AiDocumentsManagementClient({ locale: _locale }: AiDocumentsManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AiDocument | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    document_type: 'sop' as const,
    content: '',
    branch_id: null as string | null,
    is_active: true,
  });

  const queryClient = useQueryClient();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-ai-documents-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ai-documents/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  // Fetch documents
  const { data, isLoading, error, refetch } = useQuery<{
    documents: AiDocument[];
  }>({
    queryKey: ['admin-ai-documents', typeFilter, isActiveFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('document_type', typeFilter);
      }
      if (isActiveFilter !== 'all') {
        params.append('is_active', isActiveFilter === 'active' ? 'true' : 'false');
      }

      const res = await fetch(`/api/admin/ai-documents?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/admin/ai-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create document');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-documents'] });
      setCreateDialogOpen(false);
      setFormData({ title: '', document_type: 'sop', content: '', branch_id: null, is_active: true });
      toast.success('Document created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create document');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/admin/ai-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update document');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-documents'] });
      setEditDialogOpen(false);
      setSelectedDocument(null);
      toast.success('Document updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update document');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/ai-documents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete document');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-documents'] });
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (doc: AiDocument) => {
    setSelectedDocument(doc);
    setFormData({
      title: doc.title,
      document_type: doc.document_type,
      content: doc.content,
      branch_id: doc.branch_id,
      is_active: doc.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedDocument || !formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    updateMutation.mutate({ id: selectedDocument.id, data: formData });
  };

  const handleDelete = (doc: AiDocument) => {
    setSelectedDocument(doc);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
  };

  const filteredDocuments = data?.documents?.filter((doc) => {
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !doc.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message="Failed to load documents" />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.total || 0}</div>
                <div className="text-xs text-slate-600">Total Documents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.active || 0}</div>
                <div className="text-xs text-slate-600">Active Documents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-emerald-600">{stats.withEmbedding || 0}</div>
                <div className="text-xs text-slate-600">With Embedding</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-600">{stats.withoutEmbedding || 0}</div>
                <div className="text-xs text-slate-600">Need Embedding</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sop">SOP</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="product_info">Product Info</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              setFormData({ title: '', document_type: 'sop', content: '', branch_id: null, is_active: true });
              setCreateDialogOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Document
          </Button>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents found"
            description="Create your first AI document to start building the knowledge base"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => {
              const typeInfo = documentTypeLabels[doc.document_type] || documentTypeLabels.sop;
              const TypeIcon = typeInfo.icon;

              return (
                <Card key={doc.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('rounded px-2 py-0.5 text-xs font-medium', typeInfo.color)}>
                            {typeInfo.label}
                          </span>
                          {doc.embedding ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                              <Sparkles className="h-3 w-3" />
                              Embedded
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              No Embedding
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-base font-semibold line-clamp-2">{doc.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600 line-clamp-3">{doc.content.substring(0, 150)}...</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {new Date(doc.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        {doc.is_active ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="text-slate-400">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(doc)}
                        className="flex-1"
                      >
                        <Edit2 className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create AI Document</DialogTitle>
            <DialogDescription>
              Create new document untuk AI knowledge base. Embedding akan di-generate otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Penanganan Bulu Babi"
              />
            </div>
            <div>
              <Label htmlFor="document_type">Document Type *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value: typeof formData.document_type) =>
                  setFormData({ ...formData, document_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sop">SOP (Standard Operating Procedure)</SelectItem>
                  <SelectItem value="faq">FAQ (Frequently Asked Questions)</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="product_info">Product Info</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Masukkan konten document..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Content akan digunakan untuk generate embedding. Pastikan jelas dan lengkap.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (document akan muncul di RAG search)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create & Generate Embedding
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit AI Document</DialogTitle>
            <DialogDescription>
              Update document. Embedding akan di-regenerate jika content berubah.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit_title">Title *</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_document_type">Document Type *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value: typeof formData.document_type) =>
                  setFormData({ ...formData, document_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sop">SOP</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="product_info">Product Info</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_content">Content *</Label>
              <Textarea
                id="edit_content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="edit_is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedDocument?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              variant="destructive"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
