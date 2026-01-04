/**
 * Operations Settings Client
 * Manage geofencing, validation, approvals, and guide bonus settings
 */

'use client';

import { Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsCategory } from '@/components/admin/settings/settings-category';

export function OperationsSettingsClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Wrench className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Operations</h1>
          <p className="text-sm text-muted-foreground">
            Geofencing, validasi, approval limits, dan guide bonus
          </p>
        </div>
      </div>

      <Tabs defaultValue="geofencing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-1 p-1">
          <TabsTrigger value="geofencing">GPS & Geofencing</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="approvals">Approval Limits</TabsTrigger>
          <TabsTrigger value="guide-bonus">Guide Bonus</TabsTrigger>
          <TabsTrigger value="legacy">Legacy</TabsTrigger>
        </TabsList>

        <TabsContent value="geofencing" className="mt-6">
          <SettingsCategory
            title="GPS & Geofencing"
            description="Konfigurasi timeout, max age, dan radius geofence"
            prefixes={['geofencing.']}
          />
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          <SettingsCategory
            title="Validation Rules"
            description="Aturan validasi untuk kode paket, nama, slug, dll"
            prefixes={['validation.']}
          />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <SettingsCategory
            title="Approval Limits"
            description="Batas approval berdasarkan role"
            prefixes={['approvals.']}
          />
        </TabsContent>

        <TabsContent value="guide-bonus" className="mt-6">
          <SettingsCategory
            title="Guide Bonus"
            description="Konfigurasi bonus untuk guide berdasarkan performa"
            prefixes={['guide_bonus.']}
          />
        </TabsContent>

        <TabsContent value="legacy" className="mt-6">
          <SettingsCategory
            title="Legacy Operational"
            description="Settings operasional lama"
            prefixes={[]}
            legacyKeys={[
              'geofence_radius_meters',
              'late_penalty_amount',
              'late_threshold_minutes',
              'sla_ticket_minutes',
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

