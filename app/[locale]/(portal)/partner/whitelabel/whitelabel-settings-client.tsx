/**
 * Partner Whitelabel Settings Client Component
 * REDESIGNED - Preview card, Color pickers, Logo upload
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/partner';
import { logger } from '@/lib/utils/logger';
import { Palette, Upload, Eye, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { WhitelabelSettings } from '@/lib/partner/profile-service';

export function WhitelabelSettingsClient({ 
  locale,
  initialSettings 
}: { 
  locale: string;
  initialSettings: WhitelabelSettings;
}) {
  const [settings, setSettings] = useState<WhitelabelSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/partner/whitelabel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      logger.error('Failed to save whitelabel settings', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Whitelabel Settings"
        description="Personalisasi platform dengan brand Anda"
      />

      <div className="space-y-4 px-4 pb-20">
        {/* Enable Toggle */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-foreground">Enable Whitelabel</p>
              <p className="text-sm text-muted-foreground">
                Aktifkan branding kustom untuk platform Anda
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </CardContent>
        </Card>

        {/* Preview Card */}
        {settings.enabled && (
          <Card className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Eye className="h-4 w-4" />
                Preview
              </div>
              <div
                className="rounded-lg p-6"
                style={{
                  backgroundColor: settings.primaryColor,
                  color: '#ffffff',
                }}
              >
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="mb-2 h-12" />
                ) : (
                  <div className="mb-2 text-2xl font-bold">{settings.companyName}</div>
                )}
                <p className="text-sm opacity-90">Platform Travel Anda</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Name */}
        {settings.enabled && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <Label htmlFor="companyName">Nama Perusahaan</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="Nama perusahaan Anda"
              />
            </CardContent>
          </Card>
        )}

        {/* Logo Upload */}
        {settings.enabled && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <Label>Logo Perusahaan</Label>
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                    <Palette className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Colors */}
        {settings.enabled && (
          <Card>
            <CardContent className="space-y-4 p-4">
              <h3 className="font-semibold text-foreground">Brand Colors</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="h-10 w-20"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="h-10 w-20"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Domain */}
        {settings.enabled && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <Label htmlFor="customDomain">Custom Domain (Opsional)</Label>
              <Input
                id="customDomain"
                value={settings.customDomain || ''}
                onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                placeholder="travel.yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                Hubungi support untuk setup custom domain
              </p>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          <Save className="mr-2 h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}
