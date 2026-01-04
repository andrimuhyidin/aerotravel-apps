import { AggregatedInvoicesClient } from './aggregated-invoices-client';

export default function AggregatedInvoicesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <AggregatedInvoicesClient locale={locale} />;
}

