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
    return 'customer';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  // Check if any advanced metrics are available
  const hasAdvancedMetrics =
    metrics.customerSatisfaction ||
    metrics.efficiency ||
    metrics.financial ||
    metrics.quality ||
    metrics.growth ||
    metrics.comparative;

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
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {metrics.customerSatisfaction && (
            <TabsTrigger value="customer" className="text-xs">
              Customer
            </TabsTrigger>
          )}
          {metrics.efficiency && (
            <TabsTrigger value="efficiency" className="text-xs">
              Efficiency
            </TabsTrigger>
          )}
          {metrics.financial && (
            <TabsTrigger value="financial" className="text-xs">
              Financial
            </TabsTrigger>
          )}
          {metrics.quality && (
            <TabsTrigger value="quality" className="text-xs">
              Quality
            </TabsTrigger>
          )}
          {metrics.growth && (
            <TabsTrigger value="growth" className="text-xs">
              Growth
            </TabsTrigger>
          )}
          {metrics.comparative && (
            <TabsTrigger value="comparative" className="text-xs">
              Compare
            </TabsTrigger>
          )}
        </TabsList>

        {metrics.customerSatisfaction && (
          <TabsContent value="customer" className="mt-4">
            <CustomerSatisfactionMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.efficiency && (
          <TabsContent value="efficiency" className="mt-4">
            <EfficiencyMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.financial && (
          <TabsContent value="financial" className="mt-4">
            <FinancialMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.quality && (
          <TabsContent value="quality" className="mt-4">
            <QualityMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.growth && (
          <TabsContent value="growth" className="mt-4">
            <GrowthMetrics metrics={metrics} />
          </TabsContent>
        )}

        {metrics.comparative && (
          <TabsContent value="comparative" className="mt-4">
            <ComparativeMetrics metrics={metrics} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
