/**
 * Inventory Management Library Exports
 * Phase 2: Stock tracking, Vendor price lock
 */

// Stock Management
export {
  getInventoryItems,
  getLowStockItems,
  addStock,
  recordTripUsage,
  adjustStock,
  getTransactionHistory,
  createInventoryItem,
  type InventoryItem,
  type StockTransaction,
  type UsageRecord,
} from './stock';

// Vendor Management
export {
  getVendors,
  getVendorById,
  createVendorExpense,
  getTripExpenses,
  createVendor,
  updateVendorPrice,
  getVendorTypeLabel,
  type VendorType,
  type Vendor,
  type VendorExpense,
} from './vendor';
