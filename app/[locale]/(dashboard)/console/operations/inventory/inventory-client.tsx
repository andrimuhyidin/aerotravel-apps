'use client';

/**
 * Inventory Management Client Component
 * Kelola stok logistik (life jacket, snorkel, dll)
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    adjustStock,
    getInventoryItems,
    type InventoryItem,
} from '@/lib/inventory';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Box,
    Loader2,
    Minus,
    Package,
    Plus,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function InventoryClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);

  const branchId = 'demo-branch-id';

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const itemsData = await getInventoryItems(branchId);
    setItems(itemsData);
    // TODO: Implement anomaly detection when types are generated
    setAnomalyCount(0);
    setLoading(false);
  };

  const handleAdjustStock = async (itemId: string, type: 'add' | 'remove') => {
    if (adjustQuantity <= 0) return;

    const qty = type === 'add' ? adjustQuantity : -adjustQuantity;
    await adjustStock(itemId, qty, 'adjustment', 'Manual adjustment');
    setAdjustingId(null);
    setAdjustQuantity(0);
    await loadInventory();
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = items.filter((item) => item.currentStock <= item.minStock);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Kelola stok logistik dan peralatan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm">Total Item</span>
            </div>
            <div className="text-2xl font-bold mt-1">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Box className="h-4 w-4" />
              <span className="text-sm">Total Stok</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {items.reduce((sum, i) => sum + i.currentStock, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className={cn(lowStockItems.length > 0 && 'border-amber-500')}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-amber-600">
              <ArrowDown className="h-4 w-4" />
              <span className="text-sm">Stok Rendah</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-amber-600">
              {lowStockItems.length}
            </div>
          </CardContent>
        </Card>
        <Card className={cn(anomalyCount > 0 && 'border-red-500')}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Anomali</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">
              {anomalyCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-500 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <span
                  key={item.id}
                  className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm"
                >
                  {item.name}: {item.currentStock}/{item.minStock}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Inventory List */}
      <div className="grid gap-3">
        {filteredItems.map((item) => {
          const isLowStock = item.currentStock <= item.minStock;
          const isAdjusting = adjustingId === item.id;

          return (
            <Card
              key={item.id}
              className={cn(isLowStock && 'border-amber-300')}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {isLowStock && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                          Stok Rendah
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Unit: {item.unit} • Min: {item.minStock}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        isLowStock ? 'text-amber-600' : 'text-green-600'
                      )}
                    >
                      {item.currentStock}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.unit}
                    </div>
                  </div>

                  {isAdjusting ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={adjustQuantity}
                        onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                        className="w-20"
                        min={1}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustStock(item.id, 'remove')}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAdjustStock(item.id, 'add')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAdjustingId(null);
                          setAdjustQuantity(0);
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAdjustingId(item.id)}
                      >
                        <ArrowUp className="h-4 w-4 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Tidak ada item yang cocok' : 'Belum ada item inventory'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
