/**
 * Inventory Stock Management
 * Sesuai PRD 4.4.C - Vendor & Inventory Management
 * PRD 6.3.B - Inventory Audit (Logistik)
 * 
 * Features:
 * - Stock tracking (BBM, Konsumsi, dll)
 * - Stock opname
 * - Usage per trip
 * - Anomaly detection
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export type InventoryItem = {
  id: string;
  name: string;
  sku?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  isLowStock: boolean;
};

export type StockTransaction = {
  id: string;
  itemName: string;
  type: 'purchase' | 'usage' | 'adjustment' | 'transfer';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  tripCode?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
};

export type UsageRecord = {
  inventoryId: string;
  tripId: string;
  expectedQuantity: number;
  actualQuantity: number;
  variancePercent: number;
  isAnomaly: boolean;
  notes?: string;
};

/**
 * Get inventory items for a branch
 */
export async function getInventoryItems(branchId: string): Promise<InventoryItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('branch_id', branchId)
    .order('name') as {
      data: Array<{
        id: string;
        name: string;
        sku: string | null;
        unit: string;
        current_stock: number;
        min_stock: number;
        unit_cost: number;
      }> | null;
      error: Error | null;
    };

  if (error) {
    logger.error('Failed to get inventory', error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku ?? undefined,
    unit: item.unit,
    currentStock: Number(item.current_stock),
    minStock: Number(item.min_stock),
    unitCost: Number(item.unit_cost),
    isLowStock: Number(item.current_stock) <= Number(item.min_stock),
  }));
}

/**
 * Get low stock items (alerts)
 */
export async function getLowStockItems(branchId: string): Promise<InventoryItem[]> {
  const items = await getInventoryItems(branchId);
  return items.filter((item) => item.isLowStock);
}

/**
 * Add stock (purchase)
 */
export async function addStock(
  inventoryId: string,
  quantity: number,
  unitCost: number,
  notes?: string,
  createdBy?: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  // Get current stock
  const { data: item, error: itemError } = await supabase
    .from('inventory')
    .select('current_stock, unit_cost')
    .eq('id', inventoryId)
    .single();

  if (itemError || !item) {
    return { success: false, message: 'Item tidak ditemukan.' };
  }

  const stockBefore = Number(item.current_stock);
  const stockAfter = stockBefore + quantity;

  // Create transaction
  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert({
      inventory_id: inventoryId,
      transaction_type: 'purchase',
      quantity: quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      notes,
      created_by: createdBy,
    });

  if (txError) {
    logger.error('Create inventory transaction failed', txError);
    return { success: false, message: 'Gagal mencatat transaksi.' };
  }

  // Update stock and unit cost (average cost)
  const totalValue = stockBefore * Number(item.unit_cost) + quantity * unitCost;
  const newUnitCost = stockAfter > 0 ? totalValue / stockAfter : unitCost;

  const { error: updateError } = await supabase
    .from('inventory')
    .update({
      current_stock: stockAfter,
      unit_cost: newUnitCost,
    })
    .eq('id', inventoryId);

  if (updateError) {
    logger.error('Update inventory failed', updateError);
    return { success: false, message: 'Gagal update stok.' };
  }

  return { success: true, message: 'Stok berhasil ditambahkan.' };
}

/**
 * Record usage for a trip
 */
export async function recordTripUsage(
  inventoryId: string,
  tripId: string,
  actualQuantity: number,
  expectedQuantity: number,
  notes?: string,
  createdBy?: string
): Promise<{ success: boolean; isAnomaly: boolean; message: string }> {
  const supabase = createClient();

  // Get current stock
  const { data: item, error: itemError } = await supabase
    .from('inventory')
    .select('current_stock')
    .eq('id', inventoryId)
    .single();

  if (itemError || !item) {
    return { success: false, isAnomaly: false, message: 'Item tidak ditemukan.' };
  }

  const stockBefore = Number(item.current_stock);

  if (actualQuantity > stockBefore) {
    return { success: false, isAnomaly: false, message: 'Stok tidak mencukupi.' };
  }

  const stockAfter = stockBefore - actualQuantity;

  // Calculate variance
  const variancePercent = expectedQuantity > 0
    ? ((actualQuantity - expectedQuantity) / expectedQuantity) * 100
    : 0;
  
  // Anomaly if variance > 10% (sesuai PRD 6.3.B)
  const isAnomaly = Math.abs(variancePercent) > 10;

  // Create transaction
  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert({
      inventory_id: inventoryId,
      trip_id: tripId,
      transaction_type: 'usage',
      quantity: -actualQuantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      notes: isAnomaly
        ? `ANOMALY: Variance ${variancePercent.toFixed(1)}%. ${notes || ''}`
        : notes,
      created_by: createdBy,
    });

  if (txError) {
    logger.error('Create usage transaction failed', txError);
    return { success: false, isAnomaly: false, message: 'Gagal mencatat pemakaian.' };
  }

  // Update stock
  await supabase
    .from('inventory')
    .update({ current_stock: stockAfter })
    .eq('id', inventoryId);

  // If anomaly, flag trip expense
  if (isAnomaly) {
    await supabase
      .from('trip_expenses')
      .update({ is_anomaly: true })
      .eq('trip_id', tripId);
  }

  return {
    success: true,
    isAnomaly,
    message: isAnomaly
      ? `Pemakaian tercatat. ⚠️ Anomaly: selisih ${variancePercent.toFixed(1)}%`
      : 'Pemakaian berhasil dicatat.',
  };
}

/**
 * Stock adjustment (opname)
 */
export async function adjustStock(
  inventoryId: string,
  actualStock: number,
  reason: string,
  createdBy?: string
): Promise<{ success: boolean; variance: number; message: string }> {
  const supabase = createClient();

  const { data: item, error: itemError } = await supabase
    .from('inventory')
    .select('current_stock')
    .eq('id', inventoryId)
    .single();

  if (itemError || !item) {
    return { success: false, variance: 0, message: 'Item tidak ditemukan.' };
  }

  const stockBefore = Number(item.current_stock);
  const variance = actualStock - stockBefore;

  // Create adjustment transaction
  await supabase.from('inventory_transactions').insert({
    inventory_id: inventoryId,
    transaction_type: 'adjustment',
    quantity: variance,
    stock_before: stockBefore,
    stock_after: actualStock,
    notes: `Stock Opname: ${reason}`,
    created_by: createdBy,
  });

  // Update stock
  await supabase
    .from('inventory')
    .update({ current_stock: actualStock })
    .eq('id', inventoryId);

  return {
    success: true,
    variance,
    message: variance === 0
      ? 'Stok sesuai, tidak ada selisih.'
      : `Stok disesuaikan. Selisih: ${variance > 0 ? '+' : ''}${variance}`,
  };
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  inventoryId: string,
  limit: number = 50
): Promise<StockTransaction[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(`
      *,
      inventory:inventory(name),
      trip:trips(trip_code),
      created_by_user:users(full_name)
    `)
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to get transaction history', error);
    return [];
  }

  return data.map((tx) => ({
    id: tx.id,
    itemName: tx.inventory?.name || '',
    type: tx.transaction_type,
    quantity: Number(tx.quantity),
    stockBefore: Number(tx.stock_before),
    stockAfter: Number(tx.stock_after),
    tripCode: tx.trip?.trip_code ?? undefined,
    notes: tx.notes ?? undefined,
    createdAt: tx.created_at || new Date().toISOString(),
    createdBy: tx.created_by_user?.full_name ?? undefined,
  }));
}

/**
 * Create new inventory item
 */
export async function createInventoryItem(
  branchId: string,
  data: {
    name: string;
    sku?: string;
    unit: string;
    currentStock?: number;
    minStock?: number;
    unitCost?: number;
  }
): Promise<{ success: boolean; id?: string; message: string }> {
  const supabase = createClient();

  const { data: item, error } = await supabase
    .from('inventory')
    .insert({
      branch_id: branchId,
      name: data.name,
      sku: data.sku,
      unit: data.unit,
      current_stock: data.currentStock || 0,
      min_stock: data.minStock || 0,
      unit_cost: data.unitCost || 0,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Create inventory item failed', error);
    return { success: false, message: 'Gagal membuat item.' };
  }

  return { success: true, id: item.id, message: 'Item berhasil dibuat.' };
}
