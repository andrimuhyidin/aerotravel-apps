'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Download, Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type Communication = {
  id: string;
  customer_id: string;
  customer_name: string;
  communication_type: string;
  subject: string;
  message: string;
  status: string;
  agent_name: string;
  created_at: string;
};

const typeIcons: Record<string, React.ReactNode> = {
  phone: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  escalated: 'bg-red-100 text-red-800',
};

type CustomerCommunicationsClientProps = {
  locale: string;
};

export function CustomerCommunicationsClient({ locale: _locale }: CustomerCommunicationsClientProps) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.admin.all, 'customer-communications', search, type, status],
    queryFn: async () => {
      const params = new URLSearchParams({ search, type, status });
      const response = await fetch(`/api/admin/crm/communications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch communications');
      return response.json();
    },
  });

  const handleExport = async () => {
    if (!data?.communications?.length) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const buffer = await ReportExporter.customerCommunications(data.communications);
      downloadFile(buffer, 'customer-communications.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.success('Export successful');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: DataTableColumn<Communication>[] = [
    {
      key: 'type',
      header: 'Type',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {typeIcons[row.communication_type] || <MessageSquare className="h-4 w-4" />}
          <span className="capitalize">{row.communication_type}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row) => <span className="font-medium">{row.customer_name}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      accessor: (row) => <span className="max-w-[200px] truncate block">{row.subject}</span>,
    },
    {
      key: 'agent',
      header: 'Agent',
      accessor: (row) => row.agent_name,
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (row) => new Date(row.created_at).toLocaleDateString('id-ID'),
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
          <p className="text-muted-foreground">Failed to load communications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Communications</h1>
          <p className="text-muted-foreground">Track customer interactions across all channels</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Customer name or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Communications</CardTitle>
          <CardDescription>
            {data?.communications?.length || 0} records found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.communications || []}
            emptyMessage="No communications found"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}

