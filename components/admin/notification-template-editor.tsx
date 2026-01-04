'use client';

/**
 * Notification Template Editor Component
 * Edit WhatsApp/SMS/Push notification templates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
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
import { logger } from '@/lib/utils/logger';

type NotificationTemplate = {
  id: string;
  template_key: string;
  name: string;
  message_template: string;
  variables: string[];
  channel: 'whatsapp' | 'sms' | 'push';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  sms: '📱',
  push: '🔔',
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  push: 'Push Notification',
};

export function NotificationTemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editedTemplate, setEditedTemplate] = useState<Partial<NotificationTemplate>>({});
  const queryClient = useQueryClient();

  const {
    data: templatesData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ templates: NotificationTemplate[] }>({
    queryKey: ['admin', 'templates', 'notification'],
    queryFn: async () => {
      const res = await fetch('/api/admin/templates/notification');
      if (!res.ok) throw new Error('Failed to fetch notification templates');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; updates: Partial<NotificationTemplate> }) => {
      const res = await fetch(`/api/admin/templates/notification/${data.key}`, {
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates', 'notification'] });
      toast.success('Template berhasil diupdate');
      setEditedTemplate({});
    },
    onError: (error) => {
      logger.error('Failed to update notification template', error);
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

  const getValue = (field: keyof NotificationTemplate) => {
    if (editedTemplate[field] !== undefined) {
      return editedTemplate[field];
    }
    return currentTemplate?.[field] ?? '';
  };

  const handleChange = (field: keyof NotificationTemplate, value: unknown) => {
    setEditedTemplate((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate message length (for SMS limit)
  const messageLength = (getValue('message_template') as string)?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Gagal memuat notification templates" onRetry={() => void refetch()} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Template List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notification Templates</h3>
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
                  <div className="flex items-center gap-2">
                    <span>{CHANNEL_ICONS[template.channel]}</span>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.template_key}</p>
                    </div>
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
              Belum ada notification templates.
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
                      <MessageSquare className="h-5 w-5" />
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

                {/* Channel */}
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select
                    value={getValue('channel') as string}
                    onValueChange={(value) => handleChange('channel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">
                        {CHANNEL_ICONS.whatsapp} WhatsApp
                      </SelectItem>
                      <SelectItem value="sms">
                        {CHANNEL_ICONS.sms} SMS
                      </SelectItem>
                      <SelectItem value="push">
                        {CHANNEL_ICONS.push} Push Notification
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Template */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Message Template</Label>
                    <span
                      className={`text-xs ${
                        currentTemplate.channel === 'sms' && messageLength > 160
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {messageLength} characters
                      {currentTemplate.channel === 'sms' && ' (SMS limit: 160)'}
                    </span>
                  </div>
                  <Textarea
                    value={getValue('message_template') as string}
                    onChange={(e) => handleChange('message_template', e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Message with {{variable}} placeholders..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use *text* for bold (WhatsApp), _text_ for italic
                  </p>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="rounded-md border bg-slate-50 p-4">
                    <pre className="whitespace-pre-wrap text-sm">
                      {getValue('message_template') as string}
                    </pre>
                  </div>
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
          </>
        ) : (
          <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center text-muted-foreground">
              Pilih template untuk mengedit
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

