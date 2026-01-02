/**
 * Annual Compliance Report PDF Template
 * Generate PDF laporan tahunan untuk Dinas Pariwisata
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import { ASITAMembershipInfo, type ASITABadgeData } from './asita-badge';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: '#1e3a8a',
    borderRadius: 30,
    margin: '0 auto 15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  period: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '2 solid #1e3a8a',
  },
  companyInfo: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 120,
    fontWeight: 'bold',
    color: '#666',
  },
  infoValue: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  statCardLast: {
    marginRight: 0,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0fdf4',
    border: '2 solid #22c55e',
    borderRadius: 5,
    marginBottom: 20,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreDescription: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    padding: 8,
  },
  tableHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 9,
  },
  statusBadge: {
    padding: '2 6',
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
  },
  statusValid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusWarning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusExpired: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  timeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timelineMonth: {
    width: 100,
    fontWeight: 'bold',
    fontSize: 10,
  },
  timelineLicenses: {
    flex: 1,
  },
  timelineLicense: {
    backgroundColor: '#fef3c7',
    padding: '3 8',
    borderRadius: 3,
    marginBottom: 3,
    fontSize: 9,
  },
  recommendations: {
    marginTop: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 5,
    borderLeft: '4 solid #f59e0b',
  },
  recommendationIcon: {
    width: 20,
    marginRight: 10,
    fontSize: 14,
  },
  recommendationText: {
    flex: 1,
    fontSize: 10,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1 solid #e5e7eb',
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
  },
  signatureBox: {
    flex: 1,
    textAlign: 'center',
  },
  signatureLine: {
    borderBottom: '1 solid #000',
    marginTop: 60,
    marginBottom: 5,
    width: 150,
    marginHorizontal: 'auto',
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  signatureTitle: {
    fontSize: 9,
    color: '#666',
  },
});

export type ComplianceReportData = {
  // Company Info
  companyName: string;
  companyAddress: string;
  nib?: string;
  phone?: string;
  email?: string;
  // Report Period
  year: number;
  generatedAt: string;
  // Compliance Score
  complianceScore: number;
  // Statistics
  stats: {
    totalLicenses: number;
    byStatus: {
      valid: number;
      warning: number;
      critical: number;
      expired: number;
    };
    byType: Record<string, number>;
  };
  // Licenses
  licenses: Array<{
    licenseType: string;
    licenseNumber: string;
    licenseName: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate: string | null;
    status: string;
  }>;
  // Renewal Timeline
  renewalTimeline: Array<{
    month: string;
    licenses: Array<{
      name: string;
      type: string;
      expiryDate: string;
    }>;
  }>;
  // Recommendations
  recommendations: string[];
  // ASITA Membership
  asitaMembership?: ASITABadgeData;
  // Signatory
  signatory?: {
    name: string;
    title: string;
  };
};

const licenseTypeLabels: Record<string, string> = {
  nib: 'NIB',
  skdn: 'SKDN',
  sisupar: 'SISUPAR',
  tdup: 'TDUP',
  asita: 'ASITA',
  chse: 'CHSE',
};

function getStatusStyle(status: string) {
  switch (status) {
    case 'valid':
      return styles.statusValid;
    case 'warning':
    case 'critical':
      return styles.statusWarning;
    case 'expired':
      return styles.statusExpired;
    default:
      return {};
  }
}

export function ComplianceReportPDF({ data }: { data: ComplianceReportData }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Baik - Semua izin dalam kondisi valid';
    if (score >= 60) return 'Perlu Perhatian - Ada izin yang akan expired';
    return 'Kritis - Ada izin yang expired';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>AERO</Text>
          </View>
          <Text style={styles.title}>LAPORAN COMPLIANCE IZIN USAHA</Text>
          <Text style={styles.subtitle}>Sesuai Permenparekraf/ASITA/Sisupar</Text>
          <Text style={styles.period}>Tahun {data.year}</Text>
        </View>

        {/* Company Info */}
        <View style={styles.companyInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Perusahaan:</Text>
            <Text style={styles.infoValue}>{data.companyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alamat:</Text>
            <Text style={styles.infoValue}>{data.companyAddress}</Text>
          </View>
          {data.nib && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NIB:</Text>
              <Text style={styles.infoValue}>{data.nib}</Text>
            </View>
          )}
          {data.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telepon:</Text>
              <Text style={styles.infoValue}>{data.phone}</Text>
            </View>
          )}
        </View>

        {/* ASITA Membership */}
        {data.asitaMembership && (
          <View style={styles.section}>
            <ASITAMembershipInfo data={data.asitaMembership} />
          </View>
        )}

        {/* Compliance Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skor Compliance</Text>
          <View style={[styles.scoreSection, { borderColor: getScoreColor(data.complianceScore) }]}>
            <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(data.complianceScore) }]}>
              <Text style={styles.scoreValue}>{data.complianceScore}%</Text>
            </View>
            <View>
              <Text style={styles.scoreLabel}>
                {data.complianceScore >= 80 ? 'Compliance Baik' : data.complianceScore >= 60 ? 'Perlu Perhatian' : 'Compliance Kritis'}
              </Text>
              <Text style={styles.scoreDescription}>{getScoreLabel(data.complianceScore)}</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Status Izin</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.stats.totalLicenses}</Text>
              <Text style={styles.statLabel}>Total Izin</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.statValue, { color: '#166534' }]}>{data.stats.byStatus.valid}</Text>
              <Text style={styles.statLabel}>Valid</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.statValue, { color: '#92400e' }]}>{data.stats.byStatus.warning}</Text>
              <Text style={styles.statLabel}>Warning</Text>
            </View>
            <View style={[styles.statCard, styles.statCardLast, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.statValue, { color: '#991b1b' }]}>{data.stats.byStatus.expired}</Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </View>
        </View>

        {/* License Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daftar Izin Usaha</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: 50 }]}>Jenis</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Nama Izin</Text>
              <Text style={[styles.tableHeaderText, { width: 80 }]}>Nomor</Text>
              <Text style={[styles.tableHeaderText, { width: 70 }]}>Berlaku s/d</Text>
              <Text style={[styles.tableHeaderText, { width: 50 }]}>Status</Text>
            </View>
            {data.licenses.map((license, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: 50 }]}>
                  {licenseTypeLabels[license.licenseType] || license.licenseType.toUpperCase()}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{license.licenseName}</Text>
                <Text style={[styles.tableCell, { width: 80 }]}>{license.licenseNumber}</Text>
                <Text style={[styles.tableCell, { width: 70 }]}>
                  {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString('id-ID') : '-'}
                </Text>
                <View style={{ width: 50 }}>
                  <Text style={[styles.statusBadge, getStatusStyle(license.status)]}>
                    {license.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Renewal Timeline */}
        {data.renewalTimeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline Perpanjangan (12 Bulan ke Depan)</Text>
            <View style={styles.timeline}>
              {data.renewalTimeline.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <Text style={styles.timelineMonth}>{item.month}</Text>
                  <View style={styles.timelineLicenses}>
                    {item.licenses.map((license, idx) => (
                      <Text key={idx} style={styles.timelineLicense}>
                        {licenseTypeLabels[license.type] || license.type.toUpperCase()} - {license.name}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekomendasi</Text>
            <View style={styles.recommendations}>
              {data.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationIcon}>⚠️</Text>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signature */}
        {data.signatory && (
          <View style={styles.signature}>
            <View style={styles.signatureBox}>
              {/* Empty for left spacing */}
            </View>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{data.signatory.name}</Text>
              <Text style={styles.signatureTitle}>{data.signatory.title}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Laporan ini dibuat secara otomatis oleh sistem MyAeroTravel ID</Text>
          <Text>Dicetak pada: {new Date(data.generatedAt).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</Text>
        </View>
      </Page>
    </Document>
  );
}

