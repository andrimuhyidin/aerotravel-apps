/**
 * Security Settings Client
 * Manage feature flags, system settings, and app info
 */

'use client';

import { Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureFlagsManager } from '@/components/admin/feature-flags-manager';
import { RewardsManager } from '@/components/admin/rewards-manager';
import { SettingsCategory } from '@/components/admin/settings/settings-category';

export function SecuritySettingsClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Security & System</h1>
          <p className="text-sm text-muted-foreground">
            Feature flags, system configuration, dan app info
          </p>
        </div>
      </div>

      <Tabs defaultValue="feature-flags" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1 p-1">
          <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="app-info">App Info</TabsTrigger>
          <TabsTrigger value="rewards">Rewards Config</TabsTrigger>
        </TabsList>

        <TabsContent value="feature-flags" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Feature Flags</h2>
              <p className="text-sm text-muted-foreground">
                Enable/disable fitur aplikasi secara real-time
              </p>
            </div>
            <FeatureFlagsManager />
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SettingsCategory
            title="System Settings"
            description="Konfigurasi sistem seperti data retention dan email asuransi"
            prefixes={[]}
            legacyKeys={['data_retention_days', 'insurance_email']}
          />
        </TabsContent>

        <TabsContent value="app-info" className="mt-6">
          <SettingsCategory
            title="App Info"
            description="Konfigurasi per-app seperti warna header dan settings"
            prefixes={['app.']}
          />
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Rewards Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Kelola rewards, badges, dan incentives
              </p>
            </div>
            <RewardsManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

