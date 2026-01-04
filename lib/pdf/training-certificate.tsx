/**
 * Training Certificate PDF Generator
 * Uses @react-pdf/renderer
 */

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

type CertificateData = {
  certificateNumber: string;
  guideName: string;
  moduleTitle: string;
  category: string;
  completedAt: string;
  score: number | null;
  issuedAt: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#059669',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 5,
  },
  content: {
    marginTop: 40,
    marginBottom: 40,
  },
  text: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 1.6,
    textAlign: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#0f172a',
  },
  details: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 12,
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
  },
  certificateNumber: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 20,
    textAlign: 'center',
  },
});

export function TrainingCertificatePDF({ data }: { data: CertificateData }) {
  const completedDate = new Date(data.completedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const issuedDate = new Date(data.issuedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SERTIFIKAT KEHADIRAN TRAINING</Text>
          <Text style={styles.subtitle}>AeroTravel Guide Training Program</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.text}>
            Dengan ini menyatakan bahwa:
          </Text>
          <Text style={styles.name}>{data.guideName}</Text>
          <Text style={styles.text}>
            telah menyelesaikan training dengan judul:
          </Text>
          <Text style={styles.name}>{data.moduleTitle}</Text>
          <Text style={styles.text}>
            pada tanggal {completedDate}
          </Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text>Kategori:</Text>
            <Text>{data.category.toUpperCase()}</Text>
          </View>
          {data.score !== null && (
            <View style={styles.detailRow}>
              <Text>Nilai:</Text>
              <Text>{data.score}/100</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text>Tanggal Selesai:</Text>
            <Text>{completedDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text>Tanggal Diterbitkan:</Text>
            <Text>{issuedDate}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Certificate Number: {data.certificateNumber}</Text>
          <Text style={{ marginTop: 10 }}>
            Dokumen ini diterbitkan secara digital dan dapat diverifikasi melalui sistem AeroTravel
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF buffer for download
 */
export async function generateTrainingCertificatePDF(data: CertificateData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = <TrainingCertificatePDF data={data} />;
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}
