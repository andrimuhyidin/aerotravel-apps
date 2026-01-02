/**
 * Midtrans Snap Integration
 * Client-side integration for Midtrans payment popup
 */

import { env } from '@/lib/env';
import { logger } from '@/lib/utils/logger';

export type MidtransTransactionDetails = {
  orderId: string;
  amount: number;
};

export type MidtransCustomerDetails = {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
};

export type MidtransItemDetails = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type MidtransSnapConfig = {
  transactionDetails: MidtransTransactionDetails;
  customerDetails: MidtransCustomerDetails;
  itemDetails?: MidtransItemDetails[];
  creditCard?: {
    secure: boolean;
    saveCard?: boolean;
  };
  callbacks?: {
    onSuccess?: (result: MidtransResult) => void;
    onPending?: (result: MidtransResult) => void;
    onError?: (result: MidtransResult) => void;
    onClose?: () => void;
  };
};

export type MidtransResult = {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  finish_redirect_url?: string;
};

// Declare Snap globally
declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: MidtransResult) => void;
          onPending?: (result: MidtransResult) => void;
          onError?: (result: MidtransResult) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

/**
 * Load Midtrans Snap script
 */
export function loadMidtransScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Midtrans can only be loaded in browser'));
      return;
    }

    // Check if already loaded
    if (window.snap) {
      resolve();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="midtrans"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const clientKey = env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      reject(new Error('Midtrans client key not configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    script.onload = () => {
      logger.info('Midtrans Snap script loaded');
      resolve();
    };

    script.onerror = () => {
      logger.error('Failed to load Midtrans Snap script');
      reject(new Error('Failed to load Midtrans script'));
    };

    document.body.appendChild(script);
  });
}

/**
 * Open Midtrans Snap payment popup
 */
export async function openSnapPayment(
  snapToken: string,
  callbacks?: MidtransSnapConfig['callbacks']
): Promise<void> {
  await loadMidtransScript();

  if (!window.snap) {
    throw new Error('Midtrans Snap not available');
  }

  window.snap.pay(snapToken, {
    onSuccess: (result) => {
      logger.info('Midtrans payment success', { orderId: result.order_id });
      callbacks?.onSuccess?.(result);
    },
    onPending: (result) => {
      logger.info('Midtrans payment pending', { orderId: result.order_id });
      callbacks?.onPending?.(result);
    },
    onError: (result) => {
      logger.error('Midtrans payment error', { orderId: result.order_id, status: result.status_message });
      callbacks?.onError?.(result);
    },
    onClose: () => {
      logger.info('Midtrans popup closed');
      callbacks?.onClose?.();
    },
  });
}

/**
 * Request Snap token from server
 */
export async function requestSnapToken(bookingId: string): Promise<string> {
  const response = await fetch('/api/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment');
  }

  const data = await response.json();
  return data.snapToken;
}

/**
 * Helper to format currency for display
 */
export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

