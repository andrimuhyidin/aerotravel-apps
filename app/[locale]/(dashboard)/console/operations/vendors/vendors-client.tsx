/**
 * Vendors Management Client Component
 * Vendor database with price lock enforcement
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Building2,
  Clock,
  Edit,
  History,
  Loader2,
  Lock,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';

type VendorType =
  | 'boat_rental'
  | 'catering'
  | 'transport'
  | 'accommodation'
  | 'ticket'
  | 'equipment'
  | 'other';

type Vendor = {
  id: string;
  name: string;
  vendorType: VendorType;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  defaultPrice: number;
  priceUnit: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  isActive: boolean;
};

type PriceHistoryItem = {
  id: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  changedBy: string;
  changedAt: string;
};

const vendorTypeLabels: Record<VendorType, string> = {
  boat_rental: 'Sewa Kapal',
  catering: 'Katering',
  transport: 'Transportasi',
  accommodation: 'Akomodasi',
  ticket: 'Tiket Masuk',
  equipment: 'Peralatan',
  other: 'Lainnya',
};

const vendorTypeIcons: Record<VendorType, string> = {
  boat_rental: '🚤',
  catering: '🍱',
  transport: '🚐',
  accommodation: '🏨',
  ticket: '🎫',
  equipment: '🎿',
  other: '📦',
};

type VendorsClientProps = {
  locale: string;
};

export function VendorsClient({ locale }: VendorsClientProps) {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState<Vendor | null>(null);
  const [showUpdatePrice, setShowUpdatePrice] = useState<Vendor | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newVendor, setNewVendor] = useState({
    name: '',
    vendorType: 'other' as VendorType,
    description: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    defaultPrice: 0,
    priceUnit: 'per trip',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });
  const [newPrice, setNewPrice] = useState(0);
  const [priceReason, setPriceReason] = useState('');

  useEffect(() => {
    fetchVendors();
  }, [typeFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = typeFilter !== 'all' ? `?type=${typeFilter}` : '';
      const res = await fetch(`/api/admin/vendors${params}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      logger.error('Failed to fetch vendors', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data.priceHistory || []);
      }
    } catch (error) {
      logger.error('Failed to fetch price history', error);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.name || newVendor.defaultPrice <= 0) {
      toast.error('Nama dan harga wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Vendor berhasil ditambahkan');
        setShowAddVendor(false);
        setNewVendor({
          name: '',
          vendorType: 'other',
          description: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          defaultPrice: 0,
          priceUnit: 'per trip',
          bankName: '',
          bankAccountNumber: '',
          bankAccountName: '',
        });
        fetchVendors();
      } else {
        toast.error(data.error || 'Gagal menambah vendor');
      }
    } catch (error) {
      logger.error('Failed to add vendor', error);
      toast.error('Gagal menambah vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!showUpdatePrice || newPrice <= 0 || !priceReason) {
      toast.error('Harga baru dan alasan wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/vendors/${showUpdatePrice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPrice, reason: priceReason }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowUpdatePrice(null);
        setNewPrice(0);
        setPriceReason('');
        fetchVendors();
      } else {
        toast.error(data.error || 'Gagal update harga');
      }
    } catch (error) {
      logger.error('Failed to update price', error);
      toast.error('Gagal update harga');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPriceHistory = (vendor: Vendor) => {
    setShowPriceHistory(vendor);
    fetchPriceHistory(vendor.id);
  };

  const openUpdatePrice = (vendor: Vendor) => {
    setShowUpdatePrice(vendor);
    setNewPrice(vendor.defaultPrice);
    setPriceReason('');
  };

  // Filter vendors
  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Management</h1>
          <p className="text-muted-foreground">
            Database vendor dengan harga terkunci (Price Lock)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVendors}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddVendor(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Vendor
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-blue-800">Price Lock Enforcement</p>
            <p className="text-sm text-blue-600">
              Harga vendor terkunci. Guide dan ops admin tidak dapat mengubah harga
              saat input expense. Hanya Super Admin yang dapat update harga.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari vendor..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            {Object.entries(vendorTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {vendorTypeIcons[key as VendorType]} {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Belum ada vendor</p>
              <Button className="mt-4" onClick={() => setShowAddVendor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Vendor Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Lock className="h-3 w-3" />
                      Harga Terkunci
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        {vendor.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {vendor.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <span>{vendorTypeIcons[vendor.vendorType]}</span>
                        {vendorTypeLabels[vendor.vendorType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vendor.contactPerson && (
                          <p className="font-medium">{vendor.contactPerson}</p>
                        )}
                        {vendor.phone && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {vendor.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-bold text-primary">
                          Rp {vendor.defaultPrice.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.priceUnit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={vendor.isActive ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {vendor.isActive ? (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            Aktif
                          </>
                        ) : (
                          'Nonaktif'
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPriceHistory(vendor)}>
                            <History className="h-4 w-4 mr-2" />
                            Riwayat Harga
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openUpdatePrice(vendor)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Update Harga
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Nonaktifkan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Vendor Dialog */}
      <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Tambah Vendor Baru
            </DialogTitle>
            <DialogDescription>
              Tambahkan vendor dengan harga terkunci
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nama Vendor *</Label>
                <Input
                  placeholder="PT. Example..."
                  value={newVendor.name}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tipe Vendor *</Label>
                <Select
                  value={newVendor.vendorType}
                  onValueChange={(v) =>
                    setNewVendor({ ...newVendor, vendorType: v as VendorType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vendorTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {vendorTypeIcons[key as VendorType]} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  placeholder="Nama kontak..."
                  value={newVendor.contactPerson}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, contactPerson: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input
                  placeholder="081234567890"
                  value={newVendor.phone}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="vendor@example.com"
                  value={newVendor.email}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Harga Default *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newVendor.defaultPrice || ''}
                  onChange={(e) =>
                    setNewVendor({
                      ...newVendor,
                      defaultPrice: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Satuan Harga</Label>
                <Select
                  value={newVendor.priceUnit}
                  onValueChange={(v) =>
                    setNewVendor({ ...newVendor, priceUnit: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per trip">Per Trip</SelectItem>
                    <SelectItem value="per pax">Per Pax</SelectItem>
                    <SelectItem value="per day">Per Hari</SelectItem>
                    <SelectItem value="per unit">Per Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  placeholder="Deskripsi vendor..."
                  value={newVendor.description}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, description: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddVendor(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button onClick={handleAddVendor} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Vendor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={!!showPriceHistory} onOpenChange={() => setShowPriceHistory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Riwayat Harga
            </DialogTitle>
            <DialogDescription>
              {showPriceHistory?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {priceHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Belum ada perubahan harga
              </p>
            ) : (
              priceHistory.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm line-through text-muted-foreground">
                        Rp {item.oldPrice.toLocaleString('id-ID')}
                      </span>
                      <span className="text-sm">→</span>
                      <span className="text-sm font-medium text-primary">
                        Rp {item.newPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.reason}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Oleh {item.changedBy} •{' '}
                      {format(new Date(item.changedAt), 'dd MMM yyyy HH:mm', {
                        locale: localeId,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceHistory(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Price Dialog */}
      <Dialog open={!!showUpdatePrice} onOpenChange={() => setShowUpdatePrice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Update Harga Terkunci
            </DialogTitle>
            <DialogDescription>
              Hanya Super Admin yang dapat mengubah harga vendor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">{showUpdatePrice?.name}</p>
              <p className="text-xs text-muted-foreground">
                Harga saat ini: Rp {showUpdatePrice?.defaultPrice.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Harga Baru (Rp) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={newPrice || ''}
                onChange={(e) => setNewPrice(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan Perubahan *</Label>
              <Textarea
                placeholder="Contoh: Penyesuaian harga BBM, Negosiasi kontrak baru..."
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdatePrice(null)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdatePrice}
              disabled={isSubmitting || !priceReason || newPrice <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Update Harga
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

