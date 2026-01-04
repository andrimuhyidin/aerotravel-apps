'use client';

/**
 * Logistics Handover Section
 * Outbound (warehouse → guide) & Inbound (guide → warehouse) workflow
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  QrCode,
  User,
  X,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { QRScanner } from '@/components/qr-code/qr-scanner';
import {
  SignaturePad,
  type SignatureData,
} from '@/components/ui/signature-pad';
import { mapFacilitiesToItems } from '@/lib/guide/facility-item-mapper';
import type { FacilityDisplayItem } from '@/lib/guide/facilities';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type LogisticsHandoverSectionProps = {
  tripId: string;
  locale: string;
};

type HandoverItem = {
  item_id?: string;
  name: string;
  quantity: number;
  unit: string;
  condition?: string;
  photo_url?: string;
  expected_quantity?: number;
};

const DEFAULT_HANDOVER_ITEM: HandoverItem = {
  name: '',
  quantity: 0,
  unit: 'piece',
};

// Template items for different trip types
const HANDOVER_ITEM_TEMPLATES: Record<
  'boat_trip' | 'land_trip',
  Array<{ name: string; quantity: number; unit: string }>
> = {
  boat_trip: [
    { name: 'Life Jacket', quantity: 0, unit: 'piece' },
    { name: 'Snorkeling Mask', quantity: 0, unit: 'piece' },
    { name: 'Snorkeling Fins', quantity: 0, unit: 'piece' },
    { name: 'Diving Suit', quantity: 0, unit: 'piece' },
    { name: 'First Aid Kit', quantity: 0, unit: 'piece' },
    { name: 'Emergency Flare', quantity: 0, unit: 'piece' },
    { name: 'VHF Radio', quantity: 0, unit: 'piece' },
    { name: 'GPS Device', quantity: 0, unit: 'piece' },
    { name: 'Anchor', quantity: 0, unit: 'piece' },
    { name: 'Rope', quantity: 0, unit: 'meter' },
    { name: 'Cooler Box', quantity: 0, unit: 'piece' },
    { name: 'Drinking Water', quantity: 0, unit: 'liter' },
  ],
  land_trip: [
    { name: 'First Aid Kit', quantity: 0, unit: 'piece' },
    { name: 'Tent', quantity: 0, unit: 'piece' },
    { name: 'Sleeping Bag', quantity: 0, unit: 'piece' },
    { name: 'Backpack', quantity: 0, unit: 'piece' },
    { name: 'Compass', quantity: 0, unit: 'piece' },
    { name: 'GPS Device', quantity: 0, unit: 'piece' },
    { name: 'Flashlight', quantity: 0, unit: 'piece' },
    { name: 'Emergency Whistle', quantity: 0, unit: 'piece' },
    { name: 'Multi-tool', quantity: 0, unit: 'piece' },
    { name: 'Rope', quantity: 0, unit: 'meter' },
    { name: 'Portable Stove', quantity: 0, unit: 'piece' },
    { name: 'Drinking Water', quantity: 0, unit: 'liter' },
  ],
};

type Handover = {
  id: string;
  handover_type: 'outbound' | 'inbound';
  items: HandoverItem[];
  from_signature_data: string | null;
  to_signature_data: string | null;
  verified_by_both: boolean;
  status: 'pending' | 'completed' | 'disputed' | 'cancelled';
  created_at: string;
};

export function LogisticsHandoverSection({
  tripId,
  locale: _locale,
}: LogisticsHandoverSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [handoverType, setHandoverType] = useState<'outbound' | 'inbound'>(
    'outbound'
  );
  const [items, setItems] = useState<HandoverItem[]>([
    { ...DEFAULT_HANDOVER_ITEM },
  ]);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState<
    Record<number, boolean>
  >({});
  const [expandedHandovers, setExpandedHandovers] = useState<Set<string>>(
    new Set()
  );
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const hasPopulatedItemsRef = useRef(false);
  const queryClient = useQueryClient();

  const toggleHandoverExpand = (handoverId: string) => {
    setExpandedHandovers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(handoverId)) {
        newSet.delete(handoverId);
      } else {
        newSet.add(handoverId);
      }
      return newSet;
    });
  };

  // Fetch handovers
  const { data: handoversData, isLoading } = useQuery<{
    handovers: Handover[];
  }>({
    queryKey: queryKeys.guide.logistics.handover({ tripId }),
    queryFn: async () => {
      const res = await fetch(`/api/guide/logistics/handover?tripId=${tripId}`);
      if (!res.ok) throw new Error('Failed to fetch handovers');
      return res.json();
    },
  });

  // Fetch warehouse user ID for inbound handovers
  const { data: warehouseUserData } = useQuery<{
    warehouseUserId: string | null;
    warehouseUserName: string | null;
  }>({
    queryKey: ['guide', 'branch', 'warehouse-user'],
    queryFn: async () => {
      const res = await fetch('/api/guide/branch/warehouse-user');
      if (!res.ok) return { warehouseUserId: null, warehouseUserName: null };
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch trip info to get trip type for item suggestions (use separate query key to avoid cache conflict)
  const { data: tripInfo } = useQuery<{
    tripType?: 'boat_trip' | 'land_trip' | null;
  }>({
    queryKey: ['guide', 'trip', 'trip-type', tripId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/guide/trips/${tripId}/preload`);
        if (!res.ok) {
          return { tripType: null };
        }
        const data = await res.json();
        return { tripType: data.tripType || null };
      } catch (_error) {
        return { tripType: null };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch package info to get facilities for item suggestions
  const { data: packageInfo } = useQuery<{
    package?: {
      facilities?: FacilityDisplayItem[];
    };
  }>({
    queryKey: ['guide', 'trip-package-info', tripId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/guide/trips/${tripId}/package-info`);
        if (!res.ok) {
          return { package: { facilities: [] } };
        }
        const data = await res.json();
        return {
          package: {
            facilities: data.package?.facilities || [],
          },
        };
      } catch (_error) {
        return { package: { facilities: [] } };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Create handover mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      handover_type: 'outbound' | 'inbound';
      items: HandoverItem[];
      signature: SignatureData | null;
    }) => {
      const requestBody = {
        trip_id: tripId,
        handover_type: data.handover_type,
        // Only include to_user_id for inbound (outbound will use current user from API)
        ...(data.handover_type === 'inbound' &&
        warehouseUserData?.warehouseUserId
          ? { to_user_id: warehouseUserData.warehouseUserId }
          : {}),
        items: data.items,
        from_signature: data.signature,
      };

      const res = await fetch(`/api/guide/logistics/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create handover');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Handover berhasil dibuat');
      setShowDialog(false);
      setItems([{ ...DEFAULT_HANDOVER_ITEM }]);
      setSignature(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.guide.logistics.handover({ tripId }),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat handover');
    },
  });

  // Memoize handovers to prevent reference changes on every render
  const handovers = useMemo(
    () => handoversData?.handovers || [],
    [handoversData?.handovers]
  );

  // Get latest outbound handover for stable dependency
  const latestOutboundHandover = useMemo(() => {
    return (
      handovers
        .filter(
          (h) => h.handover_type === 'outbound' && h.status === 'completed'
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] || null
    );
  }, [handovers]);

  // Get stable reference to outbound handover items
  const latestOutboundHandoverItems = useMemo(() => {
    return latestOutboundHandover?.items || [];
  }, [latestOutboundHandover?.id]);

  // Variance threshold (10%)
  const VARIANCE_THRESHOLD = 10;

  // Calculate variance percentage
  const calculateVariance = (
    inboundQty: number,
    outboundQty: number
  ): number => {
    if (outboundQty === 0) {
      return inboundQty > 0 ? 100 : 0;
    }
    return Math.abs((inboundQty - outboundQty) / outboundQty) * 100;
  };

  // Validation: Compare inbound items with outbound items (including variance detection)
  const inboundValidation = useMemo(() => {
    if (handoverType !== 'inbound' || items.length === 0) {
      return { valid: true, warnings: [], missing: [], variances: [] };
    }

    const outboundHandover = handovers
      .filter((h) => h.handover_type === 'outbound' && h.status === 'completed')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

    if (!outboundHandover?.items || outboundHandover.items.length === 0) {
      return { valid: true, warnings: [], missing: [], variances: [] };
    }

    const outboundItems = new Map(
      outboundHandover.items.map((item) => [item.name, item])
    );

    const warnings: string[] = [];
    const missing: string[] = [];
    const variances: Array<{
      itemName: string;
      variancePercent: number;
      inboundQty: number;
      outboundQty: number;
    }> = [];

    items.forEach((item) => {
      const outboundItem = outboundItems.get(item.name);
      if (!outboundItem) {
        warnings.push(`${item.name}: Item tidak ada di outbound handover`);
      } else {
        const outboundQty = outboundItem.quantity || 0;
        const inboundQty = item.quantity || 0;

        // Calculate variance
        const variancePercent = calculateVariance(inboundQty, outboundQty);

        // Flag high variance (>10%)
        if (variancePercent > VARIANCE_THRESHOLD) {
          variances.push({
            itemName: item.name,
            variancePercent,
            inboundQty,
            outboundQty,
          });
        }
      }
    });

    // Check for items in outbound but not in inbound
    const inboundNames = new Set(items.map((i) => i.name));
    outboundHandover.items.forEach((item) => {
      if (!inboundNames.has(item.name)) {
        missing.push(item.name);
      }
    });

    return {
      valid:
        missing.length === 0 && warnings.length === 0 && variances.length === 0,
      warnings,
      missing,
      variances,
    };
  }, [handoverType, items, handovers]);

  // Auto-populate inbound items from outbound handover
  useEffect(() => {
    // Reset flag when dialog closes or type changes
    if (!showDialog || handoverType === 'outbound') {
      hasPopulatedItemsRef.current = false;
      setItems([{ ...DEFAULT_HANDOVER_ITEM }]);
      return;
    }

    // Only populate once when dialog opens for inbound type
    if (
      handoverType === 'inbound' &&
      showDialog &&
      latestOutboundHandoverItems.length > 0 &&
      !hasPopulatedItemsRef.current
    ) {
      // Pre-populate items with expected_quantity from outbound
      const prePopulatedItems = latestOutboundHandoverItems.map((item) => ({
        ...item,
        expected_quantity: item.quantity, // Set expected from outbound
        quantity: 0, // Reset for user input
      }));
      setItems(prePopulatedItems);
      hasPopulatedItemsRef.current = true;
      toast.info(
        'Items telah diisi dari outbound handover. Silakan isi quantity yang dikembalikan.'
      );
    } else if (
      handoverType === 'inbound' &&
      showDialog &&
      latestOutboundHandoverItems.length === 0 &&
      !hasPopulatedItemsRef.current
    ) {
      // No outbound handover found, reset to default
      setItems([{ ...DEFAULT_HANDOVER_ITEM }]);
      hasPopulatedItemsRef.current = true;
    }
  }, [handoverType, showDialog, latestOutboundHandover?.id]); // Use latestOutboundHandover ID for stable dependency

  // Get suggested items based on trip type and package facilities
  const getSuggestedItems = (): HandoverItem[] => {
    const tripType = tripInfo?.tripType;
    const facilities = packageInfo?.package?.facilities || [];

    // Get template items based on trip type
    const templateItems: HandoverItem[] =
      tripType && (tripType === 'boat_trip' || tripType === 'land_trip')
        ? HANDOVER_ITEM_TEMPLATES[tripType].map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          }))
        : [];

    // Get items from package facilities
    const facilityItems: HandoverItem[] = mapFacilitiesToItems(facilities).map(
      (item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })
    );

    // Combine and deduplicate by name (case-insensitive)
    const allItems = [...templateItems, ...facilityItems];
    const seen = new Set<string>();
    const uniqueItems: HandoverItem[] = [];

    allItems.forEach((item) => {
      const key = item.name.toLowerCase().trim();
      if (!seen.has(key) && item.name.trim()) {
        seen.add(key);
        uniqueItems.push(item);
      }
    });

    return uniqueItems;
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 0, unit: 'piece' }]);
  };

  const handleQRScan = (qrData: string) => {
    try {
      // Parse QR code data - expected format: JSON string with items array
      const parsed = JSON.parse(qrData) as {
        items?: HandoverItem[];
        handover_id?: string;
      };

      if (parsed.items && Array.isArray(parsed.items)) {
        setItems(parsed.items);
        toast.success(
          `${parsed.items.length} item berhasil dimuat dari QR code`
        );
      } else if (parsed.handover_id) {
        // If QR contains handover ID, fetch that handover's items
        const handover = handovers.find((h) => h.id === parsed.handover_id);
        if (handover && handover.items) {
          setItems(handover.items);
          toast.success('Item dari handover berhasil dimuat');
        } else {
          toast.error('Handover tidak ditemukan');
        }
      } else {
        // Try to parse as simple format: "item1:qty1,item2:qty2"
        const simpleItems = qrData.split(',').map((part) => {
          const [name, qty] = part.split(':');
          return {
            name: name?.trim() || '',
            quantity: Number(qty?.trim()) || 0,
            unit: 'piece',
          };
        });

        if (simpleItems.length > 0 && simpleItems[0]?.name) {
          setItems(simpleItems);
          toast.success(
            `${simpleItems.length} item berhasil dimuat dari QR code`
          );
        } else {
          throw new Error('Format QR code tidak valid');
        }
      }
    } catch (error) {
      logger.error('Failed to parse QR code', error, { qrData });
      toast.error('Gagal memparse QR code. Format tidak valid.');
    }
  };

  const handleAddSuggestedItems = () => {
    const suggestedItems = getSuggestedItems();
    if (suggestedItems.length === 0) {
      toast.info('Tidak ada suggested items untuk trip type ini');
      return;
    }

    // Filter out items that already exist (by name)
    const existingNames = new Set(
      items.map((item) => item.name?.toLowerCase().trim() || '')
    );
    const newItems = suggestedItems.filter(
      (item) => item.name && !existingNames.has(item.name.toLowerCase().trim())
    );

    if (newItems.length === 0) {
      toast.info('Semua suggested items sudah ada di daftar');
      return;
    }

    setItems([...items, ...newItems]);
    toast.success(`${newItems.length} item ditambahkan dari template`);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    // Clean up file input ref
    delete fileInputRefs.current[index];
  };

  // Handle photo upload for item
  const handlePhotoUpload = async (index: number, file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingPhotos((prev) => ({ ...prev, [index]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tripId', tripId);

      const res = await fetch('/api/guide/logistics/handover/item-photo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload photo');
      }

      const { url } = await res.json();

      // Update item with photo URL
      const updated = [...items];
      if (updated[index]) {
        updated[index] = { ...updated[index], photo_url: url };
        setItems(updated);
        toast.success('Foto berhasil diupload');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal upload foto');
    } finally {
      setUploadingPhotos((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handlePhotoClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handlePhotoRemove = (index: number) => {
    const updated = [...items];
    if (updated[index]) {
      updated[index] = { ...updated[index], photo_url: undefined };
      setItems(updated);
    }
  };

  // Validate item quantity
  const validateItemQuantity = (item: HandoverItem): string | null => {
    if (item.quantity < 0) {
      return 'Quantity tidak boleh negatif';
    }
    if (item.unit === 'piece' && !Number.isInteger(item.quantity)) {
      return 'Quantity untuk piece harus bilangan bulat';
    }
    return null;
  };

  const handleItemChange = (
    index: number,
    field: keyof HandoverItem,
    value: string | number
  ) => {
    const updated = [...items];
    const currentItem = updated[index];
    if (!currentItem) return;
    updated[index] = { ...currentItem, [field]: value } as HandoverItem;
    setItems(updated);
  };

  const handleSubmit = () => {
    if (!signature) {
      toast.error('Tanda tangan wajib diisi');
      return;
    }

    // Validate all items
    const validationErrors: string[] = [];
    items.forEach((item, index) => {
      if (!item.name || item.name.trim() === '') {
        validationErrors.push(`Item ${index + 1}: Nama item wajib diisi`);
      }
      if (item.quantity <= 0) {
        validationErrors.push(`Item ${index + 1}: Quantity harus lebih dari 0`);
      }
      const quantityError = validateItemQuantity(item);
      if (quantityError) {
        validationErrors.push(`Item ${index + 1}: ${quantityError}`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    // For inbound handovers, warehouse user ID is required
    if (handoverType === 'inbound' && !warehouseUserData?.warehouseUserId) {
      toast.error('Warehouse user tidak ditemukan. Silakan hubungi admin.');
      return;
    }

    createMutation.mutate({
      handover_type: handoverType,
      items,
      signature,
    });
  };

  if (isLoading) {
    return <LoadingState message="Memuat handover..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Logistics Handover
          </h3>
          <p className="text-sm text-slate-600">
            Serah terima barang (warehouse ↔ guide)
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm">
          <Package className="mr-2 h-4 w-4" />
          Buat Handover
        </Button>
      </div>

      {/* Summary Card */}
      {handovers.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Outbound Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {handovers.filter(
                    (h) =>
                      h.handover_type === 'outbound' && h.status === 'completed'
                  ).length > 0
                    ? 'Completed'
                    : 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Inbound Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {handovers.filter(
                    (h) =>
                      h.handover_type === 'inbound' && h.status === 'completed'
                  ).length > 0
                    ? 'Completed'
                    : 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Items</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {handovers.reduce((sum, h) => sum + h.items.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">High Variances</p>
                <p className="mt-1 text-sm font-semibold text-amber-600">
                  {handovers
                    .filter((h) => h.handover_type === 'inbound')
                    .reduce((count, h) => {
                      const outbound = handovers
                        .filter(
                          (ho) =>
                            ho.handover_type === 'outbound' &&
                            ho.status === 'completed'
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                        )[0];
                      if (!outbound) return count;
                      const outboundMap = new Map(
                        outbound.items.map((item) => [item.name, item])
                      );
                      return (
                        count +
                        h.items.filter((item) => {
                          const outboundItem = outboundMap.get(item.name);
                          if (!outboundItem) return false;
                          const variance =
                            Math.abs(
                              (item.quantity - outboundItem.quantity) /
                                outboundItem.quantity
                            ) * 100;
                          return variance > VARIANCE_THRESHOLD;
                        }).length
                      );
                    }, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {handovers.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada handover"
          description="Buat handover untuk serah terima barang"
        />
      ) : (
        <div className="space-y-4">
          {handovers.map((handover, index) => {
            const isExpanded = expandedHandovers.has(handover.id);
            const isLast = index === handovers.length - 1;

            return (
              <div key={handover.id} className="relative">
                {/* Timeline Line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 h-full w-0.5 bg-slate-200" />
                )}

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Timeline Icon */}
                      <div
                        className={cn(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                          handover.handover_type === 'outbound'
                            ? 'bg-blue-100'
                            : 'bg-emerald-100'
                        )}
                      >
                        {handover.handover_type === 'outbound' ? (
                          <ArrowDown className="h-5 w-5 text-blue-600" />
                        ) : (
                          <ArrowUp className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {handover.handover_type === 'outbound'
                                ? 'Outbound'
                                : 'Inbound'}{' '}
                              Handover
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2 py-1 text-xs font-medium',
                                handover.status === 'completed' &&
                                  'bg-emerald-100 text-emerald-800',
                                handover.status === 'pending' &&
                                  'bg-amber-100 text-amber-800',
                                handover.status === 'disputed' &&
                                  'bg-red-100 text-red-800'
                              )}
                            >
                              {handover.status === 'completed' && 'Selesai'}
                              {handover.status === 'pending' && 'Pending'}
                              {handover.status === 'disputed' && 'Disputed'}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleHandoverExpand(handover.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(handover.created_at).toLocaleDateString(
                                'id-ID',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{handover.items.length} item</span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          {handover.verified_by_both ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Sudah ditandatangani kedua pihak</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-amber-600" />
                              <span>Menunggu tanda tangan</span>
                            </>
                          )}
                        </div>

                        {/* Expanded Items List */}
                        {isExpanded && (
                          <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-700">
                              Detail Items:
                            </p>
                            <div className="space-y-2">
                              {handover.items.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="flex items-center justify-between rounded bg-white p-2 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    {item.photo_url && (
                                      <div className="relative h-8 w-8 overflow-hidden rounded border border-slate-200">
                                        <Image
                                          src={item.photo_url}
                                          alt={item.name || 'Item'}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {item.name}
                                      </p>
                                      <p className="text-slate-500">
                                        {item.quantity} {item.unit}
                                        {item.expected_quantity !== undefined &&
                                          item.expected_quantity !==
                                            item.quantity && (
                                            <span className="ml-1 text-amber-600">
                                              (expected:{' '}
                                              {item.expected_quantity})
                                            </span>
                                          )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Signature Info */}
                            <div className="mt-3 border-t border-slate-200 pt-3 text-xs">
                              <div className="flex items-center gap-1 text-slate-600">
                                <User className="h-3 w-3" />
                                <span className="font-medium">Signatures:</span>
                              </div>
                              <div className="mt-1 space-y-1 text-slate-500">
                                {handover.from_signature_data && (
                                  <p>✓ From party signed</p>
                                )}
                                {handover.to_signature_data && (
                                  <p>✓ To party signed</p>
                                )}
                                {!handover.from_signature_data &&
                                  !handover.to_signature_data && (
                                    <p>No signatures yet</p>
                                  )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Handover Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Handover</DialogTitle>
            <DialogDescription>
              {handoverType === 'outbound'
                ? 'Terima barang dari warehouse'
                : 'Kembalikan barang ke warehouse'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Validation Warnings for Inbound */}
            {handoverType === 'inbound' && !inboundValidation.valid && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold text-red-900">Perhatian</p>
                    {inboundValidation.missing.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Item yang hilang dari outbound:
                        </p>
                        <ul className="mt-1 list-inside list-disc text-xs text-red-700">
                          {inboundValidation.missing.map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {inboundValidation.warnings.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Perbedaan quantity:
                        </p>
                        <ul className="mt-1 list-inside list-disc text-xs text-red-700">
                          {inboundValidation.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {inboundValidation.variances.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Variance tinggi (&gt;10%):
                        </p>
                        <ul className="mt-1 list-inside list-disc text-xs text-red-700">
                          {inboundValidation.variances.map((variance, idx) => (
                            <li key={idx}>
                              {variance.itemName}: {variance.inboundQty} vs{' '}
                              {variance.outboundQty} (variance:{' '}
                              {variance.variancePercent.toFixed(1)}%)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Handover Type */}
            <div>
              <Label>Jenis Handover</Label>
              <div className="mt-2 flex gap-2">
                <Button
                  variant={handoverType === 'outbound' ? 'default' : 'outline'}
                  onClick={() => setHandoverType('outbound')}
                  className="flex-1"
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Outbound (Terima)
                </Button>
                <Button
                  variant={handoverType === 'inbound' ? 'default' : 'outline'}
                  onClick={() => setHandoverType('inbound')}
                  className="flex-1"
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Inbound (Kembalikan)
                </Button>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQRScanner(true)}
                    className="text-xs"
                  >
                    <QrCode className="mr-1.5 h-3.5 w-3.5" />
                    Scan QR
                  </Button>
                  {handoverType === 'outbound' && tripInfo?.tripType && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSuggestedItems}
                      className="text-xs"
                    >
                      <Package className="mr-1.5 h-3.5 w-3.5" />
                      Tambah dari Template
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 space-y-3">
                {items.map((item, index) => {
                  // Check if this item has high variance (for inbound handovers)
                  const itemVariance =
                    handoverType === 'inbound'
                      ? inboundValidation.variances.find(
                          (v) => v.itemName === item.name
                        )
                      : null;
                  const hasHighVariance =
                    itemVariance &&
                    itemVariance.variancePercent > VARIANCE_THRESHOLD;

                  return (
                    <div
                      key={index}
                      className={cn(
                        'rounded-lg border p-3',
                        hasHighVariance && 'border-red-300 bg-red-50'
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Nama item"
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, 'name', e.target.value)
                            }
                            className={hasHighVariance ? 'border-red-300' : ''}
                          />
                          {hasHighVariance && (
                            <div
                              className="flex-shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                              title={`Variance: ${itemVariance.variancePercent.toFixed(1)}%`}
                            >
                              ⚠️ {itemVariance.variancePercent.toFixed(0)}%
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Jumlah"
                              value={item.quantity || ''}
                              onChange={(e) => {
                                const value =
                                  item.unit === 'piece'
                                    ? parseInt(e.target.value) || 0
                                    : parseFloat(e.target.value) || 0;
                                handleItemChange(index, 'quantity', value);
                              }}
                              step={item.unit === 'piece' ? '1' : '0.01'}
                              min="0"
                              className={
                                validateItemQuantity(item)
                                  ? 'border-red-300'
                                  : ''
                              }
                            />
                            {validateItemQuantity(item) && (
                              <p className="mt-1 text-xs text-red-600">
                                {validateItemQuantity(item)}
                              </p>
                            )}
                          </div>
                          <select
                            value={item.unit}
                            onChange={(e) =>
                              handleItemChange(index, 'unit', e.target.value)
                            }
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="piece">Pcs</option>
                            <option value="box">Box</option>
                            <option value="bottle">Botol</option>
                            <option value="liter">Liter</option>
                            <option value="kilogram">Kg</option>
                          </select>
                        </div>
                        {handoverType === 'inbound' && (
                          <Input
                            type="number"
                            placeholder="Expected quantity"
                            value={item.expected_quantity || ''}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'expected_quantity',
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        )}

                        {/* Photo Upload */}
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-600">
                            Foto Item (opsional)
                          </Label>
                          <input
                            type="file"
                            accept="image/*"
                            ref={(el) => {
                              fileInputRefs.current[index] = el;
                            }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void handlePhotoUpload(index, file);
                              }
                              // Reset input value so same file can be selected again
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                          {item.photo_url ? (
                            <div className="relative">
                              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
                                <Image
                                  src={item.photo_url}
                                  alt={item.name || 'Item photo'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePhotoRemove(index)}
                                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500 p-0 text-white hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePhotoClick(index)}
                              disabled={uploadingPhotos[index]}
                              className="w-full"
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              {uploadingPhotos[index]
                                ? 'Uploading...'
                                : 'Upload Foto'}
                            </Button>
                          )}
                        </div>
                        {items.length > 1 && (
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600"
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Hapus
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  onClick={() =>
                    setItems([...items, { ...DEFAULT_HANDOVER_ITEM }])
                  }
                  className="w-full"
                >
                  + Tambah Item
                </Button>
              </div>
            </div>

            {/* Signature */}
            <div>
              <Label>Tanda Tangan *</Label>
              <div className="mt-2">
                <SignaturePad
                  value={signature}
                  onChange={setSignature}
                  required
                  label="Tanda tangan untuk konfirmasi handover"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !signature}
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Handover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <QRScanner
        open={showQRScanner}
        onOpenChange={setShowQRScanner}
        onScan={handleQRScan}
        onError={(error) => {
          logger.error('QR scanner error', error);
          toast.error('Gagal memindai QR code');
        }}
      />
    </div>
  );
}
