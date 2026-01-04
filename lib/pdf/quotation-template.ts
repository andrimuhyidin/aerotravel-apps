/**
 * PDF Quotation Template
 * Generate invoice/quotation PDF data
 */

export type QuotationData = {
  booking: {
    code: string;
    date: string;
    tripDate: string;
    status: string;
  };
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  package: {
    name: string;
    destination: string;
    duration: string;
    inclusions: string[];
  };
  pricing: {
    adultPax: number;
    childPax: number;
    pricePerAdult: number;
    pricePerChild: number;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  notes?: string;
  validUntil?: string;
};

/**
 * Generate HTML template for quotation
 * Can be converted to PDF using puppeteer or similar
 */
export function generateQuotationHTML(data: QuotationData): string {
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation ${data.booking.code}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #2563eb; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .info-box { background: #f8fafc; padding: 16px; border-radius: 8px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .label { color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; font-size: 14px; }
    .total-row td { border-top: 2px solid #2563eb; }
    .inclusions { list-style: none; }
    .inclusions li { padding: 4px 0; }
    .inclusions li:before { content: "✓"; color: #22c55e; margin-right: 8px; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
    .notes { background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 24px; }
    .terms { font-size: 10px; color: #64748b; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛫 ${data.company.name}</div>
      <div class="doc-info">
        <div class="doc-title">QUOTATION</div>
        <div>${data.booking.code}</div>
        <div>Tanggal: ${formatDate(data.booking.date)}</div>
      </div>
    </div>

    <div class="grid">
      <div class="section">
        <div class="section-title">Kepada</div>
        <div class="info-box">
          <div><strong>${data.customer.name}</strong></div>
          <div>${data.customer.phone}</div>
          ${data.customer.email ? `<div>${data.customer.email}</div>` : ''}
        </div>
      </div>
      <div class="section">
        <div class="section-title">Detail Trip</div>
        <div class="info-box">
          <div><strong>${data.package.name}</strong></div>
          <div>${data.package.destination}</div>
          <div>${data.package.duration}</div>
          <div>Berangkat: ${formatDate(data.booking.tripDate)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Rincian Biaya</div>
      <table>
        <thead>
          <tr>
            <th>Deskripsi</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Harga</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dewasa</td>
            <td class="text-right">${data.pricing.adultPax}</td>
            <td class="text-right">${formatPrice(data.pricing.pricePerAdult)}</td>
            <td class="text-right">${formatPrice(data.pricing.pricePerAdult * data.pricing.adultPax)}</td>
          </tr>
          ${
            data.pricing.childPax > 0
              ? `
          <tr>
            <td>Anak-anak (2-5 thn)</td>
            <td class="text-right">${data.pricing.childPax}</td>
            <td class="text-right">${formatPrice(data.pricing.pricePerChild)}</td>
            <td class="text-right">${formatPrice(data.pricing.pricePerChild * data.pricing.childPax)}</td>
          </tr>
          `
              : ''
          }
          ${
            data.pricing.discount > 0
              ? `
          <tr>
            <td colspan="3">Diskon</td>
            <td class="text-right">-${formatPrice(data.pricing.discount)}</td>
          </tr>
          `
              : ''
          }
          <tr class="total-row">
            <td colspan="3"><strong>TOTAL</strong></td>
            <td class="text-right"><strong>${formatPrice(data.pricing.total)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Termasuk dalam Paket</div>
      <ul class="inclusions">
        ${data.package.inclusions.map((i) => `<li>${i}</li>`).join('')}
      </ul>
    </div>

    ${
      data.notes
        ? `
    <div class="notes">
      <strong>Catatan:</strong> ${data.notes}
    </div>
    `
        : ''
    }

    <div class="footer">
      <div class="grid">
        <div>
          <strong>${data.company.name}</strong><br>
          ${data.company.address}<br>
          ${data.company.phone} | ${data.company.email}
        </div>
        <div class="text-right">
          ${data.validUntil ? `<div>Berlaku hingga: ${formatDate(data.validUntil)}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="terms">
      <strong>Syarat & Ketentuan:</strong><br>
      • Harga dapat berubah sewaktu-waktu<br>
      • Pembayaran DP minimal 50% untuk konfirmasi booking<br>
      • Pelunasan maksimal H-3 sebelum keberangkatan
    </div>
  </div>
</body>
</html>
  `.trim();
}
