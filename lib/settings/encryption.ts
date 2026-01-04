/**
 * Settings Encryption Utilities
 * Encrypt/decrypt sensitive setting values using Supabase RPC functions
 */

/**
 * NOTE: Cannot use 'server-only' because lib/settings/index.ts imports this
 * and settings is dynamically imported by client-compatible code.
 * The createClient() call will fail at runtime if called from client, which is safe.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Encrypt a sensitive value for secure storage
 * Uses pgcrypto on the database side
 */
export async function encryptSensitiveValue(
  plainText: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('encrypt_setting', {
      plain_text: plainText,
    });

    if (error) {
      logger.error('Failed to encrypt setting value', error);
      return null;
    }

    return data as string;
  } catch (error) {
    logger.error('Encryption error', error);
    return null;
  }
}

/**
 * Decrypt a sensitive value from storage
 * Uses pgcrypto on the database side
 */
export async function decryptSensitiveValue(
  cipherText: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('decrypt_setting', {
      cipher_text: cipherText,
    });

    if (error) {
      logger.error('Failed to decrypt setting value', error);
      return null;
    }

    return data as string;
  } catch (error) {
    logger.error('Decryption error', error);
    return null;
  }
}

/**
 * Mask a sensitive value for display (show last 4 chars only)
 */
export function maskSensitiveValue(value: string | undefined): string {
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return '••••••••' + value.slice(-4);
}

/**
 * Check if a value appears to be encrypted (base64 format)
 */
export function isEncrypted(value: string): boolean {
  // Encrypted values from pgcrypto are base64 encoded
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return value.length > 50 && base64Regex.test(value);
}

/**
 * Process a setting value - decrypt if encrypted, return as-is otherwise
 */
export async function processSettingValue(
  value: string,
  isSensitive: boolean
): Promise<string> {
  if (!isSensitive) return value;

  if (isEncrypted(value)) {
    const decrypted = await decryptSensitiveValue(value);
    return decrypted || value;
  }

  return value;
}

/**
 * Prepare a sensitive value for storage - encrypt it
 */
export async function prepareForStorage(
  value: string,
  isSensitive: boolean
): Promise<{ value: string; value_encrypted: string | null }> {
  if (!isSensitive) {
    return { value, value_encrypted: null };
  }

  const encrypted = await encryptSensitiveValue(value);
  if (encrypted) {
    // Store masked value in regular column, encrypted in secure column
    return {
      value: maskSensitiveValue(value),
      value_encrypted: encrypted,
    };
  }

  // Fallback: store as-is if encryption fails (not recommended)
  logger.warn('Storing sensitive value without encryption');
  return { value, value_encrypted: null };
}

