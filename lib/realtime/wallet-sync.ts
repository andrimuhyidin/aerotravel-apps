/**
 * Wallet Real-time Sync Service
 * Real-time synchronization untuk wallet balance changes
 */

'use client';

import { createRealtimeChannel } from './realtime-client';
import { logger } from '@/lib/utils/logger';

/**
 * Setup real-time sync untuk wallet balance
 * @param userId - User ID
 * @param walletType - 'partner' | 'guide'
 * @param onBalanceChange - Callback function untuk balance updates
 * @returns Unsubscribe function
 */
export function setupWalletRealtimeSync(
  userId: string,
  walletType: 'partner' | 'guide',
  onBalanceChange: (balance: number) => void
): () => void {
  const tableName =
    walletType === 'partner' ? 'mitra_wallet_transactions' : 'guide_wallet_transactions';

  const channel = createRealtimeChannel<{ new: any; old: any }>(
    `wallet-${walletType}-${userId}`,
    {
      table: tableName,
      event: '*', // INSERT, UPDATE, DELETE
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      try {
        // Extract balance from transaction
        const transaction = payload.new || payload.old;
        if (!transaction) return;

        // Get new balance from transaction
        const newBalance = transaction.balance_after || transaction.balance_before || 0;
        onBalanceChange(newBalance);

        logger.debug('[Wallet Sync] Balance changed', {
          userId,
          walletType,
          newBalance,
        });
      } catch (error) {
        logger.error('[Wallet Sync] Error processing update', error, { userId, walletType });
      }
    }
  );

  return () => {
    channel.unsubscribe();
    logger.debug('[Wallet Sync] Unsubscribed', { userId, walletType });
  };
}

/**
 * Setup real-time sync untuk wallet transactions
 * Returns transaction updates instead of just balance
 */
export function setupWalletTransactionsRealtimeSync(
  userId: string,
  walletType: 'partner' | 'guide',
  onTransactionUpdate: (transaction: any) => void
): () => void {
  const tableName =
    walletType === 'partner' ? 'mitra_wallet_transactions' : 'guide_wallet_transactions';

  const channel = createRealtimeChannel<{ new: any; old: any }>(
    `wallet-transactions-${walletType}-${userId}`,
    {
      table: tableName,
      event: '*',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      try {
        const transaction = payload.new || payload.old;
        if (transaction) {
          onTransactionUpdate(transaction);
        }
      } catch (error) {
        logger.error('[Wallet Sync] Error processing transaction update', error, {
          userId,
          walletType,
        });
      }
    }
  );

  return () => {
    channel.unsubscribe();
  };
}

