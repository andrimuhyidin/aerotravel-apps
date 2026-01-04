/**
 * Settings Overview Client
 * Dashboard with quick links to all settings categories
 */

'use client';

import Link from 'next/link';
import { ArrowRight, Settings } from 'lucide-react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { SETTINGS_CATEGORIES } from '@/components/admin/settings/settings-sidebar';

type SettingsOverviewClientProps = {
  locale: string;
};

export function SettingsOverviewClient({ locale }: SettingsOverviewClientProps) {
  // Filter out overview from categories for the grid
  const categories = SETTINGS_CATEGORIES.filter((cat) => cat.id !== 'overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua pengaturan sistem dalam satu tempat
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard variant="subtle" className="p-4">
          <p className="text-xs text-muted-foreground">Total Categories</p>
          <p className="text-2xl font-bold">{categories.length}</p>
        </GlassCard>
        <GlassCard variant="subtle" className="p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge variant="default" className="mt-1 bg-emerald-500">Active</Badge>
        </GlassCard>
        <GlassCard variant="subtle" className="p-4">
          <p className="text-xs text-muted-foreground">Environment</p>
          <p className="text-lg font-semibold">Production</p>
        </GlassCard>
        <GlassCard variant="subtle" className="p-4">
          <p className="text-xs text-muted-foreground">Last Updated</p>
          <p className="text-lg font-semibold">Today</p>
        </GlassCard>
      </div>

      {/* Categories Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Settings Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link key={category.id} href={`/${locale}${category.href}`}>
                <GlassCard className="h-full group cursor-pointer">
                  <GlassCardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="pt-0">
                    <GlassCardTitle className="text-base mb-1">
                      {category.label}
                    </GlassCardTitle>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </GlassCardContent>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/${locale}/console/settings/technical`}>
            <GlassCard variant="subtle" className="p-4 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Configure AI</p>
                  <p className="text-xs text-muted-foreground">
                    Setup AI provider, model, dan API keys
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          </Link>
          <Link href={`/${locale}/console/settings/branding`}>
            <GlassCard variant="subtle" className="p-4 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Update Branding</p>
                  <p className="text-xs text-muted-foreground">
                    Logo, warna, dan identitas perusahaan
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          </Link>
          <Link href={`/${locale}/console/settings/security`}>
            <GlassCard variant="subtle" className="p-4 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Feature Flags</p>
                  <p className="text-xs text-muted-foreground">
                    Enable/disable fitur aplikasi
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          </Link>
          <Link href={`/${locale}/console/settings/content`}>
            <GlassCard variant="subtle" className="p-4 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Manage Content</p>
                  <p className="text-xs text-muted-foreground">
                    Email templates, FAQs, dan legal pages
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  );
}

