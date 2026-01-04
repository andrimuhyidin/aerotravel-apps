/**
 * Technical Settings Client
 * Quick links to AI, Maps, Weather, Rate Limits and Integrations settings
 */

'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CloudSun,
  MapPin,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from '@/components/ui/glass-card';
import { SettingsCategory } from '@/components/admin/settings/settings-category';

type TechnicalSettingsClientProps = {
  locale: string;
};

const TECHNICAL_LINKS = [
  {
    id: 'ai',
    title: 'AI Configuration',
    description: 'Gemini, OpenAI, Anthropic - Model dan API keys',
    icon: Sparkles,
    href: '/console/settings/ai',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'maps',
    title: 'Maps Configuration',
    description: 'Google Maps dan Mapbox API settings',
    icon: MapPin,
    href: '/console/settings/maps',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'weather',
    title: 'Weather Configuration',
    description: 'Weather alerts dan threshold settings',
    icon: CloudSun,
    href: '/console/settings/weather',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    id: 'rate-limit',
    title: 'Rate Limit Configuration',
    description: 'Redis dan API rate limiting',
    icon: Shield,
    href: '/console/settings/rate-limit',
    color: 'bg-red-100 text-red-600',
  },
];

export function TechnicalSettingsClient({ locale }: TechnicalSettingsClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Technical</h1>
          <p className="text-sm text-muted-foreground">
            AI, Maps, Weather, Rate Limits, dan Integrations
          </p>
        </div>
      </div>

      {/* Quick Links to Technical Config Pages */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Configuration Pages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TECHNICAL_LINKS.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.id} href={`/${locale}${item.href}`}>
                <GlassCard className="h-full group cursor-pointer">
                  <GlassCardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="pt-0">
                    <GlassCardTitle className="text-base mb-1">
                      {item.title}
                    </GlassCardTitle>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </GlassCardContent>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Database Settings */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold mb-4">Database Settings</h2>
        <Tabs defaultValue="rate-limits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
            <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="rate-limits" className="mt-6">
            <SettingsCategory
              title="Rate Limits"
              description="Konfigurasi rate limiting untuk berbagai endpoint"
              prefixes={['rate_limits.']}
            />
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <SettingsCategory
              title="Integrations"
              description="Konfigurasi timeout dan retry untuk integrasi eksternal"
              prefixes={['integrations.']}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

