'use client';

/**
 * Advanced Metrics Dashboard Component
 * Displays all advanced metrics with tab navigation
 */

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerSatisfactionMetrics } from '@/components/guide/metrics-customer-satisfaction';
import { EfficiencyMetrics } from '@/components/guide/metrics-efficiency';
import { FinancialMetrics } from '@/components/guide/metrics-financial';
import { QualityMetrics } from '@/components/guide/metrics-quality';
import { GrowthMetrics } from '@/components/guide/metrics-growth';
import { ComparativeMetrics } from '@/components/guide/metrics-comparative';
import { SustainabilityMetrics } from '@/components/guide/metrics-sustainability';
import { OperationsMetrics } from '@/components/guide/metrics-operations';
import { SafetyMetrics } from '@/components/guide/metrics-safety';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type AdvancedMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function AdvancedMetrics({ metrics, className }: AdvancedMetricsProps) {
  // Determine initial tab based on available metrics
  const getInitialTab = () => {
    if (metrics.customerSatisfaction) return 'customer';
    if (metrics.efficiency) return 'efficiency';
    if (metrics.financial) return 'financial';
    if (metrics.quality) return 'quality';
    if (metrics.growth) return 'growth';
    if (metrics.comparative) return 'comparative';
    if (metrics.sustainability) return 'sustainability';
    if (metrics.operations) return 'operations';
    if (metrics.safety) return 'safety';
    return 'customer';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  // Check if any advanced metrics are available
  // Always show tabs if metrics object exists (even if data is null/undefined)
  // This ensures the UI shows that the feature is implemented
  const hasAdvancedMetrics =
    metrics.customerSatisfaction !== undefined ||
    metrics.efficiency !== undefined ||
    metrics.financial !== undefined ||
    metrics.quality !== undefined ||
    metrics.growth !== undefined ||
    metrics.comparative !== undefined ||
    metrics.sustainability !== undefined ||
    metrics.operations !== undefined ||
    metrics.safety !== undefined;

  if (!hasAdvancedMetrics) {
    return null;
  }

  return (
    <div className={className}>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
          {metrics.customerSatisfaction !== undefined && (
            <TabsTrigger value="customer" className="text-xs">
              Customer
            </TabsTrigger>
          )}
          {metrics.efficiency !== undefined && (
            <TabsTrigger value="efficiency" className="text-xs">
              Efficiency
            </TabsTrigger>
          )}
          {metrics.financial !== undefined && (
            <TabsTrigger value="financial" className="text-xs">
              Financial
            </TabsTrigger>
          )}
          {metrics.quality !== undefined && (
            <TabsTrigger value="quality" className="text-xs">
              Quality
            </TabsTrigger>
          )}
          {metrics.growth !== undefined && (
            <TabsTrigger value="growth" className="text-xs">
              Growth
            </TabsTrigger>
          )}
          {metrics.comparative !== undefined && (
            <TabsTrigger value="comparative" className="text-xs">
              Compare
            </TabsTrigger>
          )}
          {metrics.sustainability !== undefined && (
            <TabsTrigger value="sustainability" className="text-xs">
              Waste
            </TabsTrigger>
          )}
          {metrics.operations !== undefined && (
            <TabsTrigger value="operations" className="text-xs">
              Ops
            </TabsTrigger>
          )}
          {metrics.safety !== undefined && (
            <TabsTrigger value="safety" className="text-xs">
              Safety
            </TabsTrigger>
          )}
        </TabsList>

        {metrics.customerSatisfaction !== undefined && (
          <TabsContent value="customer" className="mt-4">
            <CustomerSatisfactionMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.efficiency !== undefined && (
          <TabsContent value="efficiency" className="mt-4">
            <EfficiencyMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.financial !== undefined && (
          <TabsContent value="financial" className="mt-4">
            <FinancialMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.quality !== undefined && (
          <TabsContent value="quality" className="mt-4">
            <QualityMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.growth !== undefined && (
          <TabsContent value="growth" className="mt-4">
            <GrowthMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.comparative !== undefined && (
          <TabsContent value="comparative" className="mt-4">
            <ComparativeMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.sustainability !== undefined && (
          <TabsContent value="sustainability" className="mt-4">
            <SustainabilityMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.operations !== undefined && (
          <TabsContent value="operations" className="mt-4">
            <OperationsMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.safety !== undefined && (
          <TabsContent value="safety" className="mt-4">
            <SafetyMetrics metrics={metrics} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
