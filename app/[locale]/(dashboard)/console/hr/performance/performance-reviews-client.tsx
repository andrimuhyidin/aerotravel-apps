'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Download, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import queryKeys from '@/lib/queries/query-keys';
import { ReportExporter, downloadFile } from '@/lib/excel/export';

type PerformanceReview = {
  id: string;
  employee_id: string;
  employee_name: string;
  reviewer_id: string;
  reviewer_name: string;
  review_period: string;
  overall_rating: number;
  status: string;
  review_date: string;
  comments: string | null;
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  acknowledged: 'bg-blue-100 text-blue-800',
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

type PerformanceReviewsClientProps = {
  locale: string;
};

export function PerformanceReviewsClient({ locale: _locale }: PerformanceReviewsClientProps) {
  const [period, setPeriod] = useState('2024-Q4');
  const [status, setStatus] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.admin.all, 'performance-reviews', period, status],
    queryFn: async () => {
      const params = new URLSearchParams({ period, status });
      const response = await fetch(`/api/admin/hr/performance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch performance reviews');
      return response.json();
    },
  });

  const handleExport = async () => {
    if (!data?.reviews?.length) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const buffer = await ReportExporter.performanceReviews(data.reviews);
      downloadFile(buffer, `performance-reviews-${period}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.success('Export successful');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: DataTableColumn<PerformanceReview>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (row) => <span className="font-medium">{row.employee_name}</span>,
    },
    {
      key: 'reviewer',
      header: 'Reviewer',
      accessor: (row) => row.reviewer_name,
    },
    {
      key: 'period',
      header: 'Period',
      accessor: (row) => row.review_period,
    },
    {
      key: 'rating',
      header: 'Rating',
      accessor: (row) => <RatingStars rating={row.overall_rating} />,
    },
    {
      key: 'date',
      header: 'Review Date',
      accessor: (row) => new Date(row.review_date).toLocaleDateString('id-ID'),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge className={statusColors[row.status] || 'bg-gray-100 text-gray-800'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load performance reviews</p>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats || { total: 0, avgRating: 0, completed: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Reviews</h1>
          <p className="text-muted-foreground">Employee performance evaluations</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating?.toFixed(1) || '0.0'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 max-w-md">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-Q4">Q4 2024</SelectItem>
                <SelectItem value="2024-Q3">Q3 2024</SelectItem>
                <SelectItem value="2024-Q2">Q2 2024</SelectItem>
                <SelectItem value="2024-Q1">Q1 2024</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews</CardTitle>
          <CardDescription>
            {data?.reviews?.length || 0} reviews found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.reviews || []}
            emptyMessage="No performance reviews"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}

