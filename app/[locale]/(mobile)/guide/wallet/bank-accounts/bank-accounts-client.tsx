'use client';

/**
 * Bank Accounts Client Component
 * Manage bank accounts dengan approval system
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    CreditCard,
    Edit,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import queryKeys from '@/lib/queries/query-keys';

type BankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  branch_name?: string;
  branch_code?: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_edit';
  rejection_reason?: string;
  original_data?: {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    branch_name?: string;
    branch_code?: string;
    is_default: boolean;
  };
  edit_requested_at?: string;
  is_default: boolean;
  created_at: string;
};

type BankAccountsClientProps = {
  locale: string;
};

const BANK_LIST = [
  'Bank BCA',
  'Bank Mandiri',
  'Bank BNI',
  'Bank BRI',
  'Bank CIMB Niaga',
  'Bank Danamon',
  'Bank Permata',
  'Bank Maybank',
  'Bank OCBC NISP',
  'Bank Panin',
  'Bank UOB Indonesia',
  'Bank Mega',
  'Bank BTPN',
  'Bank Jago',
  'Bank DBS Indonesia',
  'Bank Lainnya',
];

export function BankAccountsClient({ locale: _locale }: BankAccountsClientProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    branch_name: '',
    branch_code: '',
    is_default: false,
  });

  const { data, isLoading } = useQuery<{ accounts: BankAccount[] }>({
    queryKey: queryKeys.guide.wallet.bankAccounts(),
    queryFn: async () => {
      const res = await fetch('/api/guide/bank-accounts');
      if (!res.ok) throw new Error('Failed to fetch bank accounts');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (account: typeof formData) => {
      const res = await fetch('/api/guide/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Failed to create bank account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.wallet.bankAccounts() });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch('/api/guide/bank-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Failed to update bank account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.wallet.bankAccounts() });
      setIsDialogOpen(false);
      setEditingAccount(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/guide/bank-accounts?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Failed to delete bank account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.wallet.bankAccounts() });
    },
  });

  const resetForm = () => {
    setFormData({
      bank_name: '',
      account_number: '',
      account_holder_name: '',
      branch_name: '',
      branch_code: '',
      is_default: false,
    });
  };

  const handleEdit = (account: BankAccount) => {
    // Allow edit for pending, pending_edit, and approved accounts
    if (account.status === 'rejected') {
      alert('Akun bank yang ditolak tidak bisa diubah. Silakan hapus dan buat ulang.');
      return;
    }
    
    // If editing approved account, show confirmation
    if (account.status === 'approved') {
      const confirmed = confirm(
        'Mengubah rekening yang sudah disetujui memerlukan persetujuan admin. Lanjutkan?'
      );
      if (!confirmed) return;
    }
    
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder_name: account.account_holder_name,
      branch_name: account.branch_name || '',
      branch_code: account.branch_code || '',
      is_default: account.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.bank_name || !formData.account_number || !formData.account_holder_name) {
      alert('Mohon lengkapi semua field yang wajib');
      return;
    }

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const accounts = data?.accounts || [];
  const approvedAccounts = accounts.filter((a) => a && a.status === 'approved');
  const pendingAccounts = accounts.filter((a) => a && a.status === 'pending');
  const pendingEditAccounts = accounts.filter((a) => a && a.status === 'pending_edit');
  const rejectedAccounts = accounts.filter((a) => a && a.status === 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Disetujui
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            <AlertCircle className="h-3 w-3" />
            Menunggu Persetujuan
          </span>
        );
      case 'pending_edit':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            <Edit className="h-3 w-3" />
            Menunggu Persetujuan Perubahan
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" />
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Account */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">Rekening Bank</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setEditingAccount(null);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Tambah Rekening
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAccount?.status === 'approved'
                      ? 'Perubahan rekening yang sudah disetujui akan memerlukan persetujuan admin.'
                      : 'Rekening baru akan menunggu persetujuan admin sebelum dapat digunakan untuk penarikan dana.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="bank_name">Nama Bank *</Label>
                    <Select
                      value={formData.bank_name}
                      onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_LIST.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="account_number">Nomor Rekening *</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) =>
                        setFormData({ ...formData, account_number: e.target.value })
                      }
                      placeholder="1234567890"
                    />
                  </div>

                  <div>
                    <Label htmlFor="account_holder_name">Nama Pemilik Rekening *</Label>
                    <Input
                      id="account_holder_name"
                      value={formData.account_holder_name}
                      onChange={(e) =>
                        setFormData({ ...formData, account_holder_name: e.target.value })
                      }
                      placeholder="Nama sesuai rekening"
                    />
                  </div>

                  <div>
                    <Label htmlFor="branch_name">Nama Cabang (Opsional)</Label>
                    <Input
                      id="branch_name"
                      value={formData.branch_name}
                      onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                      placeholder="Cabang Bank"
                    />
                  </div>

                  <div>
                    <Label htmlFor="branch_code">Kode Cabang (Opsional)</Label>
                    <Input
                      id="branch_code"
                      value={formData.branch_code}
                      onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                      placeholder="Kode cabang"
                    />
                  </div>

                  {approvedAccounts.length === 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <div>
                        <Label htmlFor="is_default" className="text-sm font-medium">
                          Set sebagai rekening utama
                        </Label>
                        <p className="text-xs text-slate-500">
                          Rekening utama akan digunakan secara default untuk penarikan dana
                        </p>
                      </div>
                      <Switch
                        id="is_default"
                        checked={formData.is_default}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_default: checked })
                        }
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Menyimpan...'
                      : editingAccount
                        ? 'Simpan Perubahan'
                        : 'Tambah Rekening'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center text-sm text-slate-500">Memuat...</div>
          ) : accounts.length === 0 ? (
            <div className="py-8 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">
                Belum ada rekening bank
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tambahkan rekening bank untuk penarikan dana
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending Edit Accounts - Show first */}
              {pendingEditAccounts.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Menunggu Persetujuan Perubahan
                  </h3>
                  {pendingEditAccounts.map((account) => (
                    <Card key={account.id} className="mb-3 border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-semibold text-slate-900">{account.bank_name}</p>
                                <p className="text-sm text-slate-600">
                                  {account.account_number} • {account.account_holder_name}
                                </p>
                                {account.branch_name && (
                                  <p className="text-xs text-slate-500">
                                    Cabang: {account.branch_name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {getStatusBadge(account.status)}
                              {account.is_default && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                  Rekening Utama
                                </span>
                              )}
                            </div>
                            {account.original_data && (
                              <div className="mt-3 rounded-lg border border-blue-200 bg-white p-3">
                                <p className="mb-2 text-xs font-semibold text-blue-700">
                                  Perubahan yang diminta:
                                </p>
                                <div className="space-y-1 text-xs">
                                  {account.original_data.bank_name !== account.bank_name && (
                                    <p className="text-slate-600">
                                      <span className="font-medium">Bank:</span>{' '}
                                      <span className="line-through">
                                        {account.original_data.bank_name}
                                      </span>{' '}
                                      → {account.bank_name}
                                    </p>
                                  )}
                                  {account.original_data.account_number !== account.account_number && (
                                    <p className="text-slate-600">
                                      <span className="font-medium">No. Rekening:</span>{' '}
                                      <span className="line-through">
                                        {account.original_data.account_number}
                                      </span>{' '}
                                      → {account.account_number}
                                    </p>
                                  )}
                                  {account.original_data.account_holder_name !== account.account_holder_name && (
                                    <p className="text-slate-600">
                                      <span className="font-medium">Nama:</span>{' '}
                                      <span className="line-through">
                                        {account.original_data.account_holder_name}
                                      </span>{' '}
                                      → {account.account_holder_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            <p className="mt-2 text-xs text-blue-700">
                              Perubahan rekening sedang menunggu persetujuan admin. Anda dapat
                              mengubah atau membatalkan permintaan ini.
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Hapus rekening bank ini?')) {
                                  deleteMutation.mutate(account.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Approved Accounts */}
              {approvedAccounts.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Rekening Disetujui
                  </h3>
                  {approvedAccounts.map((account) => (
                    <Card key={account.id} className="mb-3 border-emerald-200 bg-emerald-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-emerald-600" />
                              <div>
                                <p className="font-semibold text-slate-900">{account.bank_name}</p>
                                <p className="text-sm text-slate-600">
                                  {account.account_number} • {account.account_holder_name}
                                </p>
                                {account.branch_name && (
                                  <p className="text-xs text-slate-500">
                                    Cabang: {account.branch_name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {getStatusBadge(account.status)}
                              {account.is_default && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                  Rekening Utama
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-emerald-700">
                              Rekening aktif. Anda dapat mengubah data rekening dengan mengklik
                              tombol edit. Perubahan akan memerlukan persetujuan admin.
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pending Accounts */}
              {pendingAccounts.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Menunggu Persetujuan
                  </h3>
                  {pendingAccounts.map((account) => (
                    <Card key={account.id} className="mb-3 border-amber-200 bg-amber-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-amber-600" />
                              <div>
                                <p className="font-semibold text-slate-900">{account.bank_name}</p>
                                <p className="text-sm text-slate-600">
                                  {account.account_number} • {account.account_holder_name}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {getStatusBadge(account.status)}
                            </div>
                            <p className="mt-2 text-xs text-amber-700">
                              Menunggu persetujuan admin. Anda dapat mengubah atau menghapus
                              rekening ini.
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Hapus rekening bank ini?')) {
                                  deleteMutation.mutate(account.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Rejected Accounts */}
              {rejectedAccounts.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ditolak
                  </h3>
                  {rejectedAccounts.map((account) => (
                    <Card key={account.id} className="mb-3 border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-red-600" />
                              <div>
                                <p className="font-semibold text-slate-900">{account.bank_name}</p>
                                <p className="text-sm text-slate-600">
                                  {account.account_number} • {account.account_holder_name}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {getStatusBadge(account.status)}
                            </div>
                            {account.rejection_reason && (
                              <p className="mt-2 text-xs text-red-700">
                                <strong>Alasan:</strong> {account.rejection_reason}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-red-600">
                              Rekening ini ditolak. Anda dapat menghapus dan menambahkan kembali
                              dengan data yang benar.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Hapus rekening bank ini?')) {
                                deleteMutation.mutate(account.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 bg-slate-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-slate-500" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-slate-900">Informasi</p>
              <ul className="space-y-1 text-xs text-slate-600">
                <li>• Rekening bank baru memerlukan persetujuan admin untuk keamanan</li>
                <li>• Pastikan nama pemilik rekening sesuai dengan identitas Anda</li>
                <li>• Hanya rekening yang disetujui yang dapat digunakan untuk penarikan dana</li>
                <li>• Rekening utama akan digunakan secara default untuk penarikan dana</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
