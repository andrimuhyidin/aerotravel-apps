'use client';

/**
 * Email Template Editor Component
 * Edit email templates with preview and variable helpers
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Code,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Send,
  Variable,
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
import { ErrorState } from '@/components/ui/error-state';
import { sanitizeHtml } from '@/lib/templates/utils';
import { logger } from '@/lib/utils/logger';

type EmailTemplate = {
  id: string;
  template_key: string;
  name: string;
  subject_template: string;
  body_html_template: string;
  body_text_template: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function EmailTemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editedTemplate, setEditedTemplate] = useState<Partial<EmailTemplate>>({});
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const queryClient = useQueryClient();

  const {
    data: templatesData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ templates: EmailTemplate[] }>({
    queryKey: ['admin', 'templates', 'email'],
    queryFn: async () => {
      const res = await fetch('/api/admin/templates/email');
      if (!res.ok) throw new Error('Failed to fetch email templates');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; updates: Partial<EmailTemplate> }) => {
      const res = await fetch(`/api/admin/templates/email/${data.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update template');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates', 'email'] });
      toast.success('Template berhasil diupdate');
      setEditedTemplate({});
    },
    onError: (error) => {
      logger.error('Failed to update email template', error);
      toast.error(error.message);
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (data: { key: string; email: string }) => {
      const res = await fetch(`/api/admin/templates/email/${data.key}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_email: data.email }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send test email');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`Test email sent to ${variables.email}`);
      setTestEmailDialogOpen(false);
      setTestEmailAddress('');
    },
    onError: (error) => {
      logger.error('Failed to send test email', error);
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({ key: selectedTemplate, updates: editedTemplate });
  };

  const hasChanges = Object.keys(editedTemplate).length > 0;

  const templates = templatesData?.templates || [];
  const currentTemplate = templates.find((t) => t.template_key === selectedTemplate);

  const getValue = (field: keyof EmailTemplate) => {
    if (editedTemplate[field] !== undefined) {
      return editedTemplate[field];
    }
    return currentTemplate?.[field] ?? '';
  };

  const handleChange = (field: keyof EmailTemplate, value: unknown) => {
    setEditedTemplate((prev) => ({ ...prev, [field]: value }));
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
    return <ErrorState message="Gagal memuat email templates" onRetry={() => void refetch()} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Template List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Email Templates</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-colors hover:border-primary ${
                selectedTemplate === template.template_key ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                setSelectedTemplate(template.template_key);
                setEditedTemplate({});
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.template_key}</p>
                  </div>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Belum ada email templates.
            </p>
          )}
        </div>
      </div>

      {/* Template Editor */}
      <div className="space-y-4 lg:col-span-2">
        {currentTemplate ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {currentTemplate.name}
                    </CardTitle>
                    <CardDescription>
                      Key: {currentTemplate.template_key}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="is_active" className="text-sm">
                      Active
                    </Label>
                    <Switch
                      id="is_active"
                      checked={getValue('is_active') as boolean}
                      onCheckedChange={(checked) => handleChange('is_active', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={getValue('name') as string}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label>Subject Template</Label>
                  <Input
                    value={getValue('subject_template') as string}
                    onChange={(e) => handleChange('subject_template', e.target.value)}
                    placeholder="Subject with {{variable}} placeholders"
                  />
                </div>

                {/* HTML Body */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>HTML Body</Label>
                    <div className="flex rounded-md border">
                      <Button
                        type="button"
                        variant={previewMode === 'code' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => setPreviewMode('code')}
                      >
                        <Code className="mr-1 h-4 w-4" />
                        Code
                      </Button>
                      <Button
                        type="button"
                        variant={previewMode === 'preview' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="rounded-l-none"
                        onClick={() => setPreviewMode('preview')}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  {previewMode === 'code' ? (
                    <Textarea
                      value={getValue('body_html_template') as string}
                      onChange={(e) => handleChange('body_html_template', e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                      placeholder="<html>...</html>"
                    />
                  ) : (
                    <div
                      className="min-h-[300px] rounded-md border bg-white p-4"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml((getValue('body_html_template') as string) || ''),
                      }}
                    />
                  )}
                </div>

                {/* Variables */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Variable className="h-4 w-4" />
                    Available Variables
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(currentTemplate.variables || []).map((variable) => (
                      <Badge key={variable} variant="outline" className="font-mono">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                    {(currentTemplate.variables || []).length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        No variables defined
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setTestEmailDialogOpen(true)}
                disabled={testEmailMutation.isPending}
              >
                {testEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
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
          </>
        ) : (
          <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center text-muted-foreground">
              Pilih template untuk mengedit
            </CardContent>
          </Card>
        )}
      </div>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter an email address to send a test email with this template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                disabled={testEmailMutation.isPending}
              />
            </div>
            {currentTemplate && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">Template: {currentTemplate.name}</p>
                <p className="text-xs text-muted-foreground">
                  Sample variables will be used for testing
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestEmailDialogOpen(false);
                setTestEmailAddress('');
              }}
              disabled={testEmailMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedTemplate || !testEmailAddress) return;
                testEmailMutation.mutate({
                  key: selectedTemplate,
                  email: testEmailAddress,
                });
              }}
              disabled={!testEmailAddress || testEmailMutation.isPending}
            >
              {testEmailMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

