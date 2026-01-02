/**
 * API: Purchase Gift Voucher
 * POST /api/partner/vouchers/purchase - Buy a gift voucher
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const purchaseSchema = z.object({
  amount: z.number().min(100000, 'Minimal Rp 100.000'),
  recipientName: z.string().min(2),
  recipientEmail: z.string().email().optional().nullable(),
  recipientPhone: z.string().optional().nullable(),
  senderName: z.string().min(2),
  message: z.string().max(200).optional().nullable(),
  deliveryMethod: z.enum(['email', 'whatsapp', 'both']),
});

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'GV-';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const sanitizedBody = sanitizeRequestBody(body, { 
    strings: ['recipientName', 'senderName', 'message'], 
    emails: ['recipientEmail'], 
    phones: ['recipientPhone'] 
  });
  const validation = purchaseSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const {
    amount,
    recipientName,
    recipientEmail,
    recipientPhone,
    senderName,
    message,
    deliveryMethod,
  } = validation.data;

  try {
    // Check wallet balance
    const { data: wallet, error: walletError } = await client
      .from('mitra_wallets')
      .select('id, balance')
      .eq('mitra_id', partnerId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet tidak ditemukan. Silakan top-up terlebih dahulu.' },
        { status: 400 }
      );
    }

    if (Number(wallet.balance) < amount) {
      return NextResponse.json(
        { error: `Saldo tidak mencukupi. Diperlukan ${amount.toLocaleString('id-ID')}, tersedia ${Number(wallet.balance).toLocaleString('id-ID')}` },
        { status: 400 }
      );
    }

    // Generate unique voucher code
    let voucherCode = generateVoucherCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existing } = await client
        .from('gift_vouchers')
        .select('id')
        .eq('code', voucherCode)
        .maybeSingle();

      if (!existing) break;
      voucherCode = generateVoucherCode();
      attempts++;
    }

    // Calculate expiry (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create voucher
    const { data: voucher, error: voucherError } = await client
      .from('gift_vouchers')
      .insert({
        partner_id: partnerId,
        code: voucherCode,
        amount,
        currency: 'IDR',
        recipient_name: recipientName,
        recipient_email: recipientEmail || null,
        recipient_phone: recipientPhone || null,
        sender_name: senderName,
        message: message || null,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select('id, code')
      .single();

    if (voucherError || !voucher) {
      logger.error('Failed to create voucher', voucherError, { userId: user.id });
      throw voucherError;
    }

    // Debit wallet
    const balanceBefore = Number(wallet.balance);
    const newBalance = balanceBefore - amount;

    await client.from('mitra_wallet_transactions').insert({
      wallet_id: wallet.id,
      transaction_type: 'voucher_purchase',
      amount: -amount,
      balance_before: balanceBefore,
      balance_after: newBalance,
      description: `Pembelian Gift Voucher ${voucherCode}`,
    });

    await client.from('mitra_wallets').update({ balance: newBalance }).eq('id', wallet.id);

    // Send voucher notification
    if (deliveryMethod === 'email' || deliveryMethod === 'both') {
      if (recipientEmail) {
        try {
          const { sendEmail } = await import('@/lib/integrations/resend');
          await sendEmail({
            to: recipientEmail,
            subject: `🎁 Anda menerima Gift Voucher dari ${senderName}!`,
            html: `
              <h2>Selamat! Anda menerima Gift Voucher!</h2>
              <p>Halo ${recipientName},</p>
              <p>${senderName} mengirimkan Anda gift voucher senilai <strong>Rp ${amount.toLocaleString('id-ID')}</strong>.</p>
              ${message ? `<blockquote>"${message}"</blockquote>` : ''}
              <p>Kode Voucher: <strong>${voucherCode}</strong></p>
              <p>Gunakan kode ini saat checkout untuk mendapatkan potongan.</p>
              <p>Berlaku hingga: ${expiresAt.toLocaleDateString('id-ID')}</p>
            `,
          });
        } catch (emailError) {
          logger.warn('Failed to send voucher email', { voucherId: voucher.id, error: emailError });
        }
      }
    }

    if (deliveryMethod === 'whatsapp' || deliveryMethod === 'both') {
      if (recipientPhone) {
        try {
          const { sendMessage } = await import('@/lib/integrations/whatsapp');
          await sendMessage({
            to: recipientPhone,
            type: 'text',
            text: `🎁 Halo ${recipientName}!\n\n${senderName} mengirimkan Anda Gift Voucher senilai Rp ${amount.toLocaleString('id-ID')}!\n\n${message ? `"${message}"\n\n` : ''}Kode Voucher: *${voucherCode}*\nBerlaku hingga: ${expiresAt.toLocaleDateString('id-ID')}\n\nGunakan kode ini saat checkout di MyAeroTravel!`,
          });
        } catch (waError) {
          logger.warn('Failed to send voucher WhatsApp', { voucherId: voucher.id, error: waError });
        }
      }
    }

    logger.info('Gift voucher purchased', {
      userId: user.id,
      voucherId: voucher.id,
      voucherCode,
      amount,
    });

    return NextResponse.json({
      success: true,
      voucherId: voucher.id,
      voucherCode,
    });
  } catch (error) {
    logger.error('Failed to purchase voucher', error, { userId: user.id });
    throw error;
  }
});

