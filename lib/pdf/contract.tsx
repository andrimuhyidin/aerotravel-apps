/**
 * Contract PDF Template
 * Generate PDF contract with signature support
 */

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  terms: {
    marginTop: 20,
    marginBottom: 20,
  },
  termItem: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    marginTop: 20,
  },
  signatureLine: {
    borderTop: '1 solid #000',
    marginTop: 60,
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 9,
  },
  signatureImage: {
    width: 150,
    height: 60,
    marginBottom: 5,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
});

export type ContractData = {
  contractNumber: string;
  contractType: 'per_trip' | 'monthly' | 'project' | 'seasonal' | 'annual';
  title: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  feeAmount: number;
  feeType: 'fixed' | 'per_trip' | 'percentage';
  paymentTerms?: string;
  termsAndConditions?: Record<string, unknown>;
  // Company info
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  // Guide info
  guideName: string;
  guideAddress?: string;
  guidePhone?: string;
  guideEmail?: string;
  guideIdNumber?: string;
  // Signatures
  guideSignatureUrl?: string | null;
  companySignatureUrl?: string | null;
  guideSignedAt?: string | null;
  companySignedAt?: string | null;
  // Audit Trail (Legal Compliance)
  guideSignerIp?: string | null;
  guideSignerUserAgent?: string | null;
  companySignerIp?: string | null;
  companySignerUserAgent?: string | null;
};

export function ContractPDF({ data }: { data: ContractData }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.companyName}</Text>
          {data.companyAddress && (
            <Text style={styles.companyAddress}>{data.companyAddress}</Text>
          )}
          {data.companyPhone && (
            <Text style={styles.companyAddress}>Tel: {data.companyPhone}</Text>
          )}
          {data.companyEmail && (
            <Text style={styles.companyAddress}>Email: {data.companyEmail}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>KONTRAK KERJA TOUR GUIDE</Text>

        {/* Contract Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Nomor Kontrak:</Text>
            <Text style={styles.value}>{data.contractNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Jenis Kontrak:</Text>
            <Text style={styles.value}>
              {data.contractType === 'per_trip' && 'Per Trip'}
              {data.contractType === 'monthly' && 'Bulanan'}
              {data.contractType === 'project' && 'Project'}
              {data.contractType === 'seasonal' && 'Musiman'}
              {data.contractType === 'annual' && 'Tahunan'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Judul:</Text>
            <Text style={styles.value}>{data.title}</Text>
          </View>
          {data.description && (
            <View style={styles.row}>
              <Text style={styles.label}>Deskripsi:</Text>
              <Text style={styles.value}>{data.description}</Text>
            </View>
          )}
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PIHAK-PIHAK</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Pihak Pertama (Perusahaan):</Text>
            <Text style={styles.value}>{data.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pihak Kedua (Guide):</Text>
            <Text style={styles.value}>{data.guideName}</Text>
          </View>
          {data.guideIdNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>NIK:</Text>
              <Text style={styles.value}>{data.guideIdNumber}</Text>
            </View>
          )}
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KETENTUAN KONTRAK</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Mulai:</Text>
            <Text style={styles.value}>{formatDate(data.startDate)}</Text>
          </View>
          {data.endDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Tanggal Berakhir:</Text>
              <Text style={styles.value}>{formatDate(data.endDate)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Fee:</Text>
            <Text style={styles.value}>
              {formatCurrency(data.feeAmount)}
              {data.feeType === 'per_trip' && ' per trip'}
              {data.feeType === 'percentage' && ' (persentase)'}
            </Text>
          </View>
          {data.paymentTerms && (
            <View style={styles.row}>
              <Text style={styles.label}>Syarat Pembayaran:</Text>
              <Text style={styles.value}>{data.paymentTerms}</Text>
            </View>
          )}
        </View>

        {/* Terms & Conditions */}
        {data.termsAndConditions && Object.keys(data.termsAndConditions).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SYARAT DAN KETENTUAN</Text>
            {Object.entries(data.termsAndConditions).map(([key, value], index) => (
              <View key={index} style={styles.termItem}>
                <Text style={{ fontWeight: 'bold' }}>{key}:</Text>
                <Text>
                  {typeof value === 'string'
                    ? value
                    : Array.isArray(value)
                      ? value.join(', ')
                      : JSON.stringify(value)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={{ marginBottom: 10, fontSize: 10 }}>Pihak Kedua (Guide)</Text>
            {data.guideSignatureUrl && !data.guideSignatureUrl.startsWith('typed:') && (
              <Image src={data.guideSignatureUrl} style={styles.signatureImage} />
            )}
            {data.guideSignatureUrl?.startsWith('typed:') && (
              <Text style={{ fontSize: 12, marginBottom: 5 }}>
                {data.guideSignatureUrl.replace('typed:', '')}
              </Text>
            )}
            <View style={styles.signatureLine}>
              <Text>{data.guideName}</Text>
              {data.guideSignedAt && (
                <Text style={{ fontSize: 8, marginTop: 5 }}>
                  {formatDate(data.guideSignedAt)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.signatureBox}>
            <Text style={{ marginBottom: 10, fontSize: 10 }}>Pihak Pertama (Perusahaan)</Text>
            {data.companySignatureUrl && !data.companySignatureUrl.startsWith('typed:') && (
              <Image src={data.companySignatureUrl} style={styles.signatureImage} />
            )}
            {data.companySignatureUrl?.startsWith('typed:') && (
              <Text style={{ fontSize: 12, marginBottom: 5 }}>
                {data.companySignatureUrl.replace('typed:', '')}
              </Text>
            )}
            <View style={styles.signatureLine}>
              <Text>{data.companyName}</Text>
              {data.companySignedAt && (
                <Text style={{ fontSize: 8, marginTop: 5 }}>
                  {formatDate(data.companySignedAt)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Audit Trail - Legal Compliance */}
        {(data.guideSignerIp || data.companySignerIp) && (
          <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 5 }}>
              AUDIT TRAIL (Untuk Keperluan Legal)
            </Text>
            {data.guideSignedAt && (
              <Text style={{ fontSize: 7, color: '#666' }}>
                Guide Sign: {formatDate(data.guideSignedAt)}
                {data.guideSignerIp && ` | IP: ${data.guideSignerIp}`}
              </Text>
            )}
            {data.companySignedAt && (
              <Text style={{ fontSize: 7, color: '#666' }}>
                Company Sign: {formatDate(data.companySignedAt)}
                {data.companySignerIp && ` | IP: ${data.companySignerIp}`}
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Dokumen ini dibuat secara elektronik dan memiliki kekuatan hukum yang sama dengan
            dokumen tertulis.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
