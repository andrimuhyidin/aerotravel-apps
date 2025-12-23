/**
 * Payment Page - Customer Payment Flow
 * PRD 4.3.C - Payment Gateway & Auto-Verification
 *
 * Route: /payment/[id]
 * Access: Protected (Customer, owner of booking only)
 */

import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Payment Booking #${id} - Aero Travel`,
  };
}

export default async function PaymentPage({ params }: Props) {
  const { id } = await params;

  // TODO: Fetch booking data
  // TODO: Verify booking belongs to user
  // TODO: Check if already paid
  // TODO: Generate Midtrans Snap Token
  // TODO: Show payment methods (QRIS, VA, CC, PayLater)
  // TODO: Implement payment form

  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="mb-6 text-3xl font-bold">Payment Booking #{id}</h1>

          {/* TODO: Booking summary */}
          {/* TODO: Payment amount breakdown */}
          {/* TODO: Payment method selection */}
          {/* TODO: Midtrans payment widget */}
          {/* TODO: Upload proof of payment (for manual transfer) */}
          {/* TODO: Vision AI integration (PRD 5.2.B) */}

          <div className="rounded-lg bg-muted p-8">
            <p className="text-muted-foreground">
              Payment page will be implemented here.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
