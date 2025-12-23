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
    // Prioritize metrics that are more likely to have data
    if (metrics.sustainability !== undefined) return 'sustainability';
    if (metrics.operations !== undefined) return 'operations';
    if (metrics.safety !== undefined) return 'safety';
    if (metrics.financial !== undefined) return 'financial';
    if (metrics.efficiency !== undefined) return 'efficiency';
    if (metrics.quality !== undefined) return 'quality';
    if (metrics.customerSatisfaction !== undefined) return 'customer';
    if (metrics.growth !== undefined) return 'growth';
    if (metrics.comparative !== undefined) return 'comparative';
    return 'sustainability';
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

  // Always show Advanced Metrics section if metrics object exists
  // Even if all data is null, show empty states
  if (!hasAdvancedMetrics) {
    // Debug: Log why component is not rendering with full metrics object
    console.log('[AdvancedMetrics] Not rendering - no advanced metrics found', {
      metricsKeys: Object.keys(metrics),
      customerSatisfaction: metrics.customerSatisfaction,
      efficiency: metrics.efficiency,
      financial: metrics.financial,
      quality: metrics.quality,
      growth: metrics.growth,
      comparative: metrics.comparative,
      sustainability: metrics.sustainability,
      operations: metrics.operations,
      safety: metrics.safety,
      fullMetrics: metrics,
    });
    return null;
  }

  // Debug: Log that component is rendering
  console.log('[AdvancedMetrics] Rendering with tabs', {
    activeTab,
    hasSustainability: metrics.sustainability !== undefined,
    hasOperations: metrics.operations !== undefined,
    hasSafety: metrics.safety !== undefined,
  });

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
