'use client';

/**
 * Training Compliance Report Client Component
 * Admin dashboard untuk melihat training compliance per guide
 */

import { useQuery } from '@tanstack/react-query';
import { Download, Filter, Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { logger } from '@/lib/utils/logger';

type ComplianceReportClientProps = {
  locale: string;
};

type GuideCompliance = {
  guide_id: string;
  guide_name: string;
  guide_email: string;
  compliance_percentage: number;
  total_assignments: number;
  completed_count: number;
  pending_count: number;
  overdue_count: number;
  assignments: Array<{
    id: string;
    due_date: string;
    status: 'pending' | 'completed' | 'overdue';
    mandatory_training: {
      id: string;
      title: string;
      training_type: string;
      frequency: string;
    };
  }>;
  status: 'compliant' | 'non-compliant';
};

type ComplianceReportData = {
  guides: GuideCompliance[];
  summary: {
    total_guides: number;
    compliant_count: number;
    non_compliant_count: number;
    avg_compliance_percentage: number;
  };
};

export function ComplianceReportClient({ locale }: ComplianceReportClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery<ComplianceReportData>({
    queryKey: ['training-compliance', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await fetch(`/api/admin/reports/training-compliance?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch compliance report');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading compliance report...</div>
      </div>
    );
  }

  if (error) {
    logger.error('Failed to load compliance report', error);
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Failed to load data</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { guides, summary } = data;

  // Filter by search query
  const filteredGuides = guides.filter(
    (guide) =>
      guide.guide_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.guide_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: 'compliant' | 'non-compliant') => {
    return status === 'compliant' ? (
      <Badge className="bg-green-100 text-green-700">Compliant</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700">Non-Compliant</Badge>
    );
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training Compliance Report</h1>
          <p className="text-slate-600">Training compliance status per guide</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Guides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.total_guides}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.compliant_count}</div>
            <div className="text-xs text-slate-500">
              {summary.total_guides > 0
                ? ((summary.compliant_count / summary.total_guides) * 100).toFixed(1)
                : 0}
              % of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Non-Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.non_compliant_count}</div>
            <div className="text-xs text-slate-500">
              {summary.total_guides > 0
                ? ((summary.non_compliant_count / summary.total_guides) * 100).toFixed(1)
                : 0}
              % of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {summary.avg_compliance_percentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant Only</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Guide Compliance Details</CardTitle>
          <CardDescription>
            {filteredGuides.length} guide{filteredGuides.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guide Name</TableHead>
                  <TableHead>Compliance %</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500">
                      No guides found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuides.map((guide) => (
                    <TableRow key={guide.guide_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{guide.guide_name}</div>
                          <div className="text-xs text-slate-500">{guide.guide_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getComplianceColor(guide.compliance_percentage)}`}>
                          {guide.compliance_percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {guide.completed_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          {guide.pending_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {guide.overdue_count > 0 ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {guide.overdue_count}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(guide.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

