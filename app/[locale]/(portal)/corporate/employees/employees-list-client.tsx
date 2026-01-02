/**
 * Employees List Client Component
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Check,
  Clock,
  Loader2,
  Mail,
  MoreVertical,
  Plus,
  Search,
  User,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

type Employee = {
  id: string;
  corporateId: string;
  userId: string | null;
  employeeIdNumber: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  allocatedAmount: number;
  usedAmount: number;
  remainingAmount: number;
  isActive: boolean;
  invitationSentAt: string | null;
  registeredAt: string | null;
  createdAt: string;
};

type EmployeesResponse = {
  employees: Employee[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const addEmployeeSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional(),
  department: z.string().optional(),
  employeeIdNumber: z.string().optional(),
  allocatedAmount: z.number().min(0).optional(),
});

type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>;

type EmployeesListClientProps = {
  locale: string;
};

export function EmployeesListClient({ locale }: EmployeesListClientProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 10;

  const form = useForm<AddEmployeeFormData>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      department: '',
      employeeIdNumber: '',
      allocatedAmount: 0,
    },
  });

  // Fetch employees
  const { data, isLoading, isFetching } = useQuery<EmployeesResponse>({
    queryKey: ['corporate', 'employees', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await apiClient.get(
        `/api/partner/corporate/employees?${params}`
      );
      return response.data as EmployeesResponse;
    },
  });

  // Add employee mutation
  const addMutation = useMutation({
    mutationFn: async (data: AddEmployeeFormData) => {
      const response = await apiClient.post(
        '/api/partner/corporate/employees',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Karyawan berhasil ditambahkan');
      setShowAddDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['corporate', 'employees'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambah karyawan');
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getStatusBadge = (employee: Employee) => {
    if (!employee.isActive) {
      return <Badge variant="secondary">Nonaktif</Badge>;
    }
    if (employee.invitationSentAt && !employee.registeredAt) {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <Clock className="h-3 w-3 mr-1" />
          Menunggu
        </Badge>
      );
    }
    if (employee.registeredAt) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <Check className="h-3 w-3 mr-1" />
          Aktif
        </Badge>
      );
    }
    return <Badge variant="outline">Baru</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Karyawan</h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total || 0} karyawan terdaftar
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border rounded-md text-sm bg-background"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="invited">Menunggu</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {/* Employee List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data?.employees.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium mb-1">Belum ada karyawan</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan karyawan untuk alokasi budget travel
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Karyawan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.employees.map((employee) => (
            <Card key={employee.id} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{employee.fullName}</p>
                        {getStatusBadge(employee)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </span>
                        {employee.department && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {employee.department}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Alokasi:</span>{' '}
                          <span className="font-medium">
                            {formatCurrency(employee.allocatedAmount)}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Sisa:</span>{' '}
                          <span
                            className={`font-medium ${
                              employee.remainingAmount < 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {formatCurrency(employee.remainingAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Alokasi Budget</DropdownMenuItem>
                      <DropdownMenuItem>Kirim Undangan</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Nonaktifkan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {data.pagination.total > limit && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
              >
                Sebelumnya
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                Halaman {page + 1} dari{' '}
                {Math.ceil(data.pagination.total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.pagination.hasMore || isFetching}
              >
                {isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Karyawan</DialogTitle>
            <DialogDescription>
              Daftarkan karyawan baru untuk alokasi budget travel
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => addMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama karyawan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP</FormLabel>
                      <FormControl>
                        <Input placeholder="08xxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departemen</FormLabel>
                      <FormControl>
                        <Input placeholder="IT, HR, dll" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="employeeIdNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIP / NIK Karyawan</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor induk karyawan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allocatedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alokasi Budget (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

