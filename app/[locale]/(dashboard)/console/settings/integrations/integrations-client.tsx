/**
 * Integrations Settings Client Component
 * Manage third-party API integrations with secure key storage
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Mail,
  MessageSquare,
  Plug,
  Save,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import queryKeys from '@/lib/queries/query-keys';

type IntegrationConfig = Record<string, string | boolean>;

type Integration = {
  id: string;
  provider: string;
  category: string;
  config: IntegrationConfig;
  is_enabled: boolean;
  is_verified: boolean;
  updated_at: string;
};

type IntegrationsResponse = {
  integrations: Integration[];
  grouped: Record<string, Integration[]>;
  categories: string[];
};

const CATEGORY_ICONS = {
  whatsapp: MessageSquare,
  payment: CreditCard,
  email: Mail,
  analytics: BarChart3,
};

const CATEGORY_LABELS = {
  whatsapp: 'WhatsApp',
  payment: 'Pembayaran',
  email: 'Email',
  analytics: 'Analytics',
};

const PROVIDER_CONFIGS: Record<
  string,
  { label: string; fields: { key: string; label: string; type: 'text' | 'password' | 'boolean' }[] }
> = {
  fonnte: {
    label: 'Fonnte WhatsApp',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'device_token', label: 'Device Token', type: 'password' },
      { key: 'webhook_url', label: 'Webhook URL', type: 'text' },
    ],
  },
  midtrans: {
    label: 'Midtrans',
    fields: [
      { key: 'server_key', label: 'Server Key', type: 'password' },
      { key: 'client_key', label: 'Client Key', type: 'password' },
      { key: 'is_production', label: 'Production Mode', type: 'boolean' },
    ],
  },
  xendit: {
    label: 'Xendit',
    fields: [
      { key: 'secret_key', label: 'Secret Key', type: 'password' },
      { key: 'callback_token', label: 'Callback Token', type: 'password' },
      { key: 'is_production', label: 'Production Mode', type: 'boolean' },
    ],
  },
  resend: {
    label: 'Resend Email',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'from_email', label: 'From Email', type: 'text' },
      { key: 'from_name', label: 'From Name', type: 'text' },
    ],
  },
  posthog: {
    label: 'PostHog',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'host', label: 'Host URL', type: 'text' },
    ],
  },
  ga4: {
    label: 'Google Analytics 4',
    fields: [
      { key: 'measurement_id', label: 'Measurement ID', type: 'text' },
      { key: 'api_secret', label: 'API Secret', type: 'password' },
    ],
  },
};

export function IntegrationsClient() {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<IntegrationConfig>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<IntegrationsResponse>({
    queryKey: [...(queryKeys.admin?.settings?.all() || ['admin', 'settings']), 'integrations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings/integrations');
      if (!res.ok) throw new Error('Failed to fetch integrations');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      provider: string;
      category: string;
      config: IntegrationConfig;
      is_enabled: boolean;
    }) => {
      const res = await fetch('/api/admin/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error || 'Failed to update integration');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Integrasi berhasil disimpan');
      queryClient.invalidateQueries({
        queryKey: [...(queryKeys.admin?.settings?.all() || ['admin', 'settings']), 'integrations'],
      });
      setEditingId(null);
      setFormData({});
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan integrasi');
    },
  });

  const handleEdit = (integration: Integration) => {
    setEditingId(integration.id);
    setFormData({ ...integration.config, is_enabled: integration.is_enabled });
  };

  const handleSave = (integration: Integration) => {
    updateMutation.mutate({
      provider: integration.provider,
      category: integration.category,
      config: formData,
      is_enabled: formData.is_enabled as boolean,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-medium">Gagal memuat integrasi</h3>
        <p className="text-sm text-muted-foreground">Silakan coba lagi nanti</p>
      </div>
    );
  }

  const grouped = data?.grouped || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Plug className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Integrasi</h1>
          <p className="text-sm text-muted-foreground">
            Kelola API keys dan konfigurasi layanan pihak ketiga
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
            return (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(CATEGORY_LABELS).map(([category]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {(grouped[category] || []).map((integration) => {
                const providerConfig = PROVIDER_CONFIGS[integration.provider];
                const isEditing = editingId === integration.id;

                return (
                  <Card key={integration.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {providerConfig?.label || integration.provider}
                        </CardTitle>
                        <Badge variant={integration.is_enabled ? 'default' : 'secondary'}>
                          {integration.is_enabled ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Aktif
                            </>
                          ) : (
                            'Nonaktif'
                          )}
                        </Badge>
                      </div>
                      <CardDescription>
                        {integration.is_verified
                          ? 'Terverifikasi'
                          : 'Belum dikonfigurasi'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {providerConfig?.fields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-xs">{field.label}</Label>
                          {field.type === 'boolean' ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={
                                  isEditing
                                    ? (formData[field.key] as boolean) || false
                                    : (integration.config[field.key] as boolean) || false
                                }
                                onCheckedChange={(checked) =>
                                  isEditing && setFormData({ ...formData, [field.key]: checked })
                                }
                                disabled={!isEditing}
                              />
                              <span className="text-sm text-muted-foreground">
                                {(isEditing ? formData[field.key] : integration.config[field.key])
                                  ? 'Ya'
                                  : 'Tidak'}
                              </span>
                            </div>
                          ) : (
                            <div className="relative">
                              <Input
                                type={
                                  field.type === 'password' && !showSecrets[field.key]
                                    ? 'password'
                                    : 'text'
                                }
                                value={
                                  isEditing
                                    ? (formData[field.key] as string) || ''
                                    : (integration.config[field.key] as string) || ''
                                }
                                onChange={(e) =>
                                  isEditing &&
                                  setFormData({ ...formData, [field.key]: e.target.value })
                                }
                                disabled={!isEditing}
                                className="pr-10"
                                placeholder={isEditing ? `Masukkan ${field.label}` : ''}
                              />
                              {field.type === 'password' && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => toggleSecret(field.key)}
                                >
                                  {showSecrets[field.key] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {isEditing && (
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={(formData.is_enabled as boolean) || false}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, is_enabled: checked })
                              }
                            />
                            <span className="text-sm">
                              {formData.is_enabled ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSave(integration)}
                              disabled={updateMutation.isPending}
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              Simpan
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              Batal
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(integration)}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Konfigurasi
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {(!grouped[category] || grouped[category].length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada integrasi untuk kategori ini</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

