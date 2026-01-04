'use client';

/**
 * Advanced Metrics Dashboard Component
 * Displays all advanced metrics with tab navigation
 */

import { useState } from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Users,
  Award,
  Leaf,
  ClipboardCheck,
  Shield,
} from 'lucide-react';

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
    return null;
  }

  // Count available tabs
  const availableTabs = [
    metrics.customerSatisfaction !== undefined,
    metrics.efficiency !== undefined,
    metrics.financial !== undefined,
    metrics.quality !== undefined,
    metrics.growth !== undefined,
    metrics.comparative !== undefined,
    metrics.sustainability !== undefined,
    metrics.operations !== undefined,
    metrics.safety !== undefined,
  ].filter(Boolean).length;

  return (
    <div className={className}>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="-mx-4 overflow-x-auto px-4">
          <TabsList className="inline-flex h-auto w-max min-w-full gap-1.5 bg-transparent p-0">
            {metrics.customerSatisfaction !== undefined && (
              <TabsTrigger
                value="customer"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Customer</span>
              </TabsTrigger>
            )}
            {metrics.efficiency !== undefined && (
              <TabsTrigger
                value="efficiency"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Efficiency</span>
              </TabsTrigger>
            )}
            {metrics.financial !== undefined && (
              <TabsTrigger
                value="financial"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Financial</span>
              </TabsTrigger>
            )}
            {metrics.quality !== undefined && (
              <TabsTrigger
                value="quality"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Quality</span>
              </TabsTrigger>
            )}
            {metrics.growth !== undefined && (
              <TabsTrigger
                value="growth"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Growth</span>
              </TabsTrigger>
            )}
            {metrics.comparative !== undefined && (
              <TabsTrigger
                value="comparative"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <Award className="h-3.5 w-3.5" />
                <span>Compare</span>
              </TabsTrigger>
            )}
            {metrics.sustainability !== undefined && (
              <TabsTrigger
                value="sustainability"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <Leaf className="h-3.5 w-3.5" />
                <span>Waste</span>
              </TabsTrigger>
            )}
            {metrics.operations !== undefined && (
              <TabsTrigger
                value="operations"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span>Ops</span>
              </TabsTrigger>
            )}
            {metrics.safety !== undefined && (
              <TabsTrigger
                value="safety"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-all data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Safety</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

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
