/**
 * Type declarations for web-push module
 * @see https://github.com/web-push-libs/web-push
 */

declare module 'web-push' {
  export interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  export interface SendOptions {
    TTL?: number;
    headers?: Record<string, string>;
    vapidDetails?: {
      subject: string;
      publicKey: string;
      privateKey: string;
    };
    contentEncoding?: 'aes128gcm' | 'aesgcm';
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    topic?: string;
  }

  export function generateVAPIDKeys(): VapidKeys;
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;
  export function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer | null,
    options?: SendOptions
  ): Promise<{
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }>;
  export function encrypt(
    userPublicKey: string,
    userAuth: string,
    payload: string | Buffer,
    contentEncoding?: 'aes128gcm' | 'aesgcm'
  ): {
    localPublicKey: string;
    salt: string;
    ciphertext: Buffer;
  };
}

