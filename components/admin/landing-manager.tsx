'use client';

/**
 * Landing Pages Manager Component
 * Manage landing page content (Guide, Partner, Corporate)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/ui/error-state';

export function LandingManager() {
  const [activeTab, setActiveTab] = useState<'guide' | 'partner' | 'corporate'>('guide');
  const queryClient = useQueryClient();

  const {
    data: settingsData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ settings: Array<{ key: string; value: string }> }>({
    queryKey: ['admin', 'settings', 'landing'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings?prefix=landing.');
      if (!res.ok) throw new Error('Failed to fetch landing settings');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: data.key, value: data.value, branch_id: null }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update setting');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'landing'] });
      toast.success('Landing page content berhasil diupdate');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Gagal memuat landing settings" onRetry={refetch} />;
  }

  const settings = settingsData?.settings || [];
  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || '[]';

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="guide">Guide Landing</TabsTrigger>
          <TabsTrigger value="partner">Partner Landing</TabsTrigger>
          <TabsTrigger value="corporate">Corporate Landing</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-4">
          <LandingContentEditor
            type="guide"
            benefitsKey="landing.guide.benefits"
            requirementsKey="landing.guide.requirements"
            statsKey="landing.guide.stats"
            benefitsValue={getSetting('landing.guide.benefits')}
            requirementsValue={getSetting('landing.guide.requirements')}
            statsValue={getSetting('landing.guide.stats')}
            onUpdate={(key, value) => updateMutation.mutate({ key, value })}
            isLoading={updateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="partner" className="space-y-4">
          <LandingContentEditor
            type="partner"
            benefitsKey="landing.partner.benefits"
            featuresKey="landing.partner.features"
            benefitsValue={getSetting('landing.partner.benefits')}
            featuresValue={getSetting('landing.partner.features')}
            onUpdate={(key, value) => updateMutation.mutate({ key, value })}
            isLoading={updateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="corporate" className="space-y-4">
          <LandingContentEditor
            type="corporate"
            benefitsKey="landing.corporate.benefits"
            featuresKey="landing.corporate.features"
            benefitsValue={getSetting('landing.corporate.benefits')}
            featuresValue={getSetting('landing.corporate.features')}
            onUpdate={(key, value) => updateMutation.mutate({ key, value })}
            isLoading={updateMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LandingContentEditor({
  type,
  benefitsKey,
  requirementsKey,
  statsKey,
  featuresKey,
  benefitsValue,
  requirementsValue,
  statsValue,
  featuresValue,
  onUpdate,
  isLoading,
}: {
  type: 'guide' | 'partner' | 'corporate';
  benefitsKey: string;
  requirementsKey?: string;
  statsKey?: string;
  featuresKey?: string;
  benefitsValue: string;
  requirementsValue?: string;
  statsValue?: string;
  featuresValue?: string;
  onUpdate: (key: string, value: string) => void;
  isLoading: boolean;
}) {
  const [benefits, setBenefits] = useState(benefitsValue);
  const [requirements, setRequirements] = useState(requirementsValue || '[]');
  const [stats, setStats] = useState(statsValue || '[]');
  const [features, setFeatures] = useState(featuresValue || '[]');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Benefits</CardTitle>
          <CardDescription>JSON array of benefits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            className="font-mono text-sm"
            rows={10}
            placeholder='[{"icon": "DollarSign", "title": "...", "description": "..."}]'
          />
          <Button
            onClick={() => onUpdate(benefitsKey, benefits)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Benefits
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {type === 'guide' && requirementsKey && (
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>JSON array of requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="font-mono text-sm"
              rows={8}
              placeholder='["Requirement 1", "Requirement 2"]'
            />
            <Button
              onClick={() => onUpdate(requirementsKey, requirements)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Requirements
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {type === 'guide' && statsKey && (
        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
            <CardDescription>JSON array of stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={stats}
              onChange={(e) => setStats(e.target.value)}
              className="font-mono text-sm"
              rows={6}
              placeholder='[{"icon": "Users", "value": "500+", "label": "Guide Aktif"}]'
            />
            <Button
              onClick={() => onUpdate(statsKey, stats)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Stats
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {type !== 'guide' && featuresKey && (
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>JSON array of features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="font-mono text-sm"
              rows={8}
              placeholder='["Feature 1", "Feature 2"]'
            />
            <Button
              onClick={() => onUpdate(featuresKey, features)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Features
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

