/**
 * AI Dashboard Client Component
 * Shows AI usage metrics, token consumption, and analytics
 */

'use client';

import {
  Activity,
  Bot,
  Brain,
  Clock,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type AiDashboardClientProps = {
  locale: string;
};

// Mock data - replace with actual API calls
const AI_STATS = {
  totalRequests: 15420,
  totalTokens: 2450000,
  avgResponseTime: 1.2,
  estimatedCost: 24.5,
  requestsToday: 245,
  tokensToday: 48000,
};

const AI_FEATURES = [
  { name: 'Trip Assistant', requests: 5240, status: 'active' },
  { name: 'Partner Chat', requests: 3120, status: 'active' },
  { name: 'Expense Analyzer', requests: 2890, status: 'active' },
  { name: 'Document Scanner', requests: 1560, status: 'active' },
  { name: 'Route Optimizer', requests: 890, status: 'active' },
  { name: 'WhatsApp Bot', requests: 720, status: 'active' },
  { name: 'Voice Assistant', requests: 450, status: 'beta' },
  { name: 'Quotation Copilot', requests: 380, status: 'active' },
  { name: 'Feedback Analyzer', requests: 170, status: 'active' },
];

export function AiDashboardClient({ locale }: AiDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{AI_STATS.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{AI_STATS.requestsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(AI_STATS.totalTokens / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">
              +{(AI_STATS.tokensToday / 1000).toFixed(1)}K today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{AI_STATS.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;2s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${AI_STATS.estimatedCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Features Usage
          </CardTitle>
          <CardDescription>
            Request count by feature (all time)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {AI_FEATURES.map((feature) => (
              <div key={feature.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{feature.name}</span>
                  {feature.status === 'beta' && (
                    <Badge variant="secondary">Beta</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {feature.requests.toLocaleString()} requests
                  </span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{
                        width: `${(feature.requests / (AI_FEATURES[0]?.requests ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary</span>
                <span className="font-medium">Google Gemini 2.0 Flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Embeddings</span>
                <span className="font-medium">text-embedding-004</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vision</span>
                <span className="font-medium">Gemini 2.0 Flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-green-600">99.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Tokens/Request</span>
                <span className="font-medium">158</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RAG Cache Hit</span>
                <span className="font-medium">72%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate Limit Hits</span>
                <span className="font-medium text-orange-600">12 today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

