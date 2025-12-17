import { logger } from '@/lib/utils/logger';

const XENDIT_API_URL = 'https://api.xendit.co';

/**
 * Xendit Payment Gateway Integration
 * Docs: https://developers.xendit.co/api-reference
 */

export type PaymentMethod =
  | 'QRIS'
  | 'VIRTUAL_ACCOUNT'
  | 'CREDIT_CARD'
  | 'EWALLET'
  | 'RETAIL_OUTLET';

export type EWalletType = 'OVO' | 'DANA' | 'SHOPEEPAY' | 'LINKAJA' | 'GOPAY';

export type VirtualAccountBank =
  | 'BCA'
  | 'BNI'
  | 'BRI'
  | 'MANDIRI'
  | 'PERMATA'
  | 'BSI';

export type CreateInvoiceParams = {
  externalId: string;
  amount: number;
  description: string;
  payerEmail?: string;
  payerName?: string;
  payerPhone?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  currency?: 'IDR';
  invoiceDuration?: number; // seconds, default 86400 (24 hours)
  paymentMethods?: PaymentMethod[];
};

export type InvoiceResponse = {
  id: string;
  external_id: string;
  user_id: string;
  status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED';
  merchant_name: string;
  amount: number;
  payer_email: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
  updated: string;
};

export type DisbursementParams = {
  externalId: string;
  amount: number;
  bankCode: string;
  accountHolderName: string;
  accountNumber: string;
  description?: string;
};

export type DisbursementResponse = {
  id: string;
  external_id: string;
  amount: number;
  bank_code: string;
  account_holder_name: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  disbursement_description: string;
};

/**
 * Get Xendit auth header
 */
function getAuthHeader(): string {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    throw new Error('XENDIT_SECRET_KEY is not configured');
  }
  return `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
}

/**
 * Create Invoice (Payment Link)
 * Customer will be redirected to Xendit checkout page
 */
export async function createInvoice(
  params: CreateInvoiceParams
): Promise<InvoiceResponse> {
  try {
    const response = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: params.externalId,
        amount: params.amount,
        description: params.description,
        payer_email: params.payerEmail,
        customer: params.payerName
          ? {
              given_names: params.payerName,
              email: params.payerEmail,
              mobile_number: params.payerPhone,
            }
          : undefined,
        success_redirect_url: params.successRedirectUrl,
        failure_redirect_url: params.failureRedirectUrl,
        currency: params.currency ?? 'IDR',
        invoice_duration: params.invoiceDuration ?? 86400,
        payment_methods: params.paymentMethods,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Xendit create invoice error', error);
      throw new Error(error.message || 'Failed to create invoice');
    }

    const data = await response.json();
    logger.info('Xendit invoice created', { invoiceId: data.id });
    return data;
  } catch (error) {
    logger.error('Xendit create invoice error', error);
    throw error;
  }
}

/**
 * Get Invoice Status
 */
export async function getInvoiceStatus(
  invoiceId: string
): Promise<InvoiceResponse> {
  try {
    const response = await fetch(`${XENDIT_API_URL}/v2/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Xendit get invoice error', error);
      throw new Error(error.message || 'Failed to get invoice');
    }

    return await response.json();
  } catch (error) {
    logger.error('Xendit get invoice error', error);
    throw error;
  }
}

/**
 * Create Disbursement (Pay to bank account)
 * Use for paying vendors, guides, refunds
 */
export async function createDisbursement(
  params: DisbursementParams
): Promise<DisbursementResponse> {
  try {
    const response = await fetch(`${XENDIT_API_URL}/disbursements`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
        'X-IDEMPOTENCY-KEY': params.externalId,
      },
      body: JSON.stringify({
        external_id: params.externalId,
        amount: params.amount,
        bank_code: params.bankCode,
        account_holder_name: params.accountHolderName,
        account_number: params.accountNumber,
        description: params.description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Xendit disbursement error', error);
      throw new Error(error.message || 'Failed to create disbursement');
    }

    const data = await response.json();
    logger.info('Xendit disbursement created', { disbursementId: data.id });
    return data;
  } catch (error) {
    logger.error('Xendit disbursement error', error);
    throw error;
  }
}

/**
 * Verify Webhook Callback Token
 */
export function verifyWebhookToken(callbackToken: string): boolean {
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!expectedToken) {
    logger.warn('XENDIT_WEBHOOK_TOKEN not configured');
    return false;
  }
  return callbackToken === expectedToken;
}
