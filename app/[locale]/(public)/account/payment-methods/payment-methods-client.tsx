'use client';

/**
 * Payment Methods Client Component
 * Display and manage saved payment methods
 */

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  Plus,
  Smartphone,
  Star,
  Trash2,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';

type PaymentMethod = {
  id: string;
  type: 'card' | 'ewallet' | 'bank';
  name: string;
  details: string;
  icon: string;
  isDefault: boolean;
  lastUsed?: string;
};

type PaymentMethodsClientProps = {
  locale: string;
};

// E-wallet and bank logos
const paymentIcons: Record<string, string> = {
  gopay: '💚',
  ovo: '💜',
  dana: '💙',
  shopeepay: '🧡',
  linkaja: '❤️',
  bca: '🏦',
  mandiri: '🏦',
  bni: '🏦',
  bri: '🏦',
  visa: '💳',
  mastercard: '💳',
  jcb: '💳',
};

// Available payment options to add
const availablePaymentOptions = [
  {
    category: 'E-Wallet',
    icon: Wallet,
    options: [
      { id: 'gopay', name: 'GoPay', icon: '💚' },
      { id: 'ovo', name: 'OVO', icon: '💜' },
      { id: 'dana', name: 'DANA', icon: '💙' },
      { id: 'shopeepay', name: 'ShopeePay', icon: '🧡' },
      { id: 'linkaja', name: 'LinkAja', icon: '❤️' },
    ],
  },
  {
    category: 'Virtual Account',
    icon: Building2,
    options: [
      { id: 'bca', name: 'BCA Virtual Account', icon: '🏦' },
      { id: 'mandiri', name: 'Mandiri Virtual Account', icon: '🏦' },
      { id: 'bni', name: 'BNI Virtual Account', icon: '🏦' },
      { id: 'bri', name: 'BRI Virtual Account', icon: '🏦' },
    ],
  },
  {
    category: 'Kartu Kredit/Debit',
    icon: CreditCard,
    options: [
      { id: 'visa', name: 'Visa', icon: '💳' },
      { id: 'mastercard', name: 'Mastercard', icon: '💳' },
      { id: 'jcb', name: 'JCB', icon: '💳' },
    ],
  },
];

export function PaymentMethodsClient({ locale }: PaymentMethodsClientProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, show empty state or mock data from localStorage
        const stored = localStorage.getItem('aero_payment_methods');
        if (stored) {
          setPaymentMethods(JSON.parse(stored));
        }
      } catch (err) {
        logger.error('Failed to fetch payment methods', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const saveToStorage = (methods: PaymentMethod[]) => {
    localStorage.setItem('aero_payment_methods', JSON.stringify(methods));
    setPaymentMethods(methods);
  };

  const handleAddPayment = (optionId: string, optionName: string, icon: string, type: 'card' | 'ewallet' | 'bank') => {
    const newMethod: PaymentMethod = {
      id: `${optionId}-${Date.now()}`,
      type,
      name: optionName,
      details: type === 'card' ? '**** **** **** 1234' : type === 'ewallet' ? '0812****5678' : 'Connected',
      icon,
      isDefault: paymentMethods.length === 0,
    };

    const updated = [...paymentMethods, newMethod];
    saveToStorage(updated);
    setShowAddDialog(false);
    toast.success(`${optionName} berhasil ditambahkan`);
  };

  const handleSetDefault = (id: string) => {
    const updated = paymentMethods.map((m) => ({
      ...m,
      isDefault: m.id === id,
    }));
    saveToStorage(updated);
    toast.success('Metode pembayaran utama berhasil diubah');
  };

  const handleDelete = async () => {
    if (!selectedMethod) return;
    setIsDeleting(true);

    try {
      const updated = paymentMethods.filter((m) => m.id !== selectedMethod.id);
      
      // If deleting default, set first remaining as default
      if (selectedMethod.isDefault && updated.length > 0) {
        updated[0]!.isDefault = true;
      }

      saveToStorage(updated);
      toast.success('Metode pembayaran berhasil dihapus');
    } catch (err) {
      logger.error('Failed to delete payment method', err);
      toast.error('Gagal menghapus metode pembayaran');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedMethod(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'card':
        return CreditCard;
      case 'ewallet':
        return Smartphone;
      case 'bank':
        return Building2;
      default:
        return Wallet;
    }
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/account`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Metode Pembayaran</h1>
            <p className="text-sm text-muted-foreground">Kelola metode pembayaran</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1 rounded-xl"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800">
          <Wallet className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Belum ada metode pembayaran</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Tambahkan metode pembayaran untuk checkout lebih cepat
          </p>
          <Button
            className="mt-4 gap-2 rounded-xl"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Tambah Metode Pembayaran
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const TypeIcon = getTypeIcon(method.type);

            return (
              <div
                key={method.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800"
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-2xl dark:from-slate-700 dark:to-slate-600">
                    {method.icon}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{method.name}</p>
                      {method.isDefault && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Star className="h-2.5 w-2.5" />
                          Utama
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{method.details}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!method.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(method.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Jadikan utama"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod(method);
                        setShowDeleteDialog(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/20">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          💡 Metode pembayaran Anda tersimpan dengan aman dan terenkripsi. Data sensitif tidak disimpan di perangkat ini.
        </p>
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
            <DialogDescription>
              Pilih metode pembayaran yang ingin ditambahkan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {availablePaymentOptions.map((category) => (
              <div key={category.category}>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <category.icon className="h-4 w-4" />
                  {category.category}
                </div>
                <div className="space-y-2">
                  {category.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleAddPayment(
                          option.id,
                          option.name,
                          option.icon,
                          category.category === 'E-Wallet'
                            ? 'ewallet'
                            : category.category === 'Kartu Kredit/Debit'
                              ? 'card'
                              : 'bank'
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <span className="text-xl">{option.icon}</span>
                      <span className="flex-1 text-left text-sm font-medium">
                        {option.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Metode Pembayaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedMethod?.name}? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
