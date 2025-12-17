import MidtransClient from 'midtrans-client';

// Initialize Snap client
export const snap = new MidtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

// Initialize Core API client (for transaction status, etc)
export const coreApi = new MidtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export type PaymentMethod = 'qris' | 'bank_transfer' | 'credit_card' | 'gopay' | 'shopeepay';

export type CreateTransactionParams = {
  transactionDetails: {
    orderId: string;
    grossAmount: number;
  };
  customerDetails?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  enabledPayments?: PaymentMethod[];
};

export async function createTransaction(params: CreateTransactionParams) {
  try {
    const parameter = {
      transaction_details: params.transactionDetails,
      customer_details: params.customerDetails,
      item_details: params.itemDetails,
      enabled_payments: params.enabledPayments,
    };

    const transaction = await snap.createTransaction(parameter);
    return transaction;
  } catch (error) {
    console.error('Midtrans transaction error:', error);
    throw error;
  }
}

export async function getTransactionStatus(orderId: string) {
  try {
    const status = await coreApi.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error('Midtrans status check error:', error);
    throw error;
  }
}

