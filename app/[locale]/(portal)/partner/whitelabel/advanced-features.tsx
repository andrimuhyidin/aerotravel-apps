/**
 * Advanced Whitelabel Features Components
 * Custom Domain, Email Templates, Booking Widget
 */

'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';
import {
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  Mail,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function AdvancedWhitelabelFeatures() {
  const [activeTab, setActiveTab] = useState('domain');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="domain">
          <Globe className="h-4 w-4 mr-2" />
          Custom Domain
        </TabsTrigger>
        <TabsTrigger value="email">
          <Mail className="h-4 w-4 mr-2" />
          Email Templates
        </TabsTrigger>
        <TabsTrigger value="widget">
          <Upload className="h-4 w-4 mr-2" />
          Booking Widget
        </TabsTrigger>
      </TabsList>

      <TabsContent value="domain">
        <CustomDomainTab />
      </TabsContent>

      <TabsContent value="email">
        <EmailTemplatesTab />
      </TabsContent>

      <TabsContent value="widget">
        <BookingWidgetTab />
      </TabsContent>
    </Tabs>
  );
}

// Custom Domain Tab Component
function CustomDomainTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [verified, setVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  useEffect(() => {
    loadDomainSettings();
  }, []);

  const loadDomainSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partner/whitelabel');
      if (response.ok) {
        const data = await response.json();
        setCustomDomain(data.customDomain || '');
        setVerified(data.customDomainVerified || false);
      }
    } catch (error) {
      logger.error('Failed to load domain settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDomain = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/partner/whitelabel/domain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save domain');
      }

      const data = await response.json();
      setVerificationToken(data.verificationToken || '');
      setVerified(false);
      toast.success('Domain berhasil disimpan. Silakan verifikasi DNS.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menyimpan domain'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const response = await fetch('/api/partner/whitelabel/domain/verify', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      const data = await response.json();
      setVerified(data.verified || false);
      toast.success(
        data.verified ? 'Domain berhasil diverifikasi' : data.message
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal verifikasi'
      );
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domain</CardTitle>
        <CardDescription>
          Setup custom domain untuk booking widget Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Domain (contoh: booking.partner.com)
          </label>
          <div className="flex gap-2">
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="booking.partner.com"
            />
            <Button onClick={handleSaveDomain} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </div>

        {verificationToken && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">DNS Verification</p>
            <p className="text-sm text-muted-foreground">
              Tambahkan TXT record berikut ke DNS domain Anda:
            </p>
            <div className="flex items-center gap-2 p-2 bg-background rounded border">
              <code className="flex-1 text-sm">
                aero-verify={verificationToken}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `aero-verify=${verificationToken}`
                  );
                  toast.success('TXT record copied to clipboard');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {verified ? (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Domain verified
                </span>
              ) : (
                <>
                  <Button
                    onClick={handleVerify}
                    disabled={verifying}
                    size="sm"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Verify DNS
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Pastikan TXT record sudah ditambahkan sebelum verifikasi
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Email Templates Tab Component
function EmailTemplatesTab() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    null
  );
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partner/whitelabel/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      logger.error('Failed to load templates', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (type: string) => {
    setSelectedTemplate(type);
    setTemplateDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
        <CardDescription>
          Kustomisasi template email untuk customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {templates.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">
                  {item.type
                    .split('_')
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.template ? 'Template aktif' : 'Belum ada template'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleEditTemplate(item.type)}
              >
                {item.template ? 'Edit' : 'Buat Template'}
              </Button>
            </div>
          ))}
        </div>

        {selectedTemplate && (
          <EmailTemplateEditor
            templateType={selectedTemplate}
            open={templateDialogOpen}
            onOpenChange={setTemplateDialogOpen}
            onSuccess={() => {
              loadTemplates();
              setTemplateDialogOpen(false);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Email Template Editor Dialog
function EmailTemplateEditor({
  templateType,
  open,
  onOpenChange,
  onSuccess,
}: {
  templateType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');

  useEffect(() => {
    if (open) {
      loadTemplate();
    }
  }, [open, templateType]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/partner/whitelabel/email-templates/${templateType}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.template) {
          setSubject(data.template.subject);
          setBodyHtml(data.template.bodyHtml);
        }
      }
    } catch (error) {
      logger.error('Failed to load template', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/partner/whitelabel/email-templates/${templateType}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            bodyHtml,
            isActive: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      toast.success('Template berhasil disimpan');
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menyimpan template'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast.error('Masukkan email test terlebih dahulu');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(
        `/api/partner/whitelabel/email-templates/${templateType}/test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testEmail }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test email');
      }

      toast.success('Test email berhasil dikirim');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengirim test email'
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Template:{' '}
            {templateType
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </DialogTitle>
          <DialogDescription>
            Gunakan variabel seperti {`{{customer_name}}`},{' '}
            {`{{booking_code}}`} untuk personalisasi
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Konfirmasi Booking {{booking_code}}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Body (HTML)
              </label>
              <Textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="<p>Halo {{customer_name}}, booking Anda {{booking_code}} telah dikonfirmasi.</p>"
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Test Email
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing || !testEmail}
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Test'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !subject || !bodyHtml}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Booking Widget Tab Component
function BookingWidgetTab() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [widgetScript, setWidgetScript] = useState('');

  useEffect(() => {
    loadWidgetConfig();
  }, []);

  useEffect(() => {
    if (apiKey) {
      const script = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id'}/widget/partner/${apiKey}.js"></script>`;
      setWidgetScript(script);
    }
  }, [apiKey]);

  const loadWidgetConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partner/whitelabel/widget/config');
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled || false);
        setApiKey(data.apiKey || '');
      }
    } catch (error) {
      logger.error('Failed to load widget config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const response = await fetch(
        '/api/partner/whitelabel/widget/generate-key',
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate API key');
      }

      const data = await response.json();
      setApiKey(data.apiKey);
      setEnabled(true);
      toast.success('API key berhasil dibuat');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal membuat API key'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Widget</CardTitle>
        <CardDescription>
          Embed booking widget ke website Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!apiKey ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate API key untuk menggunakan booking widget
            </p>
            <Button onClick={handleGenerateKey} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate API Key'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Widget Embed Script
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={widgetScript}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(widgetScript);
                    toast.success('Script copied to clipboard');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Copy script di atas dan paste ke website Anda
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <div className="flex items-center gap-2">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    toast.success('API key copied to clipboard');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Jangan bagikan API key Anda ke pihak lain
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

