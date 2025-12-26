import { RefundDetailClient } from './refund-detail-client';

export default function RefundDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  return <RefundDetailClient locale={locale} refundId={id} />;
}

