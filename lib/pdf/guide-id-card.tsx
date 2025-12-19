/**
 * Guide ID Card PDF Template
 * AeroTravel Guide License (ATGL)
 */

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  card: {
    width: '85.6mm',
    height: '53.98mm',
    padding: '8mm',
    backgroundColor: '#ffffff',
    border: '1 solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4mm',
    borderBottom: '1 solid #10b981',
    paddingBottom: '2mm',
  },
  logo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  title: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    marginRight: '4mm',
  },
  rightSection: {
    width: '25mm',
    alignItems: 'center',
  },
  photo: {
    width: '25mm',
    height: '30mm',
    backgroundColor: '#f3f4f6',
    marginBottom: '2mm',
    border: '1 solid #e5e7eb',
  },
  qrCode: {
    width: '20mm',
    height: '20mm',
    backgroundColor: '#f3f4f6',
    border: '1 solid #e5e7eb',
  },
  guideName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: '2mm',
    color: '#111827',
  },
  cardNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: '1mm',
  },
  branchName: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: '2mm',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: '1mm',
  },
  infoLabel: {
    fontSize: 7,
    color: '#6b7280',
    width: '20mm',
  },
  infoValue: {
    fontSize: 7,
    color: '#111827',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '2mm',
    paddingTop: '2mm',
    borderTop: '1 solid #e5e7eb',
  },
  expiry: {
    fontSize: 7,
    color: '#6b7280',
  },
  statusBadge: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    padding: '1mm 2mm',
    borderRadius: 2,
  },
});

export type GuideIDCardData = {
  cardNumber: string;
  guideName: string;
  photoUrl?: string;
  branchName: string;
  issueDate: string;
  expiryDate: string;
  qrCodeData: string;
  status: string;
};

export function GuideIDCardPDF(data: GuideIDCardData): React.ReactElement {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Document>
      <Page size={[85.6, 53.98]} style={styles.page}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>AEROTRAVEL</Text>
              <Text style={styles.title}>Guide License</Text>
            </View>
            <Text style={styles.cardNumber}>{data.cardNumber}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.leftSection}>
              <Text style={styles.guideName}>{data.guideName}</Text>
              <Text style={styles.branchName}>{data.branchName}</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Issued:</Text>
                <Text style={styles.infoValue}>{formatDate(data.issueDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expires:</Text>
                <Text style={styles.infoValue}>{formatDate(data.expiryDate)}</Text>
              </View>
            </View>

            <View style={styles.rightSection}>
              {data.photoUrl ? (
                <Image src={data.photoUrl} style={styles.photo} />
              ) : (
                <View style={styles.photo} />
              )}
              <View style={styles.qrCode}>
                {/* QR Code will be rendered by client or server */}
                <Text style={{ fontSize: 6, textAlign: 'center', marginTop: '6mm' }}>
                  QR Code
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.expiry}>Valid until {formatDate(data.expiryDate)}</Text>
            <View style={styles.statusBadge}>
              <Text>{data.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
