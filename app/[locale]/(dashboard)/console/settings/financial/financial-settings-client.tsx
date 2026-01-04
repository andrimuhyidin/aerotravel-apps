/**
 * Financial Settings Client
 * Manage finance, loyalty, partner rewards, and payment settings
 */

'use client';

import { DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsCategory } from '@/components/admin/settings/settings-category';

export function FinancialSettingsClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Financial</h1>
          <p className="text-sm text-muted-foreground">
            Finance, loyalty, partner rewards, dan payment settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="finance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1 p-1">
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="partner-rewards">Partner Rewards</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="finance" className="mt-6">
          <SettingsCategory
            title="Financial Settings"
            description="Tarif pajak, deposit, platform fee, dan struktur biaya"
            prefixes={['finance.']}
          />
        </TabsContent>

        <TabsContent value="loyalty" className="mt-6">
          <SettingsCategory
            title="Loyalty Program"
            description="Poin per transaksi, tier levels, dan referral bonus"
            prefixes={['loyalty.']}
          />
        </TabsContent>

        <TabsContent value="partner-rewards" className="mt-6">
          <SettingsCategory
            title="Partner Rewards"
            description="Program rewards khusus partner/mitra"
            prefixes={['partner_rewards.']}
          />
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <SettingsCategory
            title="Payment Settings"
            description="Split bill, poin, dan referral legacy"
            prefixes={[]}
            legacyKeys={[
              'split_bill_expiry_hours',
              'points_per_100k',
              'referral_bonus_points',
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

